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

// Suggestion System
import * as suggestionPanel from './src/suggestion/suggestion-panel.js';
import * as suggestionState from './src/suggestion/suggestion-state.js';
import * as suggestionGen from './src/suggestion/suggestion-gen.js';

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
        
        // Load Suggestion CSS
        loadSuggestionStyles();
        
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
        
        // Initialize Suggestion panel
        suggestionPanel.init();
        
        // Set up auto-mode listener for Suggestion
        setupSuggestionAutoMode();
        
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

/**
 * Load Suggestion panel CSS
 */
function loadSuggestionStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `scripts/extensions/third-party/${EXTENSION_NAME}/src/suggestion/suggestion-styles.css`;
    document.head.appendChild(link);
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
// SUGGESTION AUTO-MODE
// ═══════════════════════════════════════════════════════════════

function setupSuggestionAutoMode() {
    // Get ST context for event source
    const context = typeof SillyTavern !== 'undefined' 
        ? SillyTavern.getContext() 
        : (typeof getContext === 'function' ? getContext() : null);
    
    if (!context?.eventSource) {
        console.warn(`[${EXTENSION_NAME}] No event source for auto-mode`);
        return;
    }
    
    const eventSource = context.eventSource;
    const eventTypes = context.event_types || {};
    
    // Listen for new messages
    if (eventTypes.MESSAGE_RECEIVED) {
        eventSource.on(eventTypes.MESSAGE_RECEIVED, async () => {
            // Only trigger in auto mode
            if (!suggestionState.isAutoMode()) return;
            
            // Only if IE is connected
            if (!ieBridge.isReady()) return;
            
            // Small delay to let message render
            setTimeout(async () => {
                console.log(`[${EXTENSION_NAME}] Auto-generating suggestions...`);
                await suggestionGen.generateSuggestions();
            }, 500);
        });
    }
    
    // Also listen for when user sends a message (in case they want fresh suggestions)
    if (eventTypes.USER_MESSAGE_RENDERED) {
        eventSource.on(eventTypes.USER_MESSAGE_RENDERED, async () => {
            if (!suggestionState.isAutoMode()) return;
            if (!ieBridge.isReady()) return;
            
            // Clear old suggestions when user sends message
            suggestionState.clearSuggestions();
        });
    }
    
    console.log(`[${EXTENSION_NAME}] Suggestion auto-mode listener set up`);
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
    
    const sugSettings = suggestionState.getSettings();
    
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
                    
                    <!-- Suggestion System Settings -->
                    <div style="margin-bottom: 10px;">
                        <b style="color: #bfa127; font-size: 12px;">💭 SUGGESTION</b>
                    </div>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="if-sug-enabled" ${sugSettings.enabled ? 'checked' : ''}>
                        <span>Enable Suggestions</span>
                    </label>
                    
                    <div style="margin: 10px 0;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">Mode</label>
                        <select id="if-sug-mode" style="width: 100%; padding: 4px;">
                            <option value="manual" ${sugSettings.mode === 'manual' ? 'selected' : ''}>Manual (refresh button)</option>
                            <option value="auto" ${sugSettings.mode === 'auto' ? 'selected' : ''}>Auto (after each message)</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">
                            Suggestions: <span id="if-sug-count-val">${sugSettings.suggestionCount}</span>
                        </label>
                        <input type="range" id="if-sug-count" value="${sugSettings.suggestionCount}" 
                               min="3" max="5" style="width: 100%;">
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="display: block; margin-bottom: 4px; font-size: 12px;">
                            Chaos: <span id="if-sug-chaos-val">${Math.round(sugSettings.chaosLevel * 100)}%</span>
                        </label>
                        <input type="range" id="if-sug-chaos" value="${sugSettings.chaosLevel * 100}" 
                               min="0" max="100" style="width: 100%;">
                        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666;">
                            <span>Practical</span>
                            <span>Unhinged</span>
                        </div>
                    </div>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="if-sug-clipboard" ${sugSettings.copyToClipboard ? 'checked' : ''}>
                        <span>Copy result to clipboard</span>
                    </label>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="if-sug-autoclose" ${sugSettings.autoCloseOnSelect ? 'checked' : ''}>
                        <span>Close panel after selection</span>
                    </label>
                    
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
    
    // Suggestion settings listeners
    document.getElementById('if-sug-enabled')?.addEventListener('change', function() {
        suggestionState.updateSettings({ enabled: this.checked });
        if (!this.checked) {
            suggestionState.closePanel();
        }
    });
    
    document.getElementById('if-sug-mode')?.addEventListener('change', function() {
        suggestionState.setMode(this.value);
    });
    
    document.getElementById('if-sug-count')?.addEventListener('input', function() {
        const val = parseInt(this.value);
        document.getElementById('if-sug-count-val').textContent = val;
        suggestionState.updateSettings({ suggestionCount: val });
    });
    
    document.getElementById('if-sug-chaos')?.addEventListener('input', function() {
        const val = parseInt(this.value) / 100;
        document.getElementById('if-sug-chaos-val').textContent = `${this.value}%`;
        suggestionState.updateSettings({ chaosLevel: val });
    });
    
    document.getElementById('if-sug-clipboard')?.addEventListener('change', function() {
        suggestionState.updateSettings({ copyToClipboard: this.checked });
    });
    
    document.getElementById('if-sug-autoclose')?.addEventListener('change', function() {
        suggestionState.updateSettings({ autoCloseOnSelect: this.checked });
    });
    
    // Update status display when vitals change
    document.addEventListener('if:vitals-changed', updateStatusDisplay);
    
    // Update status display when suggestions change
    document.addEventListener('suggestion:state-changed', updateStatusDisplay);
}

function getStatusDisplay() {
    const health = status.getHealth();
    const morale = status.getMorale();
    const ieStatus = ieBridge.isReady() ? '✅ Connected' : '⏳ Waiting...';
    const sugCount = suggestionState.getSuggestions().length;
    const sugMode = suggestionState.getMode();
    
    return `
        <div>IE: ${ieStatus}</div>
        <div>Health: ${health.current}/${health.effectiveMax}</div>
        <div>Morale: ${morale.current}/${morale.effectiveMax}</div>
        <div>Equipped: ${inventory.getAllEquipped().length} items</div>
        <div>Tasks: ${ledger.getActiveTasks().length} active</div>
        <div>Suggestions: ${sugCount} (${sugMode})</div>
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
    
    // Suggestion System
    suggestion: {
        open: suggestionState.openPanel,
        close: suggestionState.closePanel,
        toggle: suggestionState.togglePanel,
        generate: suggestionGen.generateSuggestions,
        generateFor: suggestionGen.generateForIntent,
        execute: suggestionGen.executeSuggestion,
        getSuggestions: suggestionState.getSuggestions,
        getLastResult: suggestionState.getLastResult,
        getSettings: suggestionState.getSettings,
        updateSettings: suggestionState.updateSettings
    },
    
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
