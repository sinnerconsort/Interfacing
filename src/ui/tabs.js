/**
 * Interfacing - Tab Content Renderers
 * Renders content for Vitals, Inventory, Ledger, and Settings tabs
 */

import * as status from '../systems/status.js';
import * as inventory from '../systems/inventory.js';
import * as ledger from '../systems/ledger.js';
import * as state from '../core/state.js';
import * as suggestionState from '../suggestion/suggestion-state.js';
import { SKILLS, formatSkillName } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// VITALS TAB
// ═══════════════════════════════════════════════════════════════

export function renderVitalsTab(container) {
    const health = status.getHealth();
    const morale = status.getMorale();
    const conditions = status.getConditions();
    
    const healthPercent = (health.current / health.effectiveMax) * 100;
    const moralePercent = (morale.current / morale.effectiveMax) * 100;
    
    container.innerHTML = `
        <div class="if-section">
            <div class="if-section-title">Vitals</div>
            
            <!-- Health -->
            <div class="if-bar-container">
                <div class="if-bar-label">
                    <span class="if-bar-name">❤️ Health</span>
                    <span class="if-bar-value">${health.current} / ${health.effectiveMax}</span>
                </div>
                <div class="if-bar">
                    <div class="if-bar-fill health ${health.isCritical ? 'critical' : ''}" 
                         style="width: ${healthPercent}%"></div>
                </div>
                <div class="if-vital-controls">
                    <button class="if-vital-btn damage" data-vital="health" data-amount="-1">−</button>
                    <button class="if-vital-btn heal" data-vital="health" data-amount="1">+</button>
                    <span style="font-size: 11px; color: #666; margin-left: auto;">
                        Base ${state.getSetting('baseHealth')} + END ${health.effectiveMax - state.getSetting('baseHealth')}
                    </span>
                </div>
            </div>
            
            <!-- Morale -->
            <div class="if-bar-container">
                <div class="if-bar-label">
                    <span class="if-bar-name">💙 Morale</span>
                    <span class="if-bar-value">${morale.current} / ${morale.effectiveMax}</span>
                </div>
                <div class="if-bar">
                    <div class="if-bar-fill morale ${morale.isCritical ? 'critical' : ''}" 
                         style="width: ${moralePercent}%"></div>
                </div>
                <div class="if-vital-controls">
                    <button class="if-vital-btn damage" data-vital="morale" data-amount="-1">−</button>
                    <button class="if-vital-btn heal" data-vital="morale" data-amount="1">+</button>
                    <span style="font-size: 11px; color: #666; margin-left: auto;">
                        Base ${state.getSetting('baseMorale')} + VOL ${morale.effectiveMax - state.getSetting('baseMorale')}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">Conditions (${conditions.length})</div>
            <div id="if-conditions-list">
                ${conditions.length === 0 
                    ? '<div class="if-empty">No active conditions</div>'
                    : conditions.map(c => renderCondition(c)).join('')
                }
            </div>
            <button class="if-btn if-btn-small" id="if-add-condition" style="margin-top: 8px;">
                + Add Condition
            </button>
        </div>
    `;
    
    // Event listeners
    container.querySelectorAll('.if-vital-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vital = btn.dataset.vital;
            const amount = parseInt(btn.dataset.amount);
            if (vital === 'health') {
                status.modifyHealth(amount);
            } else {
                status.modifyMorale(amount);
            }
            renderVitalsTab(container);
        });
    });
    
    container.querySelectorAll('.if-condition-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            status.removeCondition(btn.dataset.id);
            renderVitalsTab(container);
        });
    });
    
    container.querySelector('#if-add-condition')?.addEventListener('click', () => {
        // TODO: Open condition picker modal
        const name = prompt('Condition name:');
        if (name) {
            status.addCondition({ name, description: 'Custom condition' });
            renderVitalsTab(container);
        }
    });
}

