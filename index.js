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
import { EXTENSION_NAME, EXTENSION_VERSION } from './src/core/config.js';
import * as state from './src/core/state.js';
import * as persistence from './src/core/persistence.js';
import * as ieBridge from './src/core/ie-bridge.js';

// Systems
import * as status from './src/systems/status.js';
import * as inventory from './src/systems/inventory.js';
import * as ledger from './src/systems/ledger.js';

// UI
import * as panel from './src/ui/panel.js';

// Suggestion System
import * as suggestionPanel from './src/suggestion/suggestion-panel.js';
import * as suggestionState from './src/suggestion/suggestion-state.js';
import * as suggestionGen from './src/suggestion/suggestion-gen.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let isFullyInitialized = false;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

async function init() {
    console.log(`[${EXTENSION_NAME}] Initializing v${EXTENSION_VERSION}...`);
    
    try {
        // Load global settings first
        persistence.loadGlobalSettings();
        
        // Always add extension settings (so user can toggle)
        addExtensionSettings();
        
        // Check if enabled
        if (!state.getSetting('enabled')) {
            console.log(`[${EXTENSION_NAME}] Extension disabled`);
            return;
        }
        
        // Full initialization
        await initializeSystems();
        
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Initialization failed:`, error);
    }
}

/**
 * Initialize all systems (called on load if enabled, or when user enables)
 */
async function initializeSystems() {
    if (isFullyInitialized) {
        // Already initialized - just show UI
        panel.showFab();
        suggestionPanel.showFab?.();
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
    
    // Initialize main UI panel (📋 FAB + sliding panel)
    panel.init();
    
    // Initialize Suggestion panel (💡 FAB + floating panel)
    suggestionPanel.init();
    
    // Set up auto-mode listener for Suggestion
    setupSuggestionAutoMode();
    
    isFullyInitialized = true;
    
    console.log(`[${EXTENSION_NAME}] Ready!`);
    
    // Show toast if available
    if (typeof toastr !== 'undefined') {
        toastr.success(`${EXTENSION_NAME} v${EXTENSION_VERSION} loaded`, EXTENSION_NAME, { timeOut: 2000 });
    }
}

/**
 * Disable extension (hide UI without page reload)
 */
function disableExtension() {
    // Close panels if open
    panel.closePanel?.();
    suggestionPanel.closePanel?.();
    
    // Hide FABs
    panel.hideFab();
    suggestionPanel.hideFab?.();
    
    console.log(`[${EXTENSION_NAME}] Extension disabled (UI hidden)`);
    
    if (typeof toastr !== 'undefined') {
        toastr.info('Interfacing disabled', EXTENSION_NAME, { timeOut: 2000 });
    }
}

/**
 * Enable extension (initialize or show UI)
 */
async function enableExtension() {
    await initializeSystems();
    
    // Update status display
    updateStatusDisplay();
    
    if (typeof toastr !== 'undefined') {
        toastr.success('Interfacing enabled', EXTENSION_NAME, { timeOut: 2000 });
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
    
    // Update status display
    updateStatusDisplay();
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
    
    // Refresh panel if open
    panel.refresh();
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
            if (!suggestionState.getSettings().enabled) return;
            
            // Only if IE is connected
            if (!ieBridge.isReady()) return;
            
            // Small delay to let message render
            setTimeout(async () => {
                console.log(`[${EXTENSION_NAME}] Auto-generating suggestions...`);
                await suggestionGen.generateSuggestions();
            }, 500);
        });
    }
    
    // Clear suggestions when user sends message
    if (eventTypes.USER_MESSAGE_RENDERED) {
        eventSource.on(eventTypes.USER_MESSAGE_RENDERED, async () => {
            if (!suggestionState.isAutoMode()) return;
            if (!ieBridge.isReady()) return;
            
            suggestionState.clearSuggestions();
        });
    }
    
    console.log(`[${EXTENSION_NAME}] Suggestion auto-mode listener set up`);
}

// ═══════════════════════════════════════════════════════════════
// EXTENSION SETTINGS PANEL (Minimal)
// ═══════════════════════════════════════════════════════════════

function addExtensionSettings() {
    const container = document.getElementById('extensions_settings');
    if (!container) {
        console.warn(`[${EXTENSION_NAME}] Extensions settings container not found`);
        return;
    }
    
    // Remove existing if re-initializing
    const existing = document.getElementById('interfacing-extension-drawer');
    if (existing) existing.remove();
    
    const isEnabled = state.getSetting('enabled');
    
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
                        <input type="checkbox" id="if-enabled" ${isEnabled ? 'checked' : ''}>
                        <span>Enable Interfacing</span>
                    </label>
                    
                    <hr style="margin: 10px 0; border-color: #444;">
                    
                    <div id="if-status-display" style="font-size: 12px; color: #888;">
                        ${getStatusDisplay()}
                    </div>
                    
                    <p style="margin: 10px 0 0; font-size: 11px; color: #666;">
                        Use the 📋 and 💡 buttons to access panels.<br>
                        Settings are in the ⚙️ tab.
                    </p>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    
    // Event listener for enable toggle - NO RELOAD!
    document.getElementById('if-enabled')?.addEventListener('change', async function() {
        const nowEnabled = this.checked;
        
        state.setSetting('enabled', nowEnabled);
        persistence.saveGlobalSettings();
        
        if (nowEnabled) {
            await enableExtension();
        } else {
            disableExtension();
        }
        
        // Update the status display
        updateStatusDisplay();
    });
    
    // Update status display on changes
    document.addEventListener('if:vitals-changed', updateStatusDisplay);
    document.addEventListener('suggestion:state-changed', updateStatusDisplay);
}

function getStatusDisplay() {
    if (!state.getSetting('enabled')) {
        return '<div style="color: #a54444;">Extension disabled</div>';
    }
    
    const health = status.getHealth();
    const morale = status.getMorale();
    const ieStatus = ieBridge.isReady() ? '✅ Connected' : '⏳ Waiting for IE...';
    const sugCount = suggestionState.getSuggestions().length;
    
    return `
        <div>IE: ${ieStatus}</div>
        <div>Health: ${health.current}/${health.effectiveMax}</div>
        <div>Morale: ${morale.current}/${morale.effectiveMax}</div>
        <div>Suggestions: ${sugCount}</div>
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
    
    // Panel controls
    openPanel: panel.openPanel,
    closePanel: panel.closePanel,
    togglePanel: panel.togglePanel,
    
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
    
    // IE Bridge
    isIEConnected: ieBridge.isReady,
    getIE: ieBridge.getIE,
    
    // Enable/Disable (new)
    enable: enableExtension,
    disable: disableExtension,
    isEnabled: () => state.getSetting('enabled')
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
