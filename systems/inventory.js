/**
 * Interfacing - Inventory System
 * Manages equipment (wearing), items (onPerson), storage, and assets
 * 
 * Dependencies: state.js, ie-bridge.js, config.js
 */

import * as state from '../core/state.js';
import * as ie from '../core/ie-bridge.js';
import { EQUIPMENT_SLOTS, ITEM_CATEGORIES } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════

function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT (Wearing)
// ═══════════════════════════════════════════════════════════════

/**
 * Equip an item
 * @param {Object} item - Item to equip
 * @returns {boolean} Success
 */
export function equipItem(item) {
    // Validate slot
    if (!item.slot || !EQUIPMENT_SLOTS[item.slot]) {
        console.warn('[Interfacing] Invalid equipment slot:', item.slot);
        return false;
    }
    
    const inventory = state._getInventoryRef();
    
    // Check if slot is occupied (handle multi-slot like hands)
    const slotConfig = EQUIPMENT_SLOTS[item.slot];
    const itemsInSlot = inventory.wearing.filter(i => i.slot === item.slot);
    
    if (itemsInSlot.length >= slotConfig.maxItems) {
        // Unequip first item in slot
        unequipItem(itemsInSlot[0].id);
    }
    
    // Create new item with ID and timestamp
    const newItem = {
        ...item,
        id: item.id || generateId('equip'),
        equippedAt: Date.now()
    };
    
    // Add to wearing
    inventory.wearing.push(newItem);
    
    // Register modifiers with IE
    if (newItem.modifiers) {
        Object.entries(newItem.modifiers).forEach(([skill, value]) => {
            ie.registerModifier(newItem.id, skill, value);
        });
    }
    
    // Trigger state update
    state.setInventory(inventory);
    
    dispatchEquipped(newItem);
    return true;
}

/**
 * Unequip an item by ID
 * @param {string} itemId - ID of item to unequip
 * @returns {Object|null} The unequipped item, or null if not found
 */
export function unequipItem(itemId) {
    const inventory = state._getInventoryRef();
    const itemIndex = inventory.wearing.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return null;
    
    const item = inventory.wearing[itemIndex];
    
    // Remove modifiers from IE
    ie.removeModifierSource(itemId);
    
    // Remove from wearing
    inventory.wearing.splice(itemIndex, 1);
    
    // Trigger state update
    state.setInventory(inventory);
    
    dispatchUnequipped(item);
    return item;
}

/**
 * Update an equipped item
 * @param {string} itemId - ID of item to update
 * @param {Object} updates - Properties to update
 */
export function updateEquippedItem(itemId, updates) {
    const inventory = state._getInventoryRef();
    const item = inventory.wearing.find(i => i.id === itemId);
    
    if (!item) return false;
    
    // If modifiers changed, update IE
    if (updates.modifiers) {
        // Remove old modifiers
        ie.removeModifierSource(itemId);
        
        // Register new modifiers
        Object.entries(updates.modifiers).forEach(([skill, value]) => {
            ie.registerModifier(itemId, skill, value);
        });
    }
    
    Object.assign(item, updates);
    state.setInventory(inventory);
    return true;
}

/**
 * Get item equipped in a specific slot
 */
export function getEquippedInSlot(slot) {
    const inventory = state.getInventory();
    return inventory.wearing.filter(i => i.slot === slot);
}

/**
 * Get all equipped items
 */
export function getAllEquipped() {
    return state.getInventory().wearing;
}

/**
 * Check if a slot is occupied
 */
export function isSlotOccupied(slot) {
    const slotConfig = EQUIPMENT_SLOTS[slot];
    if (!slotConfig) return false;
    
    const itemsInSlot = getEquippedInSlot(slot);
    return itemsInSlot.length >= slotConfig.maxItems;
}

// ═══════════════════════════════════════════════════════════════
// ITEMS (On Person)
// ═══════════════════════════════════════════════════════════════

/**
 * Add an item to inventory
 * @param {Object} item - Item to add
 * @param {string} section - 'onPerson' or 'assets'
 */
export function addItem(item, section = 'onPerson') {
    const inventory = state._getInventoryRef();
    
    const newItem = {
        ...item,
        id: item.id || generateId('item'),
        quantity: item.quantity ?? 1,
        category: item.category || 'misc',
        addedAt: Date.now()
    };
    
    if (section === 'onPerson') {
        inventory.onPerson.push(newItem);
    } else if (section === 'assets') {
        inventory.assets.push(newItem);
    } else {
        console.warn('[Interfacing] Invalid section:', section);
        return null;
    }
    
    state.setInventory(inventory);
    dispatchItemAdded(newItem, section);
    return newItem;
}

/**
 * Remove an item from inventory
 * @param {string} itemId - ID of item to remove
 * @param {string} section - 'onPerson' or 'assets'
 */