function renderCondition(condition) {
    const isPositive = condition.modifier > 0 || condition.type === 'buff';
    const icon = isPositive ? '✨' : '💀';
    
    return `
        <div class="if-condition">
            <span class="if-condition-icon">${icon}</span>
            <div class="if-condition-info">
                <div class="if-condition-name">${condition.name}</div>
                ${condition.description ? `<div class="if-condition-desc">${condition.description}</div>` : ''}
                ${condition.affects ? `<div class="if-condition-desc">Affects: ${condition.affects.join(', ')}</div>` : ''}
            </div>
            <button class="if-condition-remove" data-id="${condition.id}" title="Remove">✕</button>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY TAB
// ═══════════════════════════════════════════════════════════════

export function renderInventoryTab(container) {
    const equipped = inventory.getAllEquipped();
    const onPerson = inventory.getItemsBySection('onPerson');
    const summary = inventory.getInventorySummary();
    
    container.innerHTML = `
        <div class="if-section">
            <div class="if-section-title">Equipped (${equipped.length})</div>
            <div id="if-equipped-list">
                ${equipped.length === 0 
                    ? '<div class="if-empty">Nothing equipped</div>'
                    : equipped.map(item => renderEquippedItem(item)).join('')
                }
            </div>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">On Person (${onPerson.length})</div>
            <div id="if-items-list">
                ${onPerson.length === 0 
                    ? '<div class="if-empty">Pockets are empty</div>'
                    : onPerson.map(item => renderItem(item)).join('')
                }
            </div>
            <button class="if-btn if-btn-small" id="if-add-item" style="margin-top: 8px;">
                + Add Item
            </button>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">Summary</div>
            <div style="font-size: 12px; color: #888;">
                <div>💰 ${summary.money} reál</div>
                <div>📦 ${summary.totalItems} items total</div>
            </div>
        </div>
    `;
    
    // Event listeners
    container.querySelectorAll('.if-unequip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            inventory.unequipItem(btn.dataset.slot);
            renderInventoryTab(container);
        });
    });
    
    container.querySelector('#if-add-item')?.addEventListener('click', () => {
        const name = prompt('Item name:');
        if (name) {
            inventory.addItem({ name, category: 'misc' }, 'onPerson');
            renderInventoryTab(container);
        }
    });
}

function renderEquippedItem(item) {
    const modifiers = item.modifiers || [];
    const modText = modifiers.map(m => {
        const sign = m.value > 0 ? '+' : '';
        return `<span class="if-tag ${m.value > 0 ? 'positive' : 'negative'}">${sign}${m.value} ${formatSkillName(m.skill)}</span>`;
    }).join('');
    
    return `
        <div class="if-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <div style="font-size: 13px; font-weight: 500;">${item.name}</div>
                    <div style="font-size: 11px; color: #666; text-transform: capitalize;">${item.slot}</div>
                </div>
                <button class="if-btn if-btn-small if-unequip-btn" data-slot="${item.slot}">Remove</button>
            </div>
            ${modText ? `<div style="margin-top: 8px;">${modText}</div>` : ''}
        </div>
    `;
}

function renderItem(item) {
    return `
        <div class="if-card" style="padding: 8px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px;">${item.name}</span>
                <span style="font-size: 11px; color: #666;">${item.quantity > 1 ? `×${item.quantity}` : ''}</span>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// LEDGER TAB
// ═══════════════════════════════════════════════════════════════

export function renderLedgerTab(container) {
    const activeTasks = ledger.getActiveTasks();
    const completedTasks = ledger.getCompletedTasks();
    const memories = ledger.getMemories();
    const contacts = ledger.getContacts();
    
    container.innerHTML = `
        <div class="if-section">
            <div class="if-section-title">Active Tasks (${activeTasks.length})</div>
            <div id="if-tasks-list">
                ${activeTasks.length === 0 
                    ? '<div class="if-empty">No active tasks</div>'
                    : activeTasks.map(t => renderTask(t)).join('')
                }
            </div>
            <button class="if-btn if-btn-small" id="if-add-task" style="margin-top: 8px;">
                + Add Task
            </button>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">Memories (${memories.length})</div>
            <div id="if-memories-list">
                ${memories.length === 0 
                    ? '<div class="if-empty">No memories recorded</div>'
                    : memories.slice(-5).reverse().map(m => renderMemory(m)).join('')
                }
            </div>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">Contacts (${contacts.length})</div>
            <div id="if-contacts-list">
                ${contacts.length === 0 
                    ? '<div class="if-empty">No contacts</div>'
                    : contacts.map(c => renderContact(c)).join('')
                }
            </div>
        </div>
    `;
    
    // Event listeners
    container.querySelectorAll('.if-task-complete').forEach(btn => {
        btn.addEventListener('click', () => {
            ledger.completeTask(btn.dataset.id);
            renderLedgerTab(container);
        });
    });
    
    container.querySelector('#if-add-task')?.addEventListener('click', () => {
        const title = prompt('Task title:');
        if (title) {
            ledger.addTask({ title });
            renderLedgerTab(container);
        }
    });
}

function renderTask(task) {
    const priorityColors = {
        high: '#d65b5b',
        medium: '#bfa127',
        low: '#4a9966'
    };
    const color = priorityColors[task.priority] || '#888';
    
    return `
        <div class="if-card">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
                <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 500;">${task.title}</div>
                    ${task.description ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">${task.description}</div>` : ''}
                </div>
                <button class="if-btn if-btn-small if-task-complete" data-id="${task.id}">✓</button>
            </div>
            <div style="margin-top: 8px;">
                <span class="if-tag" style="background: ${color}20; color: ${color};">${task.priority || 'normal'}</span>
                ${task.category ? `<span class="if-tag">${task.category}</span>` : ''}
            </div>
        </div>
    `;
}

function renderMemory(memory) {
    return `
        <div class="if-card" style="padding: 10px;">
            <div style="font-size: 12px;">${memory.summary}</div>
            <div style="font-size: 10px; color: #666; margin-top: 4px;">
                ${new Date(memory.timestamp).toLocaleDateString()}
            </div>
        </div>
    `;
}

function renderContact(contact) {
    return `
        <div class="if-card" style="padding: 10px;">
            <div style="font-size: 13px; font-weight: 500;">${contact.name}</div>
            ${contact.description ? `<div style="font-size: 11px; color: #888;">${contact.description}</div>` : ''}
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════

export function renderSettingsTab(container) {
    const settings = state.getSettings();
    const sugSettings = suggestionState.getSettings();
    
    container.innerHTML = `
        <div class="if-section">
            <div class="if-section-title">General</div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">Base Health</label>
                <input type="number" class="if-select" id="if-set-base-health" 
                       value="${settings.baseHealth}" min="1" max="10" style="width: 80px;">
            </div>
            
            <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">Base Morale</label>
                <input type="number" class="if-select" id="if-set-base-morale" 
                       value="${settings.baseMorale}" min="1" max="10" style="width: 80px;">
            </div>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">💡 Suggestion</div>
            
            <label class="if-checkbox">
                <input type="checkbox" id="if-set-sug-enabled" ${sugSettings.enabled ? 'checked' : ''}>
                <span>Enable Suggestion</span>
            </label>
            
            <label class="if-checkbox">
                <input type="checkbox" id="if-set-sug-show-fab" ${sugSettings.showFab !== false ? 'checked' : ''}>
                <span>Show 💡 button</span>
            </label>
            
            <div style="margin: 12px 0;">
                <label style="display: block; font-size: 12px; margin-bottom: 4px;">Mode</label>
                <select class="if-select" id="if-set-sug-mode">
                    <option value="manual" ${sugSettings.mode === 'manual' ? 'selected' : ''}>Manual (refresh button)</option>
                    <option value="auto" ${sugSettings.mode === 'auto' ? 'selected' : ''}>Auto (after each message)</option>
                </select>
            </div>
            
            <div class="if-slider-container">
                <div class="if-slider-label">
                    <span>Suggestions</span>
                    <span id="if-sug-count-display">${sugSettings.suggestionCount}</span>
                </div>
                <input type="range" class="if-slider" id="if-set-sug-count" 
                       value="${sugSettings.suggestionCount}" min="3" max="5">
            </div>
            
            <div class="if-slider-container">
                <div class="if-slider-label">
                    <span>Chaos Level</span>
                    <span id="if-sug-chaos-display">${Math.round(sugSettings.chaosLevel * 100)}%</span>
                </div>
                <input type="range" class="if-slider" id="if-set-sug-chaos" 
                       value="${sugSettings.chaosLevel * 100}" min="0" max="100">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-top: 2px;">
                    <span>Practical</span>
                    <span>Unhinged</span>
                </div>
            </div>
            
            <label class="if-checkbox">
                <input type="checkbox" id="if-set-sug-clipboard" ${sugSettings.copyToClipboard ? 'checked' : ''}>
                <span>Copy result to clipboard</span>
            </label>
            
            <label class="if-checkbox">
                <input type="checkbox" id="if-set-sug-autoclose" ${sugSettings.autoCloseOnSelect ? 'checked' : ''}>
                <span>Close panel after selection</span>
            </label>
        </div>
        
        <div class="if-section">
            <div class="if-section-title">Data</div>
            <div class="if-btn-row">
                <button class="if-btn" id="if-export-data">Export</button>
                <button class="if-btn" id="if-import-data">Import</button>
                <button class="if-btn" id="if-reset-data" style="border-color: #8b2222;">Reset</button>
            </div>
        </div>
    `;
    
    // Event listeners - General
    container.querySelector('#if-set-base-health')?.addEventListener('change', function() {
        state.setSetting('baseHealth', parseInt(this.value) || 3);
        status.recalculateMaxVitals();
    });
    
    container.querySelector('#if-set-base-morale')?.addEventListener('change', function() {
        state.setSetting('baseMorale', parseInt(this.value) || 3);
        status.recalculateMaxVitals();
    });
    
    // Event listeners - Suggestion
    container.querySelector('#if-set-sug-enabled')?.addEventListener('change', function() {
        suggestionState.updateSettings({ enabled: this.checked });
        if (!this.checked) {
            suggestionState.closePanel();
        }
        // Dispatch event for FAB visibility
        document.dispatchEvent(new CustomEvent('if:suggestion-settings-changed'));
    });
    
    container.querySelector('#if-set-sug-show-fab')?.addEventListener('change', function() {
        suggestionState.updateSettings({ showFab: this.checked });
        document.dispatchEvent(new CustomEvent('if:suggestion-settings-changed'));
    });
    
    container.querySelector('#if-set-sug-mode')?.addEventListener('change', function() {
        suggestionState.setMode(this.value);
    });
    
    container.querySelector('#if-set-sug-count')?.addEventListener('input', function() {
        const val = parseInt(this.value);
        document.getElementById('if-sug-count-display').textContent = val;
        suggestionState.updateSettings({ suggestionCount: val });
    });
    
    container.querySelector('#if-set-sug-chaos')?.addEventListener('input', function() {
        const val = parseInt(this.value) / 100;
        document.getElementById('if-sug-chaos-display').textContent = `${this.value}%`;
        suggestionState.updateSettings({ chaosLevel: val });
    });
    
    container.querySelector('#if-set-sug-clipboard')?.addEventListener('change', function() {
        suggestionState.updateSettings({ copyToClipboard: this.checked });
    });
    
    container.querySelector('#if-set-sug-autoclose')?.addEventListener('change', function() {
        suggestionState.updateSettings({ autoCloseOnSelect: this.checked });
    });
    
    // Data buttons
    container.querySelector('#if-export-data')?.addEventListener('click', () => {
        // TODO: Implement export
        alert('Export not yet implemented');
    });
    
    container.querySelector('#if-import-data')?.addEventListener('click', () => {
        // TODO: Implement import
        alert('Import not yet implemented');
    });
    
    container.querySelector('#if-reset-data')?.addEventListener('click', () => {
        if (confirm('Reset all Interfacing data for this chat?')) {
            state.resetState();
            renderSettingsTab(container);
        }
    });
}
