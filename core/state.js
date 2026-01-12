/**
 * Interfacing - Central State Store
 * Single source of truth for all extension data
 * 
 * Dependencies: config.js
 */

import { DEFAULT_SETTINGS } from './config.js';

// ═══════════════════════════════════════════════════════════════
// PRIVATE STATE (module-scoped)
// ═══════════════════════════════════════════════════════════════

let _settings = { ...DEFAULT_SETTINGS };

let _vitals = {
    health: { current: 3, max: 3, temp: 0 },
    morale: { current: 3, max: 3, temp: 0 }
};

let _conditions = [];

let _inventory = {
    wearing: [],
    onPerson: [],
    stored: {},
    assets: []
};

let _ledger = {
    caseInfo: {
        officerInitials: 'HDB',
        caseNumber: 1,
        title: '',
        openedAt: null
    },
    tasks: {
        active: [],
        completed: [],
        failed: []
    },
    memories: [],
    contacts: []
};

let _ui = {
    isPanelOpen: false,
    currentTab: 'status',
    currentInventorySection: 'wearing'
};

let _ieConnected = false;

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export function getSettings() {
    return { ..._settings };
}

export function updateSettings(partial) {
    _settings = { ..._settings, ...partial };
    dispatchStateChange('settings');
}

export function getSetting(key) {
    return _settings[key];
}

export function setSetting(key, value) {
    _settings[key] = value;
    dispatchStateChange('settings');
}

// ═══════════════════════════════════════════════════════════════
// VITALS
// ═══════════════════════════════════════════════════════════════

export function getVitals() {
    return {
        health: { ..._vitals.health },
        morale: { ..._vitals.morale }
    };
}

export function setVitals(health, morale) {
    if (health) {
        _vitals.health = {
            current: Math.max(0, health.current ?? _vitals.health.current),
            max: Math.max(1, health.max ?? _vitals.health.max),
            temp: health.temp ?? _vitals.health.temp
        };
    }
    if (morale) {
        _vitals.morale = {
            current: Math.max(0, morale.current ?? _vitals.morale.current),
            max: Math.max(1, morale.max ?? _vitals.morale.max),
            temp: morale.temp ?? _vitals.morale.temp
        };
    }
    dispatchStateChange('vitals');
}

export function getHealth() {
    return { ..._vitals.health };
}

