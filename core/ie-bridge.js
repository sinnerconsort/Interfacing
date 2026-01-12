/**
 * Interfacing - Inland Empire Bridge
 * All interactions with Inland Empire go through here
 * 
 * Dependencies: state.js
 */

import { setIEConnected, isIEConnected } from './state.js';

// ═══════════════════════════════════════════════════════════════
// IE REFERENCE
// ═══════════════════════════════════════════════════════════════

let IE = null;

/**
 * Get the Inland Empire API reference
 */
export function getIE() {
    return IE;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize connection to Inland Empire
 * Should be called from index.js during init
 * 
 * @param {Object} callbacks - Optional callbacks for events
 * @param {Function} callbacks.onSkillCheck - Called when skill check occurs
 * @param {Function} callbacks.onModifierChanged - Called when modifiers change
 * @param {Function} callbacks.onStatusChanged - Called when IE status changes
 * @param {Function} callbacks.onConnected - Called when IE connection established
 */
export function init(callbacks = {}) {
    // Check if IE is already loaded
    if (window.InlandEmpire) {
        onIEReady(window.InlandEmpire, callbacks);
        return true;
    }
    
    // Listen for IE ready event
    document.addEventListener('ie:ready', (e) => {
        onIEReady(window.InlandEmpire, callbacks);
    });
    
    // Set timeout for standalone mode notification
    setTimeout(() => {
        if (!isIEConnected()) {
            console.warn('[Interfacing] Inland Empire not detected after 3s');
            console.warn('[Interfacing] Some features will be limited without IE');
        }
    }, 3000);
    
    return false;
}

/**
 * Called when IE is ready
 */
function onIEReady(ieInstance, callbacks) {
    IE = ieInstance;
    setIEConnected(true);
    
    console.log('[Interfacing] Connected to Inland Empire');
    
    // Set up event listeners
    setupEventListeners(callbacks);
    
    // Call connected callback
    if (callbacks.onConnected) {
        callbacks.onConnected(IE);
    }
    
    // Dispatch our own event
    document.dispatchEvent(new CustomEvent('if:ie-connected', {
        detail: { ie: IE }
    }));
}

/**
 * Set up listeners for IE events
 */
function setupEventListeners(callbacks) {
    // Skill check events
    document.addEventListener('ie:skill-check', (e) => {
        if (callbacks.onSkillCheck) {
            callbacks.onSkillCheck(e.detail);
        }
    });
    
    // Modifier change events
    document.addEventListener('ie:modifier-changed', (e) => {
        if (callbacks.onModifierChanged) {
            callbacks.onModifierChanged(e.detail);
        }
    });
    
    // Status change events (if IE supports it)
    document.addEventListener('ie:status-changed', (e) => {
        if (callbacks.onStatusChanged) {
            callbacks.onStatusChanged(e.detail);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// SKILL QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get base skill level (1-6)
 */
export function getSkillLevel(skillId) {
    if (!IE?.getSkillLevel) return 0;
    return IE.getSkillLevel(skillId) ?? 0;
}

/**
 * Get effective skill level (with all modifiers)
 */
export function getEffectiveSkillLevel(skillId) {
    if (!IE?.getEffectiveSkillLevel) return 0;
    return IE.getEffectiveSkillLevel(skillId) ?? 0;
}

/**
 * Get full skill data object
 */
export function getSkillData(skillId) {
    if (!IE?.getSkillData) return null;
    return IE.getSkillData(skillId);
}

/**
 * Get all skills
 */
export function getAllSkills() {
    if (!IE?.getAllSkills) return {};
    return IE.getAllSkills();
}

/**
 * Get all modifiers for a skill
 */
export function getModifiersForSkill(skillId) {
    if (!IE?.getModifiersForSkill) return [];
    return IE.getModifiersForSkill(skillId) ?? [];
}

// ═══════════════════════════════════════════════════════════════
// MODIFIER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Register a modifier with IE
 * @param {string} sourceId - Unique ID for the modifier source (e.g., item ID)
 * @param {string} skillId - Which skill to modify
 * @param {number} value - Modifier value (+/-)
 */
export function registerModifier(sourceId, skillId, value) {
    if (!IE?.registerModifier) {
        console.warn('[Interfacing] IE.registerModifier not available');
        return false;
    }
    
    try {
        IE.registerModifier(sourceId, skillId, value);
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to register modifier:', e);
        return false;
    }
}

/**
 * Remove all modifiers from a source
 * @param {string} sourceId - The source ID to remove
 */
export function removeModifierSource(sourceId) {
    if (!IE?.removeModifierSource) {
        console.warn('[Interfacing] IE.removeModifierSource not available');
        return false;
    }
    
    try {
        IE.removeModifierSource(sourceId);
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to remove modifier source:', e);
        return false;
    }
}

/**
 * Register multiple modifiers from an item
 * @param {string} itemId - Item's unique ID
 * @param {Object} modifiers - { skillId: value, ... }
 */
export function registerItemModifiers(itemId, modifiers) {
    if (!modifiers || typeof modifiers !== 'object') return;
    
    Object.entries(modifiers).forEach(([skillId, value]) => {
        registerModifier(itemId, skillId, value);
    });
}

// ═══════════════════════════════════════════════════════════════
// STATUS SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Get all active statuses from IE
 */
export function getStatuses() {
    if (!IE?.getStatuses) {
        // IE might not have this yet - return empty array
        return [];
    }
    return IE.getStatuses() ?? [];
}

/**
 * Add a status/condition to IE
 */
export function addStatus(status) {
    if (!IE?.addStatus) {
        console.warn('[Interfacing] IE.addStatus not available');
        return false;
    }
    
    try {
        IE.addStatus(status);
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to add status:', e);
        return false;
    }
}

/**
 * Remove a status from IE
 */
export function removeStatus(statusId) {
    if (!IE?.removeStatus) {
        console.warn('[Interfacing] IE.removeStatus not available');
        return false;
    }
    
    try {
        IE.removeStatus(statusId);
        return true;
    } catch (e) {
        console.error('[Interfacing] Failed to remove status:', e);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// SKILL CHECKS
// ═══════════════════════════════════════════════════════════════

/**
 * Perform a skill check through IE
 * @param {string} skillId - Which skill to check
 * @param {number} difficulty - DC of the check
 */
export function rollCheck(skillId, difficulty) {
    if (!IE?.rollCheck) {
        console.warn('[Interfacing] IE.rollCheck not available');
        return null;
    }
    
    return IE.rollCheck(skillId, difficulty);
}

// ═══════════════════════════════════════════════════════════════
// GENERATION (using IE's API)
// ═══════════════════════════════════════════════════════════════

/**
 * Check if IE has API configured
 */
export function isAPIConfigured() {
    if (!IE?.isAPIConfigured) {
        // Try checking if generate exists
        return typeof IE?.generate === 'function';
    }
    return IE.isAPIConfigured();
}

/**
 * Generate text using IE's API
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Generation options
 */
export async function generate(prompt, options = {}) {
    if (!IE?.generate) {
        console.warn('[Interfacing] IE.generate not available');
        return null;
    }
    
    try {
        return await IE.generate(prompt, options);
    } catch (e) {
        console.error('[Interfacing] Generation failed:', e);
        return null;
    }
}

/**
 * Get IE's API configuration (for display/debugging)
 */
export function getAPIConfig() {
    if (!IE?.getAPIConfig) return null;
    return IE.getAPIConfig();
}

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Check if IE is fully connected and functional
 */
export function isReady() {
    return isIEConnected() && IE !== null;
}

/**
 * Get IE version if available
 */
export function getVersion() {
    return IE?.version ?? 'unknown';
}
