/**
 * Interfacing - Disco Elysium Gameplay Systems
 * Companion extension to Inland Empire
 * 
 * Systems:
 * - Inventory/Equipment (stat modifiers from items)
 * - Vitals (Health/Morale pools)
 * - Choice Suggestions (skill checks for dialogue options)
 */

import { initInventory, getEquippedModifiers } from './systems/inventory.js';
import { initVitals, getVitals, damageHealth, damageMorale } from './systems/vitals.js';
import { initPanel, showPanel, hidePanel, updateVitalsDisplay } from './ui/panel.js';
import { PRESET_ITEMS } from './data/items.js';

// ═══════════════════════════════════════════════════════════════
// EXTENSION STATE
// ═══════════════════════════════════════════════════════════════

const extensionName = 'Interfacing';
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

let IE = null;  // Reference to Inland Empire API
let isIEConnected = false;
let extensionSettings = {};

const DEFAULT_SETTINGS = {
    enabled: true,
    // Vitals
    baseHealth: 3,
    baseMorale: 3,
    showVitalsWidget: true,
    // Inventory
    autoDetectItems: true,
    generateDescriptions: true,
    // Choice Suggestions
    choiceSuggestionsEnabled: true,
    showChoicesInline: true,
    // UI
    panelPositionTop: 100,
    panelPositionLeft: 60
};

// ═══════════════════════════════════════════════════════════════
// INLAND EMPIRE INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Wait for IE to be ready, or proceed without it
 */
function connectToInlandEmpire() {
    // Check if already loaded
    if (window.InlandEmpire) {
        onIEConnected(window.InlandEmpire);
        return;
    }
    
    // Listen for IE ready event
    document.addEventListener('ie:ready', (e) => {
        console.log(`[${extensionName}] Inland Empire connected, version:`, e.detail?.version);
        onIEConnected(window.InlandEmpire);
    });
    
    // Timeout fallback - run standalone if IE doesn't load
    setTimeout(() => {
        if (!isIEConnected) {
            console.log(`[${extensionName}] Running without Inland Empire integration`);
            initStandalone();
        }
    }, 3000);
}

/**
 * Called when IE is available
 */
function onIEConnected(ieApi) {
    IE = ieApi;
    isIEConnected = true;
    
    // Subscribe to IE events
    document.addEventListener('ie:skill-check', onSkillCheck);
    document.addEventListener('ie:modifier-changed', onModifierChanged);
    
    // Push any existing equipment modifiers to IE
    syncEquipmentToIE();
    
    // Initialize vitals with IE skill levels
    initVitalsWithIE();
}

/**
 * Standalone mode when IE isn't available
 */
function initStandalone() {
    console.log(`[${extensionName}] Standalone mode - limited functionality`);
    // Vitals and inventory still work, just without skill-based calculations
    initVitals(extensionSettings.baseHealth, extensionSettings.baseMorale);
}

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

/**
 * React to skill checks from IE
 */
function onSkillCheck(event) {
    const { skillId, success, isSnakeEyes, isBoxcars, attribute } = event.detail;
    
    if (!success) {
        // Failed checks damage vitals based on attribute
        if (attribute === 'PHYSIQUE' || attribute === 'MOTORICS') {
            damageHealth(1);
        } else {
            damageMorale(1);
        }
    }
    
    // Critical failure = extra damage
    if (isSnakeEyes) {
        if (attribute === 'PHYSIQUE' || attribute === 'MOTORICS') {
            damageHealth(1);
        } else {
            damageMorale(1);
        }
    }
    
    // Critical success = heal
    if (isBoxcars) {
        // Could heal here, or trigger something special
    }
    
    updateVitalsDisplay();
}

/**
 * React to modifier changes (from IE or other sources)
 */
function onModifierChanged(event) {
    // Could update UI, recalculate things, etc.
    console.log(`[${extensionName}] Modifier changed:`, event.detail);
}

// ═══════════════════════════════════════════════════════════════
// IE BRIDGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Push all equipped item modifiers to IE
 */
function syncEquipmentToIE() {
    if (!IE) return;
    
    const modifiers = getEquippedModifiers();
    for (const [sourceId, skillMods] of Object.entries(modifiers)) {
        for (const [skillId, value] of Object.entries(skillMods)) {
            IE.registerModifier(sourceId, skillId, value);
        }
    }
}

/**
 * Initialize vitals using IE skill levels
 */
function initVitalsWithIE() {
    const endurance = IE?.getEffectiveSkillLevel?.('endurance') || 2;
    const volition = IE?.getEffectiveSkillLevel?.('volition') || 2;
    
    const maxHealth = extensionSettings.baseHealth + endurance;
    const maxMorale = extensionSettings.baseMorale + volition;
    
    initVitals(maxHealth, maxMorale);
}

/**
 * Get voice data from IE for item descriptions
 */
export function getVoiceData(skillId) {
    if (!IE) return null;
    return IE.getSkillData?.(skillId) || null;
}

/**
 * Roll a skill check through IE
 */
export function rollCheck(skillId, difficulty) {
    if (!IE) {
        // Fallback: simple 2d6 roll
        const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        return {
            success: roll >= difficulty,
            total: roll,
            isBoxcars: roll === 12,
            isSnakeEyes: roll === 2
        };
    }
    return IE.rollCheck(skillId, difficulty);
}

/**
 * Check if IE is connected
 */
export function hasIE() {
    return isIEConnected;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Load settings from SillyTavern
 */
function loadSettings(context) {
    if (context?.extensionSettings?.interfacing) {
        extensionSettings = { ...DEFAULT_SETTINGS, ...context.extensionSettings.interfacing };
    } else {
        extensionSettings = { ...DEFAULT_SETTINGS };
    }
}

/**
 * Save settings to SillyTavern
 */
export function saveSettings(context) {
    if (context?.extensionSettings) {
        context.extensionSettings.interfacing = extensionSettings;
        context.saveSettingsDebounced?.();
    }
}

/**
 * Main initialization
 */
jQuery(async () => {
    const context = SillyTavern?.getContext?.();
    
    console.log(`[${extensionName}] Initializing...`);
    
    // Load settings
    loadSettings(context);
    
    // Initialize systems
    initInventory();
    initPanel(context);
    
    // Try to connect to Inland Empire
    connectToInlandEmpire();
    
    console.log(`[${extensionName}] Initialized successfully`);
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS (for other modules)
// ═══════════════════════════════════════════════════════════════

export {
    extensionSettings,
    IE,
    isIEConnected
};
