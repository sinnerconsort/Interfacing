/**
 * Interfacing - Persistence Layer
 * Handles saving/loading to SillyTavern's storage
 * 
 * Dependencies: config.js, state.js
 */

import { EXTENSION_NAME } from './config.js';
import { 
    getFullState, 
    loadFullState, 
    getSettings, 
    updateSettings,
    onStateChange 
} from './state.js';

// ═══════════════════════════════════════════════════════════════
// DEBOUNCE HELPER
// ═══════════════════════════════════════════════════════════════

let saveTimeout = null;
const SAVE_DEBOUNCE_MS = 500;

function debouncedSave(fn) {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
        fn();
        saveTimeout = null;
    }, SAVE_DEBOUNCE_MS);
}

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN CONTEXT HELPERS
// ═══════════════════════════════════════════════════════════════

function getSTContext() {
    // SillyTavern exposes getContext globally
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
    }
    // Fallback for older versions
    if (typeof getContext === 'function') {
        return getContext();
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// CHAT METADATA (per-conversation data)
// ═══════════════════════════════════════════════════════════════

/**
 * Save current state to chat metadata
 * This persists inventory, vitals, ledger for the current conversation
 */
export function saveToChat() {
    const context = getSTContext();
    
    if (!context) {
        console.warn('[Interfacing] No ST context available for save');
        return false;
    }
    
    if (!context.chat_metadata) {
        console.warn('[Interfacing] No chat_metadata available');
        return false;
    }
    
    try {
        context.chat_metadata[EXTENSION_NAME] = getFullState();
        
        // Use ST's debounced save if available
        if (typeof context.saveMetadataDebounced === 'function') {
            context.saveMetadataDebounced();
        } else if (typeof saveMetadataDebounced === 'function') {
            saveMetadataDebounced();
        }
        
        console.log('[Interfacing] Saved to chat metadata');
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to save to chat:', e);
        return false;
    }
}

/**
 * Load state from chat metadata
 * Called when switching chats or on init
 */
export function loadFromChat() {
    const context = getSTContext();
    
    if (!context?.chat_metadata) {
        console.log('[Interfacing] No chat metadata to load');
        return false;
    }
    
    const saved = context.chat_metadata[EXTENSION_NAME];
    
    if (saved) {
        try {
            loadFullState(saved);
            console.log('[Interfacing] Loaded from chat metadata');
            return true;
        } catch (e) {
            console.error('[Interfacing] Failed to load from chat:', e);
            return false;
        }
    }
    
    return false;
}

/**
 * Clear chat-specific data (for new conversations)
 */
export function clearChatData() {
    const context = getSTContext();
    
    if (context?.chat_metadata?.[EXTENSION_NAME]) {
        delete context.chat_metadata[EXTENSION_NAME];
        
        if (typeof context.saveMetadataDebounced === 'function') {
            context.saveMetadataDebounced();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// EXTENSION SETTINGS (global, persists across chats)
// ═══════════════════════════════════════════════════════════════

/**
 * Save settings to extension_settings
 * These persist across all chats (UI preferences, FAB position, etc.)
 */
export function saveGlobalSettings() {
    const context = getSTContext();
    
    if (!context) {
        console.warn('[Interfacing] No ST context for global settings');
        return false;
    }
    
    // extension_settings is the global settings object
    if (!context.extensionSettings) {
        console.warn('[Interfacing] No extensionSettings available');
        return false;
    }
    
    try {
        context.extensionSettings[EXTENSION_NAME] = getSettings();
        
        // Use ST's save function
        if (typeof context.saveSettingsDebounced === 'function') {
            context.saveSettingsDebounced();
        } else if (typeof saveSettingsDebounced === 'function') {
            saveSettingsDebounced();
        }
        
        console.log('[Interfacing] Saved global settings');
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to save global settings:', e);
        return false;
    }
}

/**
 * Load global settings
 * Called on extension init
 */
export function loadGlobalSettings() {
    const context = getSTContext();
    
    if (!context?.extensionSettings) {
        console.log('[Interfacing] No global settings to load');
        return false;
    }
    
    const saved = context.extensionSettings[EXTENSION_NAME];
    
    if (saved) {
        try {
            updateSettings(saved);
            console.log('[Interfacing] Loaded global settings');
            return true;
        } catch (e) {
            console.error('[Interfacing] Failed to load global settings:', e);
            return false;
        }
    }
    
    return false;
}

// ═══════════════════════════════════════════════════════════════
// AUTO-SAVE SETUP
// ═══════════════════════════════════════════════════════════════

let autoSaveUnsubscribe = null;

/**
 * Enable auto-saving when state changes
 */
export function enableAutoSave() {
    if (autoSaveUnsubscribe) return; // Already enabled
    
    autoSaveUnsubscribe = onStateChange((source) => {
        // Don't save on UI-only changes
        if (source === 'ui' || source === 'ie-connection') return;
        
        // Settings go to global, everything else to chat
        if (source === 'settings') {
            debouncedSave(saveGlobalSettings);
        } else {
            debouncedSave(saveToChat);
        }
    });
    
    console.log('[Interfacing] Auto-save enabled');
}

/**
 * Disable auto-saving
 */
export function disableAutoSave() {
    if (autoSaveUnsubscribe) {
        autoSaveUnsubscribe();
        autoSaveUnsubscribe = null;
        console.log('[Interfacing] Auto-save disabled');
    }
}

// ═══════════════════════════════════════════════════════════════
// SILLYTAVERN EVENT HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Set up listeners for ST events
 * Should be called from index.js during init
 */
export function setupSTEventListeners() {
    const context = getSTContext();
    
    if (!context?.eventSource) {
        console.warn('[Interfacing] No event source available');
        return;
    }
    
    const eventSource = context.eventSource;
    const eventTypes = context.event_types || {};
    
    // When chat changes, load that chat's data
    if (eventTypes.CHAT_CHANGED) {
        eventSource.on(eventTypes.CHAT_CHANGED, () => {
            console.log('[Interfacing] Chat changed, loading data...');
            loadFromChat();
        });
    }
    
    // Before chat is saved, ensure our data is current
    if (eventTypes.CHAT_SAVED) {
        eventSource.on(eventTypes.CHAT_SAVED, () => {
            // Force immediate save (no debounce)
            saveToChat();
        });
    }
    
    console.log('[Interfacing] ST event listeners set up');
}

// ═══════════════════════════════════════════════════════════════
// EXPORT/IMPORT (for manual backup)
// ═══════════════════════════════════════════════════════════════

/**
 * Export current state as JSON string
 */
export function exportState() {
    return JSON.stringify(getFullState(), null, 2);
}

/**
 * Import state from JSON string
 */
export function importState(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        loadFullState(data);
        saveToChat();
        saveGlobalSettings();
        return true;
    } catch (e) {
        console.error('[Interfacing] Import failed:', e);
        return false;
    }
}