export function getMorale() {
    return { ..._vitals.morale };
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONS
// ═══════════════════════════════════════════════════════════════

export function getConditions() {
    return [..._conditions];
}

export function setConditions(conditions) {
    _conditions = Array.isArray(conditions) ? [...conditions] : [];
    dispatchStateChange('conditions');
}

export function addCondition(condition) {
    // Prevent duplicates
    if (_conditions.find(c => c.id === condition.id)) {
        return false;
    }
    _conditions.push({ ...condition });
    dispatchStateChange('conditions');
    return true;
}

export function removeCondition(conditionId) {
    const index = _conditions.findIndex(c => c.id === conditionId);
    if (index === -1) return false;
    _conditions.splice(index, 1);
    dispatchStateChange('conditions');
    return true;
}

export function getCondition(conditionId) {
    return _conditions.find(c => c.id === conditionId) || null;
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY
// ═══════════════════════════════════════════════════════════════

export function getInventory() {
    return {
        wearing: [..._inventory.wearing],
        onPerson: [..._inventory.onPerson],
        stored: JSON.parse(JSON.stringify(_inventory.stored)), // Deep copy
        assets: [..._inventory.assets]
    };
}

export function setInventory(inventory) {
    _inventory = {
        wearing: Array.isArray(inventory.wearing) ? [...inventory.wearing] : [],
        onPerson: Array.isArray(inventory.onPerson) ? [...inventory.onPerson] : [],
        stored: inventory.stored ? JSON.parse(JSON.stringify(inventory.stored)) : {},
        assets: Array.isArray(inventory.assets) ? [...inventory.assets] : []
    };
    dispatchStateChange('inventory');
}

export function getWearing() {
    return [..._inventory.wearing];
}

export function getOnPerson() {
    return [..._inventory.onPerson];
}

export function getStored() {
    return JSON.parse(JSON.stringify(_inventory.stored));
}

export function getAssets() {
    return [..._inventory.assets];
}

// Direct array mutation helpers (for inventory.js to use)
export function _getInventoryRef() {
    return _inventory;
}

// ═══════════════════════════════════════════════════════════════
// LEDGER
// ═══════════════════════════════════════════════════════════════

export function getLedger() {
    return {
        caseInfo: { ..._ledger.caseInfo },
        tasks: {
            active: [..._ledger.tasks.active],
            completed: [..._ledger.tasks.completed],
            failed: [..._ledger.tasks.failed]
        },
        memories: [..._ledger.memories],
        contacts: [..._ledger.contacts]
    };
}

export function setLedger(ledger) {
    _ledger = {
        caseInfo: { ...(ledger.caseInfo || _ledger.caseInfo) },
        tasks: {
            active: Array.isArray(ledger.tasks?.active) ? [...ledger.tasks.active] : [],
            completed: Array.isArray(ledger.tasks?.completed) ? [...ledger.tasks.completed] : [],
            failed: Array.isArray(ledger.tasks?.failed) ? [...ledger.tasks.failed] : []
        },
        memories: Array.isArray(ledger.memories) ? [...ledger.memories] : [],
        contacts: Array.isArray(ledger.contacts) ? [...ledger.contacts] : []
    };
    dispatchStateChange('ledger');
}

// Direct ref helper (for ledger.js)
export function _getLedgerRef() {
    return _ledger;
}

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

export function getUIState() {
    return { ..._ui };
}

export function setUIState(partial) {
    _ui = { ..._ui, ...partial };
    // UI state changes don't need persistence dispatch
}

export function isPanelOpen() {
    return _ui.isPanelOpen;
}

export function setPanelOpen(isOpen) {
    _ui.isPanelOpen = isOpen;
}

export function getCurrentTab() {
    return _ui.currentTab;
}

export function setCurrentTab(tab) {
    _ui.currentTab = tab;
}

export function getCurrentInventorySection() {
    return _ui.currentInventorySection;
}

export function setCurrentInventorySection(section) {
    _ui.currentInventorySection = section;
}

// ═══════════════════════════════════════════════════════════════
// IE CONNECTION STATE
// ═══════════════════════════════════════════════════════════════

export function isIEConnected() {
    return _ieConnected;
}

export function setIEConnected(connected) {
    _ieConnected = !!connected;
    dispatchStateChange('ie-connection');
}

// ═══════════════════════════════════════════════════════════════
// FULL STATE (for persistence)
// ═══════════════════════════════════════════════════════════════

export function getFullState() {
    return {
        _version: 3,
        settings: getSettings(),
        vitals: getVitals(),
        conditions: getConditions(),
        inventory: getInventory(),
        ledger: getLedger()
    };
}

export function loadFullState(state) {
    if (!state) return false;
    
    // Version migration could go here
    // if (state._version < 3) { migrate... }
    
    if (state.settings) {
        _settings = { ...DEFAULT_SETTINGS, ...state.settings };
    }
    
    if (state.vitals) {
        _vitals = {
            health: { ..._vitals.health, ...state.vitals.health },
            morale: { ..._vitals.morale, ...state.vitals.morale }
        };
    }
    
    if (state.conditions) {
        _conditions = [...state.conditions];
    }
    
    if (state.inventory) {
        setInventory(state.inventory);
    }
    
    if (state.ledger) {
        setLedger(state.ledger);
    }
    
    dispatchStateChange('full-load');
    return true;
}

// ═══════════════════════════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════════════════════════

export function resetState() {
    _settings = { ...DEFAULT_SETTINGS };
    _vitals = {
        health: { current: 3, max: 3, temp: 0 },
        morale: { current: 3, max: 3, temp: 0 }
    };
    _conditions = [];
    _inventory = {
        wearing: [],
        onPerson: [],
        stored: {},
        assets: []
    };
    _ledger = {
        caseInfo: {
            officerInitials: 'HDB',
            caseNumber: 1,
            title: '',
            openedAt: null
        },
        tasks: { active: [], completed: [], failed: [] },
        memories: [],
        contacts: []
    };
    _ui = {
        isPanelOpen: false,
        currentTab: 'status',
        currentInventorySection: 'wearing'
    };
    
    dispatchStateChange('reset');
}

// ═══════════════════════════════════════════════════════════════
// STATE CHANGE EVENT
// ═══════════════════════════════════════════════════════════════

function dispatchStateChange(source) {
    document.dispatchEvent(new CustomEvent('if:state-changed', {
        detail: { source }
    }));
}

// Subscribe to state changes
export function onStateChange(callback) {
    const handler = (e) => callback(e.detail.source);
    document.addEventListener('if:state-changed', handler);
    
    // Return unsubscribe function
    return () => document.removeEventListener('if:state-changed', handler);
}
