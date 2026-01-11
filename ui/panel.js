/**
 * Interfacing - UI Panel
 * Main panel component for inventory, vitals widget, etc.
 */

import { 
    getEquippedItems, 
    getConsumables, 
    getActiveEffects,
    getAggregatedBonuses,
    equipItem,
    unequipItem,
    useConsumable,
    addCustomItem,
    getClothesSlot
} from '../systems/inventory.js';
import { getVitals, onVitalChange } from '../systems/vitals.js';
import { CATEGORIES, PRESET_ITEMS, getItemOwnerSkill, formatModifier } from '../data/items.js';

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

let panelElement = null;
let vitalsWidgetElement = null;
let fabElement = null;
let isPanelOpen = false;
let currentTab = 'inventory';

const TABS = {
    inventory: { name: 'Inventory', icon: '📦' },
    vitals: { name: 'Vitals', icon: '💔' },
    // choices: { name: 'Choices', icon: '🎲' }  // TODO
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initPanel(context) {
    createFAB();
    createVitalsWidget();
    createPanel();
    
    // Subscribe to vital changes
    onVitalChange(updateVitalsDisplay);
    
    console.log('[Interfacing:UI] Panel initialized');
}

// ═══════════════════════════════════════════════════════════════
// FAB (Floating Action Button)
// ═══════════════════════════════════════════════════════════════

function createFAB() {
    fabElement = document.createElement('div');
    fabElement.id = 'interfacing-fab';
    fabElement.className = 'interfacing-fab';
    fabElement.innerHTML = '🔧';  // Interfacing icon
    fabElement.title = 'Interfacing';
    
    fabElement.addEventListener('click', togglePanel);
    
    // Make draggable later
    document.body.appendChild(fabElement);
}

// ═══════════════════════════════════════════════════════════════
// VITALS WIDGET (always visible)
// ═══════════════════════════════════════════════════════════════

function createVitalsWidget() {
    vitalsWidgetElement = document.createElement('div');
    vitalsWidgetElement.id = 'interfacing-vitals-widget';
    vitalsWidgetElement.className = 'interfacing-vitals-widget';
    
    updateVitalsDisplay();
    
    document.body.appendChild(vitalsWidgetElement);
}

export function updateVitalsDisplay() {
    if (!vitalsWidgetElement) return;
    
    const { health, morale } = getVitals();
    
    const healthPercent = (health.current / health.max) * 100;
    const moralePercent = (morale.current / morale.max) * 100;
    
    const healthClass = health.current <= health.max * 0.25 ? 'critical' : '';
    const moraleClass = morale.current <= morale.max * 0.25 ? 'critical' : '';
    
    vitalsWidgetElement.innerHTML = `
        <div class="vital-row">
            <span class="vital-label">HEALTH</span>
            <div class="vital-bar-container">
                <div class="vital-bar health ${healthClass}" style="width: ${healthPercent}%"></div>
            </div>
            <span class="vital-value">${health.current}/${health.max}</span>
        </div>
        <div class="vital-row">
            <span class="vital-label">MORALE</span>
            <div class="vital-bar-container">
                <div class="vital-bar morale ${moraleClass}" style="width: ${moralePercent}%"></div>
            </div>
            <span class="vital-value">${morale.current}/${morale.max}</span>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════════

function createPanel() {
    panelElement = document.createElement('div');
    panelElement.id = 'interfacing-panel';
    panelElement.className = 'interfacing-panel hidden';
    
    panelElement.innerHTML = `
        <div class="interfacing-panel-header">
            <span class="interfacing-panel-icon">🔧</span>
            <span class="interfacing-panel-title">INTERFACING</span>
            <button class="interfacing-panel-close">×</button>
        </div>
        <div class="interfacing-tabs">
            ${Object.entries(TABS).map(([id, tab]) => `
                <button class="interfacing-tab ${id === currentTab ? 'active' : ''}" data-tab="${id}">
                    <span class="tab-icon">${tab.icon}</span>
                    <span class="tab-name">${tab.name}</span>
                </button>
            `).join('')}
        </div>
        <div class="interfacing-panel-content">
            <!-- Content rendered by tab -->
        </div>
    `;
    
    // Event listeners
    panelElement.querySelector('.interfacing-panel-close').addEventListener('click', hidePanel);
    panelElement.querySelectorAll('.interfacing-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    document.body.appendChild(panelElement);
    
    // Initial render
    renderCurrentTab();
}

function switchTab(tabId) {
    currentTab = tabId;
    
    panelElement.querySelectorAll('.interfacing-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    renderCurrentTab();
}

function renderCurrentTab() {
    const content = panelElement.querySelector('.interfacing-panel-content');
    
    switch (currentTab) {
        case 'inventory':
            content.innerHTML = renderInventoryTab();
            attachInventoryListeners(content);
            break;
        case 'vitals':
            content.innerHTML = renderVitalsTab();
            break;
        default:
            content.innerHTML = '<p>Coming soon...</p>';
    }
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY TAB
// ═══════════════════════════════════════════════════════════════

function renderInventoryTab() {
    const equipped = getEquippedItems();
    const consumables = getConsumables();
    const activeEffects = getActiveEffects();
    const bonuses = getAggregatedBonuses();
    
    return `
        <div class="inventory-tab">
            <!-- Equipped Items -->
            <section class="inventory-section">
                <h3>// EQUIPPED</h3>
                <div class="equipped-grid">
                    ${renderEquippedCategory('clothes', '👔', 'Clothes')}
                    ${renderEquippedCategory('tools', '🔧', 'Tools')}
                    ${renderEquippedCategory('held', '✋', 'Held')}
                </div>
            </section>
            
            <!-- Bonuses Summary -->
            <section class="inventory-section bonuses-section">
                <h3>// BONUSES FROM ITEMS</h3>
                <div class="bonuses-list">
                    ${renderBonuses(bonuses)}
                </div>
            </section>
            
            <!-- Consumables -->
            <section class="inventory-section">
                <h3>// CONSUMABLES</h3>
                <div class="consumables-list">
                    ${renderConsumables(consumables, activeEffects)}
                </div>
                <button class="add-item-btn" data-action="add-consumable">+ Add Consumable</button>
            </section>
            
            <!-- Add Item -->
            <section class="inventory-section">
                <button class="add-item-btn wide" data-action="add-item">+ Add Item</button>
                <button class="add-item-btn wide preset" data-action="browse-presets">📋 Browse Presets</button>
            </section>
        </div>
    `;
}

function renderEquippedCategory(category, icon, label) {
    const equipped = getEquippedItems().filter(item => item.category === category);
    
    return `
        <div class="equipped-category">
            <div class="category-header">
                <span class="category-icon">${icon}</span>
                <span class="category-label">${label}</span>
            </div>
            <div class="equipped-items">
                ${equipped.length === 0 
                    ? '<div class="empty-slot">Empty</div>'
                    : equipped.map(item => renderEquippedItem(item)).join('')
                }
            </div>
        </div>
    `;
}

function renderEquippedItem(item) {
    const ownerSkill = getItemOwnerSkill(item);
    const modifierText = Object.entries(item.modifiers || {})
        .map(([skill, val]) => `${formatModifier(val)} ${formatSkillName(skill)}`)
        .join(', ');
    
    return `
        <div class="equipped-item" data-item-id="${item.id}">
            <div class="item-name">${item.name}</div>
            <div class="item-modifiers">${modifierText}</div>
            <button class="item-remove" data-action="unequip" data-item-id="${item.id}">×</button>
        </div>
    `;
}

function renderBonuses(bonuses) {
    const entries = Object.entries(bonuses).sort((a, b) => b[1] - a[1]);
    
    if (entries.length === 0) {
        return '<div class="no-bonuses">No equipment bonuses</div>';
    }
    
    return entries.map(([skillId, value]) => {
        const isPositive = value > 0;
        const className = isPositive ? 'bonus-positive' : 'bonus-negative';
        return `
            <div class="bonus-row ${className}">
                <span class="bonus-skill">${formatSkillName(skillId)}</span>
                <span class="bonus-value">${formatModifier(value)}</span>
            </div>
        `;
    }).join('');
}

function renderConsumables(consumables, activeEffects) {
    if (consumables.length === 0 && activeEffects.length === 0) {
        return '<div class="no-consumables">No consumables</div>';
    }
    
    let html = '';
    
    // Active effects first
    for (const effect of activeEffects) {
        html += `
            <div class="consumable-item active">
                <span class="consumable-icon">⚡</span>
                <span class="consumable-name">${effect.item.name}</span>
                <span class="consumable-duration">${effect.messagesRemaining} msgs left</span>
            </div>
        `;
    }
    
    // Then inventory
    for (const { item, quantity } of consumables) {
        html += `
            <div class="consumable-item" data-item-id="${item.id}">
                <span class="consumable-icon">${CATEGORIES.consumable.icon}</span>
                <span class="consumable-name">${item.name}</span>
                <span class="consumable-quantity">×${quantity}</span>
                <button class="consumable-use" data-action="use" data-item-id="${item.id}">Use</button>
            </div>
        `;
    }
    
    return html;
}

function attachInventoryListeners(content) {
    // Unequip buttons
    content.querySelectorAll('[data-action="unequip"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            unequipItem(itemId);
            renderCurrentTab();
        });
    });
    
    // Use consumable
    content.querySelectorAll('[data-action="use"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.itemId;
            useConsumable(itemId);
            renderCurrentTab();
        });
    });
    
    // Add item button
    content.querySelector('[data-action="add-item"]')?.addEventListener('click', showAddItemDialog);
    
    // Browse presets
    content.querySelector('[data-action="browse-presets"]')?.addEventListener('click', showPresetsDialog);
}

// ═══════════════════════════════════════════════════════════════
// VITALS TAB
// ═══════════════════════════════════════════════════════════════

function renderVitalsTab() {
    const { health, morale } = getVitals();
    
    return `
        <div class="vitals-tab">
            <section class="vitals-section">
                <h3>// HEALTH</h3>
                <div class="vital-display health">
                    <div class="vital-bar-large">
                        <div class="vital-fill" style="width: ${(health.current / health.max) * 100}%"></div>
                    </div>
                    <div class="vital-numbers">${health.current} / ${health.max}</div>
                </div>
                <p class="vital-description">Physical damage. When this reaches zero, you die.</p>
                <div class="vital-controls">
                    <button data-action="damage-health">−1 Damage</button>
                    <button data-action="heal-health">+1 Heal</button>
                </div>
            </section>
            
            <section class="vitals-section">
                <h3>// MORALE</h3>
                <div class="vital-display morale">
                    <div class="vital-bar-large">
                        <div class="vital-fill" style="width: ${(morale.current / morale.max) * 100}%"></div>
                    </div>
                    <div class="vital-numbers">${morale.current} / ${morale.max}</div>
                </div>
                <p class="vital-description">Psychological damage. When this reaches zero, you give up.</p>
                <div class="vital-controls">
                    <button data-action="damage-morale">−1 Damage</button>
                    <button data-action="heal-morale">+1 Heal</button>
                </div>
            </section>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// DIALOGS
// ═══════════════════════════════════════════════════════════════

function showAddItemDialog() {
    // TODO: Implement add item dialog
    console.log('[Interfacing] Add item dialog - TODO');
}

function showPresetsDialog() {
    // TODO: Implement presets browser
    console.log('[Interfacing] Presets dialog - TODO');
}

// ═══════════════════════════════════════════════════════════════
// PANEL CONTROLS
// ═══════════════════════════════════════════════════════════════

export function showPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
        isPanelOpen = true;
        renderCurrentTab();
    }
}

export function hidePanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
        isPanelOpen = false;
    }
}

export function togglePanel() {
    if (isPanelOpen) {
        hidePanel();
    } else {
        showPanel();
    }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatSkillName(skillId) {
    return skillId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