export function removeItem(itemId, section = 'onPerson') {
    const inventory = state._getInventoryRef();
    let removed = null;
    
    if (section === 'onPerson') {
        const idx = inventory.onPerson.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            removed = inventory.onPerson.splice(idx, 1)[0];
        }
    } else if (section === 'assets') {
        const idx = inventory.assets.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            removed = inventory.assets.splice(idx, 1)[0];
        }
    }
    
    if (removed) {
        state.setInventory(inventory);
        dispatchItemRemoved(removed, section);
    }
    
    return removed;
}

/**
 * Update item quantity
 * @param {string} itemId - ID of item
 * @param {number} delta - Amount to change
 * @param {string} section - 'onPerson' or 'assets'
 */
export function updateItemQuantity(itemId, delta, section = 'onPerson') {
    const inventory = state._getInventoryRef();
    const items = section === 'onPerson' ? inventory.onPerson : inventory.assets;
    const item = items.find(i => i.id === itemId);
    
    if (!item) return false;
    
    item.quantity = Math.max(0, (item.quantity || 1) + delta);
    
    if (item.quantity === 0) {
        return removeItem(itemId, section);
    }
    
    state.setInventory(inventory);
    return true;
}

/**
 * Update an item's properties
 */
export function updateItem(itemId, updates, section = 'onPerson') {
    const inventory = state._getInventoryRef();
    const items = section === 'onPerson' ? inventory.onPerson : inventory.assets;
    const item = items.find(i => i.id === itemId);
    
    if (!item) return false;
    
    Object.assign(item, updates);
    state.setInventory(inventory);
    return true;
}

/**
 * Find item by ID across all sections
 */
