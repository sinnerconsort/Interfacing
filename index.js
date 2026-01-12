/**
 * Interfacing - Entry Point
 * Disco Elysium gameplay systems for SillyTavern
 * Companion extension to Inland Empire
 * 
 * v3.0.0-dev
 */

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

// Core
import { EXTENSION_NAME, EXTENSION_VERSION, EXTENSION_FOLDER } from './src/core/config.js';
import * as state from './src/core/state.js';
import * as persistence from './src/core/persistence.js';
import * as ieBridge from './src/core/ie-bridge.js';

// Systems
import * as status from './src/systems/status.js';
import * as inventory from './src/systems/inventory.js';
import * as ledger from './src/systems/ledger.js';

// UI (to be implemented)
// import * as panel from './src/ui/panel.js';
// import * as tabs from './src/ui/tabs.js';
// import * as fab from './src/ui/fab.js';

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    console.log(`[${EXTENSION_NAME}] Initializing v${EXTENSION_VERSION}...`);
    
    try {
        // Load global settings first
        persistence.loadGlobalSettings();
        
        // Check if enabled
        if (!state.getSetting('enabled')) {
            console.log(`[${EXTENSION_NAME}] Extension disabled`);
            return;
        }
        
        // Set up ST event listeners
        persistence.setupSTEventListeners();
        
        // Enable auto-save
        persistence.enableAutoSave();
        
        // Load chat-specific data
        persistence.loadFromChat();
        
        // Connect to Inland Empire
        ieBridge.init({
            onConnected: onIEConnected,
            onSkillCheck: onSkillCheck,
            onModifierChanged: onModifierChanged,
            onStatusChanged: onStatusChanged
        });
        
        // Add extension settings panel
        addExtensionSettings();
        
        // Initialize UI (when implemented)
        // await initUI();
        
        console.log(`[${EXTENSION_NAME}] Ready!`);
        
        // Show toast if available
        if (typeof toastr !== 'undefined') {
            toastr.success(`${EXTENSION_NAME} v${EXTENSION_VERSION} loaded`, EXTENSION_NAME, { timeOut: 3000 });
        }
        
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Initialization failed:`, error);
    }
}

// ═══════════════════════════════════════════════════════════════
// IE EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

function onIEConnected(ie) {
    console.log(`[${EXTENSION_NAME}] Connected to Inland Empire`);
    
    // Initialize vitals from skill levels
    status.initVitalsFromSkills();
    
    // Sync equipment modifiers to IE
    inventory.syncAllModifiersToIE();
}

function onSkillCheck(result) {
    // Apply consequences to vitals
    status.handleSkillCheckResult(result);
}

function onModifierChanged(data) {
    // Modifiers changed - may need to recalculate max vitals
    if (data.skillId === 'endurance' || data.skillId === 'volition') {
        status.recalculateMaxVitals();
    }
    
    // Update UI if open
    // panel.refresh();
}

function onStatusChanged(data) {
    // Sync conditions from IE
    status.syncConditionsFromIE();
}

// ═══════════════════════════════════════════════════════════════
// EXTENSION SETTINGS PANEL
// ═══════════════════════════════════════════════════════════════

function addExtensionSettings() {
    const container = document.getElementById('extensions_settings');
    if (!container) {
        console.warn(`[${EXTENSION_NAME}] Extensions settings container not found`);
        return;
    }
    
    const html = `
        <div class="inline-drawer" id="interfacing-extension-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>🔧 Interfacing</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div style="padding: 10px;">
                    <p style="margin: 0 0 10px; color: #888; font-size: 12px;">
                        Disco Elysium gameplay systems.<br>
                        Companion to Inland Empire.
                    </p>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="if-enabled" ${state.getSetting('enabled') ? 'checked' : ''}>
                        <span>Enable Interfacing</span>
                    </label>
                    
                    <hr style="margin: 10px 0; border-color: #444;">
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Base Health</label>
                        <input type="number" id="if-base-health" value="${state.getSetting('baseHealth')}" 
                               min="1" max="10" style="width: 60px;">
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Base Morale</label>
                        <input type="number" id="if-base-morale" value="${state.getSetting('baseMorale')}" 
                               min="1" max="10" style="width: 60px;">
                    </div>
                    
                    <hr style="margin: 10px 0; border-color: #444;">
                    
                    <div id="if-status-display" style="font-size: 12px; color: #888;">
                        ${getStatusDisplay()}
                    </div>
                    
                    <hr style="margin: 10px 0; border-color: #444;">
                    
                    <button id="if-open-panel" class="menu_button" style="width: 100%;">
                        Open Panel (UI Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    // Event listeners
    document.getElementById('if-enabled')?.addEventListener('change', function() {
        state.setSetting('enabled', this.checked);
        persistence.saveGlobalSettings();
        
        if (this.checked) {
            // Re-init
            persistence.loadFromChat();
            ieBridge.init({ onConnected: onIEConnected });
        }
    });
    
    document.getElementById('if-base-health')?.addEventListener('change', function() {
        state.setSetting('baseHealth', parseInt(this.value) || 3);
        status.recalculateMaxVitals();
    });
    
    document.getElementById('if-base-morale')?.addEventListener('change', function() {
        state.setSetting('baseMorale', parseInt(this.value) || 3);
        status.recalculateMaxVitals();
    });
    
    document.getElementById('if-open-panel')?.addEventListener('click', () => {
        // TODO: Open panel when UI is implemented
        if (typeof toastr !== 'undefined') {
            toastr.info('Sidebar UI coming soon!', EXTENSION_NAME);
        }
    });
    
    // Update status display when vitals change
    document.addEventListener('if:vitals-changed', updateStatusDisplay);
}

function getStatusDisplay() {
    const health = status.getHealth();
    const morale = status.getMorale();
    const ieStatus = ieBridge.isReady() ? '✅ Connected' : '⏳ Waiting...';
    
    return `
        <div>IE: ${ieStatus}</div>
        <div>Health: ${health.current}/${health.effectiveMax}</div>
        <div>Morale: ${morale.current}/${morale.effectiveMax}</div>
        <div>Equipped: ${inventory.getAllEquipped().length} items</div>
        <div>Tasks: ${ledger.getActiveTasks().length} active</div>
    `;
}

function updateStatusDisplay() {
    const display = document.getElementById('if-status-display');
    if (display) {
        display.innerHTML = getStatusDisplay();
    }
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL API (for other extensions / debugging)
// ═══════════════════════════════════════════════════════════════

window.Interfacing = {
    // Version
    version: EXTENSION_VERSION,
    
    // State access
    getSettings: state.getSettings,
    getSetting: state.getSetting,
    
    // Status
    getHealth: status.getHealth,
    getMorale: status.getMorale,
    modifyHealth: status.modifyHealth,
    modifyMorale: status.modifyMorale,
    getConditions: status.getConditions,
    addCondition: status.addCondition,
    removeCondition: status.removeCondition,
    
    // Inventory
    equipItem: inventory.equipItem,
    unequipItem: inventory.unequipItem,
    getAllEquipped: inventory.getAllEquipped,
    addItem: inventory.addItem,
    removeItem: inventory.removeItem,
    getInventorySummary: inventory.getInventorySummary,
    
    // Ledger
    addTask: ledger.addTask,
    completeTask: ledger.completeTask,
    getActiveTasks: ledger.getActiveTasks,
    addMemory: ledger.addMemory,
    getMemories: ledger.getMemories,
    addContact: ledger.addContact,
    getContacts: ledger.getContacts,
    
    // Persistence
    save: persistence.saveToChat,
    load: persistence.loadFromChat,
    exportState: persistence.exportState,
    importState: persistence.importState,
    
    // IE Bridge
    isIEConnected: ieBridge.isReady,
    getIE: ieBridge.getIE
};

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════

// Wait for jQuery/ST to be ready
if (typeof jQuery !== 'undefined') {
    jQuery(async () => {
        await init();
    });
} else {
    // Fallback
    document.addEventListener('DOMContentLoaded', init);
}
