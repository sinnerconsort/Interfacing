/**
 * Interfacing - Inventory System
 * Manages equipped items, modifier aggregation, and IE sync
 */

import { PRESET_ITEMS, CATEGORIES, getItemOwnerSkill, createCustomItem } from '../data/items.js';

// ═══════════════════════════════════════════════════════════════
// INVENTORY STATE
// ═══════════════════════════════════════════════════════════════

let equipped = {
    clothes: {},  // slot -> item
    tools: [],    // array of items
    held: []      // array of items (max 2 usually)
};

let consumables = [];  // { item, quantity, activeUntil? }
let customItems = {};  // User-created items
let allItems = { ...PRESET_ITEMS };  // Preset + custom

// Active consumable effects
let activeEffects = [];  // { itemId, expiresAt, modifiers }

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function initInventory() {
    console.log('[Interfacing:Inventory] Initialized');
    // Load from localStorage or ST settings later
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Equip an item
 * @returns {object|null} Previously equipped item (if slot was occupied)
 */
export function equipItem(itemOrId) {
    const item = typeof itemOrId === 'string' ? allItems[itemOrId] : itemOrId;
    if (!item) return null;
    
    let previousItem = null;
    
    switch (item.category) {
        case 'clothes':
            // Clothes go in slots
            if (item.slot) {
                previousItem = equipped.clothes[item.slot] || null;
                equipped.clothes[item.slot] = item;
            }
            break;
            
        case 'tools':
            // Tools are a list (no limit for now)
            if (!equipped.tools.find(t => t.id === item.id)) {
                equipped.tools.push(item);
            }
            break;
            
        case 'held':
            // Max 2 held items
            if (equipped.held.length >= 2) {
                previousItem = equipped.held.shift();
            }
            if (!equipped.held.find(h => h.id === item.id)) {
                equipped.held.push(item);
            }
            break;
            
        case 'consumable':
            // Consumables go to inventory, not equipped
            addConsumable(item);
            return null;
    }
    
    // Sync to IE
    syncItemToIE(item, true);
    if (previousItem) {
        syncItemToIE(previousItem, false);
    }
    
    return previousItem;
}

/**
 * Unequip an item
 */
export function unequipItem(itemOrId) {
    const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
    let removed = null;
    
    // Check clothes slots
    for (const [slot, item] of Object.entries(equipped.clothes)) {
        if (item?.id === itemId) {
            removed = item;
            delete equipped.clothes[slot];
            break;
        }
    }
    
    // Check tools
    if (!removed) {
        const toolIdx = equipped.tools.findIndex(t => t.id === itemId);
        if (toolIdx !== -1) {
            removed = equipped.tools.splice(toolIdx, 1)[0];
        }
    }
    
    // Check held
    if (!removed) {
        const heldIdx = equipped.held.findIndex(h => h.id === itemId);
        if (heldIdx !== -1) {
            removed = equipped.held.splice(heldIdx, 1)[0];
        }
    }
    
    if (removed) {
        syncItemToIE(removed, false);
    }
    
    return removed;
}

/**
 * Get all currently equipped items
 */
export function getEquippedItems() {
    const items = [];
    
    // Clothes
    for (const item of Object.values(equipped.clothes)) {
        if (item) items.push(item);
    }
    
    // Tools
    items.push(...equipped.tools);
    
    // Held
    items.push(...equipped.held);
    
    return items;
}

/**
 * Get item in a specific clothes slot
 */
export function getClothesSlot(slot) {
    return equipped.clothes[slot] || null;
}

// ═══════════════════════════════════════════════════════════════
// CONSUMABLES
// ═══════════════════════════════════════════════════════════════

/**
 * Add a consumable to inventory
 */
export function addConsumable(itemOrId, quantity = 1) {
    const item = typeof itemOrId === 'string' ? allItems[itemOrId] : itemOrId;
    if (!item || item.category !== 'consumable') return;
    
    const existing = consumables.find(c => c.item.id === item.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        consumables.push({ item, quantity });
    }
}

/**
 * Use a consumable - applies temporary modifiers
 */
export function useConsumable(itemId) {
    const consumable = consumables.find(c => c.item.id === itemId);
    if (!consumable || consumable.quantity <= 0) return null;
    
    consumable.quantity--;
    
    // Remove if depleted
    if (consumable.quantity <= 0) {
        consumables = consumables.filter(c => c.item.id !== itemId);
    }
    
    // Apply temporary effect
    const effect = {
        itemId: consumable.item.id,
        item: consumable.item,
        appliedAt: Date.now(),
        duration: consumable.item.duration || 10,
        messagesRemaining: consumable.item.duration || 10,
        modifiers: { ...consumable.item.modifiers }
    };
    
    activeEffects.push(effect);
    
    // Sync temporary modifiers to IE
    syncConsumableToIE(effect, true);
    
    return effect;
}

/**
 * Tick consumable durations (call after each message)
 */
export function tickConsumables() {
    const expired = [];
    
    activeEffects = activeEffects.filter(effect => {
        effect.messagesRemaining--;
        
        if (effect.messagesRemaining <= 0) {
            expired.push(effect);
            syncConsumableToIE(effect, false);
            return false;
        }
        return true;
    });
    
    return expired;  // Return for withdrawal handling
}

/**
 * Get active consumable effects
 */
export function getActiveEffects() {
    return [...activeEffects];
}

/**
 * Get consumables in inventory
 */
export function getConsumables() {
    return [...consumables];
}

// ═══════════════════════════════════════════════════════════════
// MODIFIER AGGREGATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get all modifiers from equipped items (for IE sync)
 * Returns: { [sourceId]: { [skillId]: value } }
 */
export function getEquippedModifiers() {
    const modifiers = {};
    
    for (const item of getEquippedItems()) {
        if (item.modifiers) {
            modifiers[item.id] = { ...item.modifiers };
        }
    }
    
    return modifiers;
}

/**
 * Get aggregated bonuses for display
 * Returns: { [skillId]: totalBonus }
 */
export function getAggregatedBonuses() {
    const totals = {};
    
    // Equipment
    for (const item of getEquippedItems()) {
        if (item.modifiers) {
            for (const [skillId, value] of Object.entries(item.modifiers)) {
                totals[skillId] = (totals[skillId] || 0) + value;
            }
        }
    }
    
    // Active consumables
    for (const effect of activeEffects) {
        for (const [skillId, value] of Object.entries(effect.modifiers)) {
            totals[skillId] = (totals[skillId] || 0) + value;
        }
    }
    
    return totals;
}

// ═══════════════════════════════════════════════════════════════
// INLAND EMPIRE SYNC
// ═══════════════════════════════════════════════════════════════

/**
 * Sync a single item's modifiers to IE
 */
function syncItemToIE(item, isEquipping) {
    const IE = window.InlandEmpire;
    if (!IE) return;
    
    if (isEquipping && item.modifiers) {
        for (const [skillId, value] of Object.entries(item.modifiers)) {
            IE.registerModifier(item.id, skillId, value);
        }
    } else {
        IE.removeModifierSource(item.id);
    }
}

/**
 * Sync consumable effect to IE
 */
function syncConsumableToIE(effect, isApplying) {
    const IE = window.InlandEmpire;
    if (!IE) return;
    
    const sourceId = `consumable_${effect.itemId}`;
    
    if (isApplying) {
        for (const [skillId, value] of Object.entries(effect.modifiers)) {
            IE.registerModifier(sourceId, skillId, value);
        }
    } else {
        IE.removeModifierSource(sourceId);
    }
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM ITEMS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a custom item to the item pool
 */
export function addCustomItem(name, category, modifiers = {}, slot = null) {
    const item = createCustomItem(name, category, modifiers);
    if (slot && category === 'clothes') {
        item.slot = slot;
    }
    
    customItems[item.id] = item;
    allItems[item.id] = item;
    
    return item;
}

/**
 * Get an item by ID (preset or custom)
 */
export function getItem(itemId) {
    return allItems[itemId] || null;
}

/**
 * Get all available items
 */
export function getAllItems() {
    return { ...allItems };
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Export inventory state for saving
 */
export function exportState() {
    return {
        equipped: {
            clothes: Object.fromEntries(
                Object.entries(equipped.clothes).map(([slot, item]) => [slot, item?.id])
            ),
            tools: equipped.tools.map(t => t.id),
            held: equipped.held.map(h => h.id)
        },
        consumables: consumables.map(c => ({ itemId: c.item.id, quantity: c.quantity })),
        activeEffects: activeEffects.map(e => ({
            itemId: e.itemId,
            messagesRemaining: e.messagesRemaining
        })),
        customItems
    };
}

/**
 * Import inventory state from save
 */
export function importState(state) {
    if (!state) return;
    
    // Restore custom items first
    if (state.customItems) {
        customItems = state.customItems;
        allItems = { ...PRESET_ITEMS, ...customItems };
    }
    
    // Restore equipped
    if (state.equipped) {
        equipped = {
            clothes: {},
            tools: [],
            held: []
        };
        
        for (const [slot, itemId] of Object.entries(state.equipped.clothes || {})) {
            if (itemId && allItems[itemId]) {
                equipped.clothes[slot] = allItems[itemId];
            }
        }
        
        for (const itemId of state.equipped.tools || []) {
            if (allItems[itemId]) {
                equipped.tools.push(allItems[itemId]);
            }
        }
        
        for (const itemId of state.equipped.held || []) {
            if (allItems[itemId]) {
                equipped.held.push(allItems[itemId]);
            }
        }
    }
    
    // Restore consumables
    if (state.consumables) {
        consumables = state.consumables
            .filter(c => allItems[c.itemId])
            .map(c => ({ item: allItems[c.itemId], quantity: c.quantity }));
    }
    
    // Restore active effects
    if (state.activeEffects) {
        activeEffects = state.activeEffects
            .filter(e => allItems[e.itemId])
            .map(e => ({
                itemId: e.itemId,
                item: allItems[e.itemId],
                messagesRemaining: e.messagesRemaining,
                modifiers: { ...allItems[e.itemId].modifiers }
            }));
    }
}