export function findItem(itemId) {
    const inventory = state.getInventory();
    
    // Check wearing
    let item = inventory.wearing.find(i => i.id === itemId);
    if (item) return { item, section: 'wearing' };
    
    // Check onPerson
    item = inventory.onPerson.find(i => i.id === itemId);
    if (item) return { item, section: 'onPerson' };
    
    // Check assets
    item = inventory.assets.find(i => i.id === itemId);
    if (item) return { item, section: 'assets' };
    
    // Check stored
    for (const [location, items] of Object.entries(inventory.stored)) {
        item = items.find(i => i.id === itemId);
        if (item) return { item, section: 'stored', location };
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE LOCATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a storage location
 * @param {string} name - Name of the location
 */
export function addStorageLocation(name) {
    const inventory = state._getInventoryRef();
    
    if (inventory.stored[name]) {
        return false; // Already exists
    }
    
    inventory.stored[name] = [];
    state.setInventory(inventory);
    return true;
}

/**
 * Remove a storage location (and all items in it)
 * @param {string} name - Name of the location
 */
export function removeStorageLocation(name) {
    const inventory = state._getInventoryRef();
    
    if (!inventory.stored[name]) {
        return false;
    }
    
    delete inventory.stored[name];
    state.setInventory(inventory);
    return true;
}

/**
 * Rename a storage location
 */
export function renameStorageLocation(oldName, newName) {
    const inventory = state._getInventoryRef();
    
    if (!inventory.stored[oldName] || inventory.stored[newName]) {
        return false;
    }
    
    inventory.stored[newName] = inventory.stored[oldName];
    delete inventory.stored[oldName];
    state.setInventory(inventory);
    return true;
}

/**
 * Get all storage location names
 */
export function getStorageLocations() {
    return Object.keys(state.getInventory().stored);
}

/**
 * Get items in a storage location
 */
export function getStorageItems(locationName) {
    const inventory = state.getInventory();
    return inventory.stored[locationName] || [];
}

/**
 * Add item to storage
 */
export function addItemToStorage(locationName, item) {
    const inventory = state._getInventoryRef();
    
    if (!inventory.stored[locationName]) {
        inventory.stored[locationName] = [];
    }
    
    const newItem = {
        ...item,
        id: item.id || generateId('stored'),
        quantity: item.quantity ?? 1,
        category: item.category || 'misc',
        addedAt: Date.now()
    };
    
    inventory.stored[locationName].push(newItem);
    state.setInventory(inventory);
    dispatchItemAdded(newItem, 'stored', locationName);
    return newItem;
}

/**
 * Remove item from storage
 */
export function removeItemFromStorage(locationName, itemId) {
    const inventory = state._getInventoryRef();
    
    if (!inventory.stored[locationName]) return null;
    
    const idx = inventory.stored[locationName].findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    
    const removed = inventory.stored[locationName].splice(idx, 1)[0];
    state.setInventory(inventory);
    dispatchItemRemoved(removed, 'stored', locationName);
    return removed;
}

// ═══════════════════════════════════════════════════════════════
// MOVE ITEMS BETWEEN SECTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Move item between sections
 * @param {string} itemId - Item to move
 * @param {string} fromSection - Source section
 * @param {string} toSection - Destination section
 * @param {string} fromLocation - Source storage location (if from stored)
 * @param {string} toLocation - Destination storage location (if to stored)
 */
export function moveItem(itemId, fromSection, toSection, fromLocation = null, toLocation = null) {
    const inventory = state._getInventoryRef();
    let item = null;
    
    // Remove from source
    if (fromSection === 'onPerson') {
        const idx = inventory.onPerson.findIndex(i => i.id === itemId);
        if (idx !== -1) item = inventory.onPerson.splice(idx, 1)[0];
    } else if (fromSection === 'assets') {
        const idx = inventory.assets.findIndex(i => i.id === itemId);
        if (idx !== -1) item = inventory.assets.splice(idx, 1)[0];
    } else if (fromSection === 'stored' && fromLocation) {
        if (inventory.stored[fromLocation]) {
            const idx = inventory.stored[fromLocation].findIndex(i => i.id === itemId);
            if (idx !== -1) item = inventory.stored[fromLocation].splice(idx, 1)[0];
        }
    } else if (fromSection === 'wearing') {
        // Unequip and get item
        const idx = inventory.wearing.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            item = inventory.wearing.splice(idx, 1)[0];
            ie.removeModifierSource(itemId);
        }
    }
    
    if (!item) return false;
    
    // Add to destination
    if (toSection === 'onPerson') {
        inventory.onPerson.push(item);
    } else if (toSection === 'assets') {
        inventory.assets.push(item);
    } else if (toSection === 'stored' && toLocation) {
        if (!inventory.stored[toLocation]) {
            inventory.stored[toLocation] = [];
        }
        inventory.stored[toLocation].push(item);
    } else if (toSection === 'wearing') {
        // This requires the item to have a slot - use equipItem instead
        console.warn('[Interfacing] Use equipItem() to move items to wearing');
        // Put it back in onPerson
        inventory.onPerson.push(item);
    }
    
    state.setInventory(inventory);
    return true;
}

// ═══════════════════════════════════════════════════════════════
// IE SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Re-register all equipment modifiers with IE
 * Call this on load to sync state
 */
export function syncAllModifiersToIE() {
    const inventory = state.getInventory();
    
    inventory.wearing.forEach(item => {
        if (item.modifiers) {
            Object.entries(item.modifiers).forEach(([skill, value]) => {
                ie.registerModifier(item.id, skill, value);
            });
        }
    });
    
    console.log(`[Interfacing] Synced ${inventory.wearing.length} equipment items to IE`);
}

/**
 * Get total modifier for a skill from all equipment
 */
export function getEquipmentModifier(skillId) {
    const inventory = state.getInventory();
    let total = 0;
    
    inventory.wearing.forEach(item => {
        if (item.modifiers?.[skillId]) {
            total += item.modifiers[skillId];
        }
    });
    
    return total;
}

/**
 * Get all equipment modifiers as a summary
 */
export function getAllEquipmentModifiers() {
    const inventory = state.getInventory();
    const totals = {};
    
    inventory.wearing.forEach(item => {
        if (item.modifiers) {
            Object.entries(item.modifiers).forEach(([skill, value]) => {
                totals[skill] = (totals[skill] || 0) + value;
            });
        }
    });
    
    return totals;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get full inventory summary
 */
export function getInventorySummary() {
    const inventory = state.getInventory();
    
    return {
        wearing: inventory.wearing.length,
        onPerson: inventory.onPerson.length,
        stored: Object.entries(inventory.stored).reduce((acc, [loc, items]) => {
            acc[loc] = items.length;
            return acc;
        }, {}),
        storedTotal: Object.values(inventory.stored).reduce((sum, items) => sum + items.length, 0),
        assets: inventory.assets.length
    };
}

/**
 * Search items by name
 */
export function searchItems(query) {
    const inventory = state.getInventory();
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    // Search all sections
    inventory.wearing.forEach(item => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
            results.push({ item, section: 'wearing' });
        }
    });
    
    inventory.onPerson.forEach(item => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
            results.push({ item, section: 'onPerson' });
        }
    });
    
    inventory.assets.forEach(item => {
        if (item.name.toLowerCase().includes(lowerQuery)) {
            results.push({ item, section: 'assets' });
        }
    });
    
    Object.entries(inventory.stored).forEach(([location, items]) => {
        items.forEach(item => {
            if (item.name.toLowerCase().includes(lowerQuery)) {
                results.push({ item, section: 'stored', location });
            }
        });
    });
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// EVENT DISPATCHERS
// ═══════════════════════════════════════════════════════════════

function dispatchEquipped(item) {
    document.dispatchEvent(new CustomEvent('if:item-equipped', {
        detail: { item, slot: item.slot, modifiers: item.modifiers }
    }));
}

function dispatchUnequipped(item) {
    document.dispatchEvent(new CustomEvent('if:item-unequipped', {
        detail: { item, slot: item.slot }
    }));
}

function dispatchItemAdded(item, section, location = null) {
    document.dispatchEvent(new CustomEvent('if:item-added', {
        detail: { item, section, location }
    }));
}

function dispatchItemRemoved(item, section, location = null) {
    document.dispatchEvent(new CustomEvent('if:item-removed', {
        detail: { item, section, location }
    }));
}
