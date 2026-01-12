/**
 * Interfacing - Disco Elysium Gameplay Systems
 * Companion extension to Inland Empire
 */

(function() {
    'use strict';
    
    const extensionName = 'Interfacing';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    let IE = null;
    let isIEConnected = false;
    let extensionSettings = { 
        enabled: true, 
        baseHealth: 3, 
        baseMorale: 3,
        fabPosition: null,
        vitalsPosition: null,
        ledger: null
    };
    
    let equipped = { clothes: {}, tools: [], held: [] };
    let consumables = [];
    let activeEffects = [];
    
    let vitals = {
        health: { current: 3, max: 3 },
        morale: { current: 3, max: 3 }
    };
    
    let panelElement = null;
    let vitalsWidgetElement = null;
    let fabElement = null;
    let isPanelOpen = false;
    let currentTab = 'inventory';
    
    // Ledger state - tasks/quests journal
    let ledger = {
        officerInitials: 'HDB',
        caseNumber: 41,
        tasks: {
            active: [],
            completed: []
        }
    };
    
    // ═══════════════════════════════════════════════════════════════
    // INVENTORY
    // ═══════════════════════════════════════════════════════════════
    
    function equipItem(item) {
        if (!item) return null;
        
        var previousItem = null;
        
        if (item.category === 'clothes') {
            if (item.slot) {
                previousItem = equipped.clothes[item.slot] || null;
                equipped.clothes[item.slot] = item;
            }
        } else if (item.category === 'tools') {
            if (!equipped.tools.find(function(t) { return t.id === item.id; })) {
                equipped.tools.push(item);
            }
        } else if (item.category === 'held') {
            if (equipped.held.length >= 2) {
                previousItem = equipped.held.shift();
            }
            if (!equipped.held.find(function(h) { return h.id === item.id; })) {
                equipped.held.push(item);
            }
        } else if (item.category === 'consumable') {
            addConsumable(item);
            return null;
        }
        
        syncItemToIE(item, true);
        if (previousItem) syncItemToIE(previousItem, false);
        return previousItem;
    }
    
    function unequipItem(itemOrId) {
        var itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
        var removed = null;
        
        Object.keys(equipped.clothes).forEach(function(slot) {
            if (equipped.clothes[slot] && equipped.clothes[slot].id === itemId) {
                removed = equipped.clothes[slot];
                delete equipped.clothes[slot];
            }
        });
        
        if (!removed) {
            var toolIdx = equipped.tools.findIndex(function(t) { return t.id === itemId; });
            if (toolIdx !== -1) removed = equipped.tools.splice(toolIdx, 1)[0];
        }
        
        if (!removed) {
            var heldIdx = equipped.held.findIndex(function(h) { return h.id === itemId; });
            if (heldIdx !== -1) removed = equipped.held.splice(heldIdx, 1)[0];
        }
        
        if (removed) syncItemToIE(removed, false);
        renderCurrentTab();
        return removed;
    }
    
    function getEquippedItems() {
        var items = [];
        Object.values(equipped.clothes).forEach(function(item) { if (item) items.push(item); });
        items = items.concat(equipped.tools);
        items = items.concat(equipped.held);
        return items;
    }
    
    function addConsumable(item, quantity) {
        quantity = quantity || 1;
        if (!item || item.category !== 'consumable') return;
        
        var existing = consumables.find(function(c) { return c.item.id === item.id; });
        if (existing) {
            existing.quantity += quantity;
        } else {
            consumables.push({ item: item, quantity: quantity });
        }
    }
    
    function useConsumable(itemId) {
        var consumable = consumables.find(function(c) { return c.item.id === itemId; });
        if (!consumable || consumable.quantity <= 0) return null;
        
        consumable.quantity--;
        if (consumable.quantity <= 0) {
            consumables = consumables.filter(function(c) { return c.item.id !== itemId; });
        }
        
        var effect = {
            itemId: consumable.item.id,
            item: consumable.item,
            messagesRemaining: consumable.item.duration || 10,
            modifiers: Object.assign({}, consumable.item.modifiers)
        };
        
        activeEffects.push(effect);
        syncConsumableToIE(effect, true);
        renderCurrentTab();
        return effect;
    }
    
    function getAggregatedBonuses() {
        var totals = {};
        getEquippedItems().forEach(function(item) {
            if (item.modifiers) {
                Object.keys(item.modifiers).forEach(function(skillId) {
                    totals[skillId] = (totals[skillId] || 0) + item.modifiers[skillId];
                });
            }
        });
        activeEffects.forEach(function(effect) {
            Object.keys(effect.modifiers).forEach(function(skillId) {
                totals[skillId] = (totals[skillId] || 0) + effect.modifiers[skillId];
            });
        });
        return totals;
    }
    
    function formatModifier(value) { return value > 0 ? '+' + value : '' + value; }
    
    function formatSkillName(skillId) {
        return skillId.split('_').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VITALS
    // ═══════════════════════════════════════════════════════════════
    
    function initVitals(maxHealth, maxMorale) {
        vitals.health.max = maxHealth;
        vitals.health.current = maxHealth;
        vitals.morale.max = maxMorale;
        vitals.morale.current = maxMorale;
        updateVitalsDisplay();
    }
    
    function damageHealth(amount) {
        vitals.health.current = Math.max(0, vitals.health.current - amount);
        updateVitalsDisplay();
    }
    
    function damageMorale(amount) {
        vitals.morale.current = Math.max(0, vitals.morale.current - amount);
        updateVitalsDisplay();
    }
    
    function healHealth(amount) {
        vitals.health.current = Math.min(vitals.health.max, vitals.health.current + amount);
        updateVitalsDisplay();
    }
    
    function healMorale(amount) {
        vitals.morale.current = Math.min(vitals.morale.max, vitals.morale.current + amount);
        updateVitalsDisplay();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // IE INTEGRATION
    // ═══════════════════════════════════════════════════════════════
    
    function connectToInlandEmpire() {
        if (window.InlandEmpire) {
            onIEConnected(window.InlandEmpire);
            return;
        }
        
        document.addEventListener('ie:ready', function() {
            console.log('[Interfacing] IE connected');
            onIEConnected(window.InlandEmpire);
        });
        
        setTimeout(function() {
            if (!isIEConnected) {
                console.log('[Interfacing] Running standalone');
                initVitals(extensionSettings.baseHealth || 3, extensionSettings.baseMorale || 3);
            }
        }, 3000);
    }
    
    function onIEConnected(ieApi) {
        IE = ieApi;
        isIEConnected = true;
        
        document.addEventListener('ie:skill-check', onSkillCheck);
        
        var endurance = IE.getEffectiveSkillLevel ? IE.getEffectiveSkillLevel('endurance') : 2;
        var volition = IE.getEffectiveSkillLevel ? IE.getEffectiveSkillLevel('volition') : 2;
        initVitals((extensionSettings.baseHealth || 3) + endurance, (extensionSettings.baseMorale || 3) + volition);
        
        getEquippedItems().forEach(function(item) { syncItemToIE(item, true); });
    }
    
    function onSkillCheck(event) {
        var d = event.detail || {};
        if (!d.success) {
            if (d.attribute === 'PHYSIQUE' || d.attribute === 'MOTORICS') damageHealth(1);
            else damageMorale(1);
        }
        if (d.isSnakeEyes) {
            if (d.attribute === 'PHYSIQUE' || d.attribute === 'MOTORICS') damageHealth(1);
            else damageMorale(1);
        }
    }
    
    function syncItemToIE(item, isEquipping) {
        if (!IE || !IE.registerModifier) return;
        if (isEquipping && item.modifiers) {
            Object.keys(item.modifiers).forEach(function(skillId) {
                IE.registerModifier(item.id, skillId, item.modifiers[skillId]);
            });
        } else if (IE.removeModifierSource) {
            IE.removeModifierSource(item.id);
        }
    }
    
    function syncConsumableToIE(effect, isApplying) {
        if (!IE || !IE.registerModifier) return;
        var sourceId = 'consumable_' + effect.itemId;
        if (isApplying) {
            Object.keys(effect.modifiers).forEach(function(skillId) {
                IE.registerModifier(sourceId, skillId, effect.modifiers[skillId]);
            });
        } else if (IE.removeModifierSource) {
            IE.removeModifierSource(sourceId);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UI
    // ═══════════════════════════════════════════════════════════════
    
    function createFAB() {
        fabElement = document.createElement('div');
        fabElement.id = 'interfacing-fab';
        fabElement.innerHTML = '🔧';
        fabElement.title = 'Interfacing';
        
        fabElement.setAttribute('style', 
            'position: fixed; ' +
            'top: 60px; ' +
            'right: 10px; ' +
            'width: 40px; ' +
            'height: 40px; ' +
            'background: #252530; ' +
            'border: 2px solid #bfa127; ' +
            'border-radius: 8px; ' +
            'display: flex; ' +
            'align-items: center; ' +
            'justify-content: center; ' +
            'font-size: 18px; ' +
            'cursor: pointer; ' +
            'z-index: 99999; ' +
            'box-shadow: 0 2px 8px rgba(0,0,0,0.5); ' +
            'user-select: none;'
        );
        
        fabElement.addEventListener('click', function(e) {
            if (!fabElement.dataset.justDragged) {
                togglePanel();
            }
            fabElement.dataset.justDragged = '';
        });
        
        makeDraggable(fabElement, 'fabPosition');
        document.body.appendChild(fabElement);
        
        if (extensionSettings.fabPosition) {
            fabElement.style.top = extensionSettings.fabPosition.top + 'px';
            fabElement.style.right = 'auto';
            fabElement.style.left = extensionSettings.fabPosition.left + 'px';
        }
        
        console.log('[Interfacing] FAB created');
    }
    
    function createVitalsWidget() {
        vitalsWidgetElement = document.createElement('div');
        vitalsWidgetElement.id = 'interfacing-vitals-widget';
        
        vitalsWidgetElement.setAttribute('style',
            'position: fixed; ' +
            'top: 110px; ' +
            'right: 10px; ' +
            'width: 130px; ' +
            'background: #1a1a1f; ' +
            'border: 1px solid #3a3a4a; ' +
            'border-radius: 6px; ' +
            'padding: 8px; ' +
            'z-index: 99998; ' +
            'font-family: Segoe UI, system-ui, sans-serif; ' +
            'box-shadow: 0 2px 8px rgba(0,0,0,0.3); ' +
            'cursor: move; ' +
            'user-select: none;'
        );
        
        makeDraggable(vitalsWidgetElement, 'vitalsPosition');
        
        if (extensionSettings.vitalsPosition) {
            vitalsWidgetElement.style.top = extensionSettings.vitalsPosition.top + 'px';
            vitalsWidgetElement.style.right = 'auto';
            vitalsWidgetElement.style.left = extensionSettings.vitalsPosition.left + 'px';
        }
        
        updateVitalsDisplay();
        document.body.appendChild(vitalsWidgetElement);
        console.log('[Interfacing] Vitals widget created');
    }
    
    function makeDraggable(element, saveKey) {
        var isDragging = false;
        var startX, startY, startLeft, startTop;
        var hasMoved = false;
        
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, {passive: false});
        
        function startDrag(e) {
            isDragging = true;
            hasMoved = false;
            
            var touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            
            var rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag, {passive: false});
            document.addEventListener('touchend', stopDrag);
        }
        
        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            var touch = e.touches ? e.touches[0] : e;
            var dx = touch.clientX - startX;
            var dy = touch.clientY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
                element.dataset.justDragged = 'true';
            }
            
            var newLeft = startLeft + dx;
            var newTop = startTop + dy;
            
            newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
            
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.right = 'auto';
        }
        
        function stopDrag() {
            if (isDragging && hasMoved && saveKey) {
                extensionSettings[saveKey] = {
                    left: parseInt(element.style.left),
                    top: parseInt(element.style.top)
                };
                saveSettings();
            }
            
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);
            
            setTimeout(function() {
                element.dataset.justDragged = '';
            }, 100);
        }
    }
    
    function saveSettings() {
        try {
            var context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            if (context && context.extensionSettings) {
                extensionSettings.ledger = ledger;
                context.extensionSettings.interfacing = extensionSettings;
                context.saveSettingsDebounced();
            }
        } catch(e) {
            console.log('[Interfacing] Could not save settings:', e);
        }
    }
    
    function loadSettings() {
        try {
            var context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            if (context && context.extensionSettings && context.extensionSettings.interfacing) {
                var saved = context.extensionSettings.interfacing;
                
                if (saved.fabPosition) extensionSettings.fabPosition = saved.fabPosition;
                if (saved.vitalsPosition) extensionSettings.vitalsPosition = saved.vitalsPosition;
                if (saved.baseHealth) extensionSettings.baseHealth = saved.baseHealth;
                if (saved.baseMorale) extensionSettings.baseMorale = saved.baseMorale;
                
                if (saved.ledger) {
                    ledger = saved.ledger;
                    if (!ledger.tasks) ledger.tasks = { active: [], completed: [] };
                    if (!ledger.tasks.active) ledger.tasks.active = [];
                    if (!ledger.tasks.completed) ledger.tasks.completed = [];
                }
                
                console.log('[Interfacing] Settings loaded');
            }
        } catch(e) {
            console.log('[Interfacing] Could not load settings:', e);
        }
    }
    
    function updateVitalsDisplay() {
        if (!vitalsWidgetElement) return;
        var hp = (vitals.health.current / vitals.health.max) * 100;
        var mp = (vitals.morale.current / vitals.morale.max) * 100;
        var hCrit = vitals.health.current <= vitals.health.max * 0.25;
        var mCrit = vitals.morale.current <= vitals.morale.max * 0.25;
        
        var healthColor = hCrit ? '#ff4444' : '#c4a35a';
        var moraleColor = mCrit ? '#ff4444' : '#0d738a';
        
        vitalsWidgetElement.innerHTML = 
            '<div style="margin-bottom:6px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:2px;">' +
                    '<span>HEALTH</span><span>' + vitals.health.current + '/' + vitals.health.max + '</span>' +
                '</div>' +
                '<div style="background:#1a1510;border-radius:2px;height:8px;overflow:hidden;">' +
                    '<div style="background:' + healthColor + ';height:100%;width:' + hp + '%;transition:width 0.3s;' + (hCrit ? 'animation:pulse 1s infinite;' : '') + '"></div>' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:2px;">' +
                    '<span>MORALE</span><span>' + vitals.morale.current + '/' + vitals.morale.max + '</span>' +
                '</div>' +
                '<div style="background:#0a1a1d;border-radius:2px;height:8px;overflow:hidden;">' +
                    '<div style="background:' + moraleColor + ';height:100%;width:' + mp + '%;transition:width 0.3s;' + (mCrit ? 'animation:pulse 1s infinite;' : '') + '"></div>' +
                '</div>' +
            '</div>';
    }
    
    function createPanel() {
        panelElement = document.createElement('div');
        panelElement.id = 'interfacing-panel';
        panelElement.className = 'interfacing-panel hidden';
        panelElement.style.cssText = 'position:fixed;top:100px;left:60px;width:340px;max-height:70vh;background:#1a1a1f;border:1px solid #3a3a4a;border-radius:8px;z-index:100000;font-family:Segoe UI,system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;';
        
        panelElement.innerHTML = 
            '<div class="interfacing-panel-header">' +
                '<span class="interfacing-panel-icon">🔧</span>' +
                '<span class="interfacing-panel-title">INTERFACING</span>' +
                '<button class="interfacing-panel-close">×</button>' +
            '</div>' +
            '<div class="interfacing-tabs">' +
                '<button class="interfacing-tab active" data-tab="inventory">📦</button>' +
                '<button class="interfacing-tab" data-tab="vitals">💔</button>' +
                '<button class="interfacing-tab" data-tab="ledger">📒</button>' +
            '</div>' +
            '<div class="interfacing-panel-content"></div>';
        
        panelElement.querySelector('.interfacing-panel-close').addEventListener('click', hidePanel);
        panelElement.querySelectorAll('.interfacing-tab').forEach(function(tab) {
            tab.addEventListener('click', function() { switchTab(tab.dataset.tab); });
        });
        
        document.body.appendChild(panelElement);
        renderCurrentTab();
    }
    
    function switchTab(tabId) {
        currentTab = tabId;
        panelElement.querySelectorAll('.interfacing-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        renderCurrentTab();
    }
    
    function renderCurrentTab() {
        if (!panelElement) return;
        var content = panelElement.querySelector('.interfacing-panel-content');
        if (currentTab === 'inventory') {
            content.innerHTML = renderInventoryTab();
            attachInventoryListeners(content);
        } else if (currentTab === 'vitals') {
            content.innerHTML = renderVitalsTab();
            attachVitalsListeners(content);
        } else if (currentTab === 'ledger') {
            content.innerHTML = renderLedgerTab();
            attachLedgerListeners(content);
        }
    }
    
    function renderInventoryTab() {
        var bonuses = getAggregatedBonuses();
        var html = '<div class="inventory-tab">';
        
        html += '<section class="inventory-section"><h3>// EQUIPPED</h3><div class="equipped-grid">';
        html += renderEquippedCategory('clothes', '👔', 'Clothes');
        html += renderEquippedCategory('tools', '🔧', 'Tools');
        html += renderEquippedCategory('held', '✋', 'Held');
        html += '</div></section>';
        
        html += '<section class="inventory-section bonuses-section"><h3>// BONUSES FROM ITEMS</h3>';
        html += '<div class="bonuses-list">' + renderBonuses(bonuses) + '</div></section>';
        
        html += '<section class="inventory-section"><h3>// CONSUMABLES</h3>';
        html += '<div class="consumables-list">' + renderConsumables() + '</div></section>';
        
        html += '</div>';
        
        return html;
    }
    
    function renderEquippedCategory(category, icon, label) {
        var items = getEquippedItems().filter(function(i) { return i.category === category; });
        var html = '<div class="equipped-category"><div class="category-header">' +
            '<span class="category-icon">' + icon + '</span><span class="category-label">' + label + '</span></div>' +
            '<div class="equipped-items">';
        
        if (items.length === 0) {
            html += '<div class="empty-slot">Empty</div>';
        } else {
            items.forEach(function(item) {
                var mods = Object.keys(item.modifiers || {}).map(function(k) {
                    return formatModifier(item.modifiers[k]) + ' ' + formatSkillName(k);
                }).join(', ');
                html += '<div class="equipped-item"><div class="item-name">' + item.name + '</div>' +
                    '<div class="item-modifiers">' + mods + '</div>' +
                    '<button class="item-remove" data-action="unequip" data-item-id="' + item.id + '">×</button></div>';
            });
        }
        html += '</div></div>';
        return html;
    }
    
    function renderBonuses(bonuses) {
        var entries = Object.entries(bonuses).sort(function(a, b) { return b[1] - a[1]; });
        if (entries.length === 0) return '<div class="no-bonuses">No equipment bonuses</div>';
        return entries.map(function(e) {
            var cls = e[1] > 0 ? 'bonus-positive' : 'bonus-negative';
            return '<div class="bonus-row ' + cls + '"><span class="bonus-skill">' + formatSkillName(e[0]) + 
                '</span><span class="bonus-value">' + formatModifier(e[1]) + '</span></div>';
        }).join('');
    }
    
    function renderConsumables() {
        if (consumables.length === 0 && activeEffects.length === 0) {
            return '<div class="no-consumables">No consumables</div>';
        }
        var html = '';
        activeEffects.forEach(function(e) {
            html += '<div class="consumable-item active"><span class="consumable-icon">⚡</span>' +
                '<span class="consumable-name">' + e.item.name + '</span>' +
                '<span class="consumable-duration">' + e.messagesRemaining + ' msgs</span></div>';
        });
        consumables.forEach(function(c) {
            html += '<div class="consumable-item"><span class="consumable-icon">💊</span>' +
                '<span class="consumable-name">' + c.item.name + '</span>' +
                '<span class="consumable-quantity">×' + c.quantity + '</span>' +
                '<button class="consumable-use" data-action="use" data-item-id="' + c.item.id + '">Use</button></div>';
        });
        return html;
    }
    
    function renderVitalsTab() {
        var hp = (vitals.health.current / vitals.health.max) * 100;
        var mp = (vitals.morale.current / vitals.morale.max) * 100;
        var healthColor = '#c4a35a';
        var moraleColor = '#0d738a';
        return '<div class="vitals-tab">' +
            '<section class="vitals-section"><h3>// HEALTH</h3>' +
            '<div class="vital-display health"><div class="vital-bar-large" style="background:#1a1510;">' +
            '<div class="vital-fill" style="width:' + hp + '%;background:' + healthColor + ';"></div></div>' +
            '<div class="vital-numbers">' + vitals.health.current + ' / ' + vitals.health.max + '</div></div>' +
            '<p class="vital-description">Physical damage. When this reaches zero, you die.</p>' +
            '<div class="vital-controls"><button data-action="damage-health">−1</button>' +
            '<button data-action="heal-health">+1</button></div></section>' +
            '<section class="vitals-section"><h3>// MORALE</h3>' +
            '<div class="vital-display morale"><div class="vital-bar-large" style="background:#0a1a1d;">' +
            '<div class="vital-fill" style="width:' + mp + '%;background:' + moraleColor + ';"></div></div>' +
            '<div class="vital-numbers">' + vitals.morale.current + ' / ' + vitals.morale.max + '</div></div>' +
            '<p class="vital-description">Psychological damage. When this reaches zero, you give up.</p>' +
            '<div class="vital-controls"><button data-action="damage-morale">−1</button>' +
            '<button data-action="heal-morale">+1</button></div></section></div>';
    }
    
    function renderLedgerTab() {
        var html = '<div class="ledger-tab" style="padding:12px;">';
        
        html += '<div class="ledger-header" style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #3a3a4a;">';
        html += '<div style="font-size:10px;color:#666;text-transform:uppercase;">Case File</div>';
        html += '<div style="font-size:14px;color:#c4a35a;font-weight:bold;">' + ledger.officerInitials + ledger.caseNumber.toString().padStart(3, '0') + '</div>';
        html += '</div>';
        
        html += '<section class="ledger-section">';
        html += '<h3 style="font-size:11px;color:#888;margin:0 0 8px 0;text-transform:uppercase;">// Active Tasks</h3>';
        
        if (ledger.tasks.active.length === 0) {
            html += '<div style="color:#555;font-style:italic;font-size:12px;">No active tasks</div>';
        } else {
            ledger.tasks.active.forEach(function(task, idx) {
                html += '<div class="ledger-task" style="background:#252530;border-radius:4px;padding:8px;margin-bottom:6px;border-left:3px solid #c4a35a;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:start;">';
                html += '<span style="color:#ddd;font-size:12px;">' + task.text + '</span>';
                html += '<button data-action="complete-task" data-idx="' + idx + '" style="background:#2a4a2a;border:none;color:#6a6;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">✓</button>';
                html += '</div>';
                if (task.notes) {
                    html += '<div style="color:#888;font-size:10px;margin-top:4px;font-style:italic;">' + task.notes + '</div>';
                }
                html += '</div>';
            });
        }
        html += '</section>';
        
        html += '<section class="ledger-section" style="margin-top:12px;">';
        html += '<h3 style="font-size:11px;color:#666;margin:0 0 8px 0;text-transform:uppercase;">// Completed (' + ledger.tasks.completed.length + ')</h3>';
        
        if (ledger.tasks.completed.length > 0) {
            var showCount = Math.min(5, ledger.tasks.completed.length);
            ledger.tasks.completed.slice(-showCount).reverse().forEach(function(task) {
                html += '<div style="color:#555;font-size:11px;text-decoration:line-through;margin-bottom:4px;">' + task.text + '</div>';
            });
            if (ledger.tasks.completed.length > 5) {
                html += '<div style="color:#444;font-size:10px;">...and ' + (ledger.tasks.completed.length - 5) + ' more</div>';
            }
        }
        html += '</section>';
        
        html += '<div class="ledger-add" style="margin-top:12px;padding-top:12px;border-top:1px solid #3a3a4a;">';
        html += '<input type="text" id="ledger-new-task" placeholder="New task..." style="width:100%;background:#252530;border:1px solid #3a3a4a;border-radius:4px;padding:8px;color:#ddd;font-size:12px;box-sizing:border-box;">';
        html += '<button data-action="add-task" style="width:100%;margin-top:6px;background:#3a3a4a;border:none;color:#aaa;padding:8px;border-radius:4px;cursor:pointer;font-size:11px;">+ Add Task</button>';
        html += '</div>';
        
        html += '<div class="ledger-settings" style="margin-top:12px;padding-top:12px;border-top:1px solid #3a3a4a;">';
        html += '<div style="font-size:10px;color:#555;margin-bottom:6px;">Officer Initials</div>';
        html += '<input type="text" id="ledger-initials" value="' + ledger.officerInitials + '" maxlength="4" style="width:60px;background:#252530;border:1px solid #3a3a4a;border-radius:4px;padding:4px 8px;color:#c4a35a;font-size:12px;text-transform:uppercase;">';
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    
    function attachLedgerListeners(content) {
        var addBtn = content.querySelector('[data-action="add-task"]');
        var input = content.querySelector('#ledger-new-task');
        
        if (addBtn && input) {
            addBtn.addEventListener('click', function() {
                var text = input.value.trim();
                if (text) {
                    ledger.tasks.active.push({ text: text, addedAt: Date.now() });
                    input.value = '';
                    saveSettings();
                    renderCurrentTab();
                }
            });
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            });
        }
        
        content.querySelectorAll('[data-action="complete-task"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.idx);
                var task = ledger.tasks.active.splice(idx, 1)[0];
                if (task) {
                    task.completedAt = Date.now();
                    ledger.tasks.completed.push(task);
                    saveSettings();
                    renderCurrentTab();
                }
            });
        });
        
        var initialsInput = content.querySelector('#ledger-initials');
        if (initialsInput) {
            initialsInput.addEventListener('change', function() {
                ledger.officerInitials = initialsInput.value.toUpperCase().substring(0, 4) || 'HDB';
                saveSettings();
                renderCurrentTab();
            });
        }
    }
    
    function attachInventoryListeners(content) {
        content.querySelectorAll('[data-action="unequip"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) { unequipItem(e.target.dataset.itemId); });
        });
        content.querySelectorAll('[data-action="use"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) { useConsumable(e.target.dataset.itemId); });
        });
    }
    
    function attachVitalsListeners(content) {
        var dh = content.querySelector('[data-action="damage-health"]');
        var hh = content.querySelector('[data-action="heal-health"]');
        var dm = content.querySelector('[data-action="damage-morale"]');
        var hm = content.querySelector('[data-action="heal-morale"]');
        if (dh) dh.addEventListener('click', function() { damageHealth(1); renderCurrentTab(); });
        if (hh) hh.addEventListener('click', function() { healHealth(1); renderCurrentTab(); });
        if (dm) dm.addEventListener('click', function() { damageMorale(1); renderCurrentTab(); });
        if (hm) hm.addEventListener('click', function() { healMorale(1); renderCurrentTab(); });
    }
    
    function showPanel() { 
        if (panelElement) { 
            panelElement.classList.remove('hidden'); 
            panelElement.style.display = 'flex';
            isPanelOpen = true; 
            renderCurrentTab(); 
        } 
    }
    function hidePanel() { 
        if (panelElement) { 
            panelElement.classList.add('hidden'); 
            panelElement.style.display = 'none';
            isPanelOpen = false; 
        } 
    }
    function togglePanel() { isPanelOpen ? hidePanel() : showPanel(); }
    
    // ═══════════════════════════════════════════════════════════════
    // ST EXTENSION PANEL
    // ═══════════════════════════════════════════════════════════════
    
    function addExtensionPanel() {
        const container = document.getElementById('extensions_settings');
        if (!container) {
            console.log('[Interfacing] extensions_settings not found');
            return;
        }
        
        const settingsHtml = `
            <div class="inline-drawer" id="interfacing-extension-settings">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🔧 Interfacing</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div style="padding: 10px;">
                        <p style="margin: 0 0 10px; color: #888;">Disco Elysium gameplay systems.</p>
                        <label class="checkbox_label">
                            <input type="checkbox" id="interfacing-ext-enabled" checked />
                            <span>Enable Interfacing</span>
                        </label>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <button id="interfacing-open-panel-btn" class="menu_button" style="width: 100%;">
                            Open Panel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', settingsHtml);
        
        document.getElementById('interfacing-open-panel-btn')?.addEventListener('click', function() {
            showPanel();
        });
        
        console.log('[Interfacing] Extension panel added');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════
    
    async function init() {
        console.log('[Interfacing] Initializing...');
        
        try {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${extensionFolderPath}/styles.css`;
            document.head.appendChild(link);
            console.log('[Interfacing] CSS loaded');
            
            loadSettings();
            addExtensionPanel();
            createFAB();
            createVitalsWidget();
            createPanel();
            connectToInlandEmpire();
            
            console.log('[Interfacing] Ready!');
            
            if (typeof toastr !== 'undefined') {
                toastr.success('Interfacing loaded!', 'Interfacing', {timeOut: 3000});
            }
        } catch (error) {
            console.error('[Interfacing] Failed to initialize:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Init failed: ' + error.message, 'Interfacing');
            }
        }
    }
    
    jQuery(async () => {
        await init();
    });
    
})();
