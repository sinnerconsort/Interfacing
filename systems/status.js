/**
 * Interfacing - Status System
 * Manages Health, Morale, and Conditions
 * 
 * Dependencies: state.js, ie-bridge.js, config.js
 */

import * as state from '../core/state.js';
import * as ie from '../core/ie-bridge.js';
import { DEFAULT_SETTINGS } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// VITALS INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize vitals based on IE skill levels
 * Called when IE connects
 */
export function initVitalsFromSkills() {
    const settings = state.getSettings();
    const vitals = state.getVitals();
    
    // Get skill levels from IE (or default to 1)
    const endurance = ie.getEffectiveSkillLevel('endurance') || 1;
    const volition = ie.getEffectiveSkillLevel('volition') || 1;
    
    const maxHealth = (settings.baseHealth || DEFAULT_SETTINGS.baseHealth) + endurance;
    const maxMorale = (settings.baseMorale || DEFAULT_SETTINGS.baseMorale) + volition;
    
    // Only init if max values aren't already set (preserve loaded data)
    if (!vitals.health.max || vitals.health.max === DEFAULT_SETTINGS.baseHealth) {
        state.setVitals(
            { current: maxHealth, max: maxHealth, temp: vitals.health.temp || 0 },
            { current: maxMorale, max: maxMorale, temp: vitals.morale.temp || 0 }
        );
        console.log(`[Interfacing] Vitals initialized: HP ${maxHealth}, Morale ${maxMorale}`);
    }
}

/**
 * Recalculate max vitals (call when Endurance/Volition change)
 */
export function recalculateMaxVitals() {
    const settings = state.getSettings();
    const vitals = state.getVitals();
    
    const endurance = ie.getEffectiveSkillLevel('endurance') || 1;
    const volition = ie.getEffectiveSkillLevel('volition') || 1;
    
    const newMaxHealth = (settings.baseHealth || DEFAULT_SETTINGS.baseHealth) + endurance;
    const newMaxMorale = (settings.baseMorale || DEFAULT_SETTINGS.baseMorale) + volition;
    
    // Adjust current if it exceeds new max
    const newCurrentHealth = Math.min(vitals.health.current, newMaxHealth + vitals.health.temp);
    const newCurrentMorale = Math.min(vitals.morale.current, newMaxMorale + vitals.morale.temp);
    
    state.setVitals(
        { current: newCurrentHealth, max: newMaxHealth, temp: vitals.health.temp },
        { current: newCurrentMorale, max: newMaxMorale, temp: vitals.morale.temp }
    );
}

// ═══════════════════════════════════════════════════════════════
// HEALTH MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Modify health by delta
 * @param {number} delta - Amount to change (+/-)
 * @param {string} source - What caused the change
 */
export function modifyHealth(delta, source = 'manual') {
    const vitals = state.getVitals();
    const effectiveMax = vitals.health.max + vitals.health.temp;
    
    const newCurrent = Math.max(0, Math.min(effectiveMax, vitals.health.current + delta));
    
    state.setVitals(
        { ...vitals.health, current: newCurrent },
        vitals.morale
    );
    
    dispatchVitalsChanged('health', delta, source);
    
    // Check for death
    if (newCurrent === 0) {
        dispatchDeath('health');
    }
    
    return newCurrent;
}

/**
 * Set health to specific value
 */
export function setHealth(value, source = 'manual') {
    const vitals = state.getVitals();
    const effectiveMax = vitals.health.max + vitals.health.temp;
    
    const newCurrent = Math.max(0, Math.min(effectiveMax, value));
    
    state.setVitals(
        { ...vitals.health, current: newCurrent },
        vitals.morale
    );
    
    dispatchVitalsChanged('health', newCurrent - vitals.health.current, source);
    
    if (newCurrent === 0) {
        dispatchDeath('health');
    }
    
    return newCurrent;
}

/**
 * Add temporary health
 */
export function addTempHealth(amount, source = 'item') {
    const vitals = state.getVitals();
    
    state.setVitals(
        { ...vitals.health, temp: vitals.health.temp + amount },
        vitals.morale
    );
    
    dispatchVitalsChanged('health-temp', amount, source);
}

/**
 * Remove temporary health
 */
export function removeTempHealth(amount, source = 'item') {
    const vitals = state.getVitals();
    const newTemp = Math.max(0, vitals.health.temp - amount);
    
    // If current exceeds new effective max, reduce it
    const newEffectiveMax = vitals.health.max + newTemp;
    const newCurrent = Math.min(vitals.health.current, newEffectiveMax);
    
    state.setVitals(
        { ...vitals.health, current: newCurrent, temp: newTemp },
        vitals.morale
    );
    
    dispatchVitalsChanged('health-temp', -amount, source);
}

/**
 * Fully heal health
 */
export function fullHealHealth() {
    const vitals = state.getVitals();
    const effectiveMax = vitals.health.max + vitals.health.temp;
    
    state.setVitals(
        { ...vitals.health, current: effectiveMax },
        vitals.morale
    );
    
    dispatchVitalsChanged('health', effectiveMax - vitals.health.current, 'full-heal');
}

// ═══════════════════════════════════════════════════════════════
// MORALE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Modify morale by delta
 * @param {number} delta - Amount to change (+/-)
 * @param {string} source - What caused the change
 */
export function modifyMorale(delta, source = 'manual') {
    const vitals = state.getVitals();
    const effectiveMax = vitals.morale.max + vitals.morale.temp;
    
    const newCurrent = Math.max(0, Math.min(effectiveMax, vitals.morale.current + delta));
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, current: newCurrent }
    );
    
    dispatchVitalsChanged('morale', delta, source);
    
    // Check for giving up
    if (newCurrent === 0) {
        dispatchDeath('morale');
    }
    
    return newCurrent;
}

/**
 * Set morale to specific value
 */
export function setMorale(value, source = 'manual') {
    const vitals = state.getVitals();
    const effectiveMax = vitals.morale.max + vitals.morale.temp;
    
    const newCurrent = Math.max(0, Math.min(effectiveMax, value));
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, current: newCurrent }
    );
    
    dispatchVitalsChanged('morale', newCurrent - vitals.morale.current, source);
    
    if (newCurrent === 0) {
        dispatchDeath('morale');
    }
    
    return newCurrent;
}

/**
 * Add temporary morale
 */
export function addTempMorale(amount, source = 'item') {
    const vitals = state.getVitals();
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, temp: vitals.morale.temp + amount }
    );
    
    dispatchVitalsChanged('morale-temp', amount, source);
}

/**
 * Remove temporary morale
 */
export function removeTempMorale(amount, source = 'item') {
    const vitals = state.getVitals();
    const newTemp = Math.max(0, vitals.morale.temp - amount);
    
    const newEffectiveMax = vitals.morale.max + newTemp;
    const newCurrent = Math.min(vitals.morale.current, newEffectiveMax);
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, current: newCurrent, temp: newTemp }
    );
    
    dispatchVitalsChanged('morale-temp', -amount, source);
}

/**
 * Fully restore morale
 */
export function fullRestoreMorale() {
    const vitals = state.getVitals();
    const effectiveMax = vitals.morale.max + vitals.morale.temp;
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, current: effectiveMax }
    );
    
    dispatchVitalsChanged('morale', effectiveMax - vitals.morale.current, 'full-restore');
}

// ═══════════════════════════════════════════════════════════════
// SKILL CHECK CONSEQUENCES
// ═══════════════════════════════════════════════════════════════

/**
 * Handle consequences of a skill check
 * Called from ie-bridge event handler
 */
export function handleSkillCheckResult(result) {
    const { success, isSnakeEyes, isBoxcars, attribute } = result;
    
    // Determine which vital to affect based on attribute
    const isPhysical = attribute === 'PHYSIQUE' || attribute === 'MOTORICS';
    
    // Failed check = damage
    if (!success) {
        if (isPhysical) {
            modifyHealth(-1, 'skill-check-fail');
        } else {
            modifyMorale(-1, 'skill-check-fail');
        }
    }
    
    // Snake eyes (critical failure) = extra damage
    if (isSnakeEyes) {
        if (isPhysical) {
            modifyHealth(-1, 'critical-failure');
        } else {
            modifyMorale(-1, 'critical-failure');
        }
    }
    
    // Boxcars (critical success) = heal
    if (isBoxcars) {
        if (isPhysical) {
            modifyHealth(1, 'critical-success');
        } else {
            modifyMorale(1, 'critical-success');
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// CONDITIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a condition
 * @param {Object} condition - Condition object
 */
export function addCondition(condition) {
    const success = state.addCondition({
        id: condition.id || `cond_${Date.now()}`,
        name: condition.name,
        description: condition.description || '',
        icon: condition.icon || '•',
        modifiers: condition.modifiers || {},
        source: condition.source || 'manual',
        duration: condition.duration || null,
        addedAt: Date.now()
    });
    
    if (success && condition.modifiers) {
        // Register modifiers with IE
        Object.entries(condition.modifiers).forEach(([skill, value]) => {
            ie.registerModifier(`condition_${condition.id}`, skill, value);
        });
    }
    
    return success;
}

/**
 * Remove a condition
 */
export function removeCondition(conditionId) {
    const condition = state.getCondition(conditionId);
    if (!condition) return false;
    
    // Remove modifiers from IE
    ie.removeModifierSource(`condition_${conditionId}`);
    
    return state.removeCondition(conditionId);
}

/**
 * Get all current conditions
 */
export function getConditions() {
    return state.getConditions();
}

/**
 * Sync conditions from IE's status system
 */
export function syncConditionsFromIE() {
    const ieStatuses = ie.getStatuses();
    
    if (ieStatuses.length === 0) return;
    
    // Convert IE statuses to our format
    const conditions = ieStatuses.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        icon: s.icon || '•',
        modifiers: s.modifiers || {},
        source: 'ie-sync',
        duration: s.duration,
        addedAt: s.addedAt || Date.now()
    }));
    
    state.setConditions(conditions);
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT BONUSES (read-only summary)
// ═══════════════════════════════════════════════════════════════

/**
 * Get total bonuses from equipped items
 * @returns {Object} { skillId: totalValue, ... }
 */
export function getEquipmentBonuses() {
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

/**
 * Get bonuses grouped by source item
 * @returns {Array} [{ item, bonuses: { skill: value } }, ...]
 */
export function getEquipmentBonusesByItem() {
    const inventory = state.getInventory();
    
    return inventory.wearing
        .filter(item => item.modifiers && Object.keys(item.modifiers).length > 0)
        .map(item => ({
            item: {
                id: item.id,
                name: item.name,
                slot: item.slot
            },
            bonuses: { ...item.modifiers }
        }));
}

// ═══════════════════════════════════════════════════════════════
// VITALS QUERIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get current health info
 */
export function getHealth() {
    const vitals = state.getVitals();
    return {
        ...vitals.health,
        effectiveMax: vitals.health.max + vitals.health.temp,
        percentage: vitals.health.current / (vitals.health.max + vitals.health.temp) * 100,
        isCritical: vitals.health.current <= Math.ceil((vitals.health.max + vitals.health.temp) * 0.25)
    };
}

/**
 * Get current morale info
 */
export function getMorale() {
    const vitals = state.getVitals();
    return {
        ...vitals.morale,
        effectiveMax: vitals.morale.max + vitals.morale.temp,
        percentage: vitals.morale.current / (vitals.morale.max + vitals.morale.temp) * 100,
        isCritical: vitals.morale.current <= Math.ceil((vitals.morale.max + vitals.morale.temp) * 0.25)
    };
}

/**
 * Check if player is alive (both vitals > 0)
 */
export function isAlive() {
    const vitals = state.getVitals();
    return vitals.health.current > 0 && vitals.morale.current > 0;
}

// ═══════════════════════════════════════════════════════════════
// EVENT DISPATCHERS
// ═══════════════════════════════════════════════════════════════

function dispatchVitalsChanged(type, delta, source) {
    const vitals = state.getVitals();
    
    document.dispatchEvent(new CustomEvent('if:vitals-changed', {
        detail: { 
            type,
            delta,
            source,
            health: vitals.health, 
            morale: vitals.morale 
        }
    }));
}

function dispatchDeath(type) {
    document.dispatchEvent(new CustomEvent('if:death', {
        detail: { type } // 'health' = died, 'morale' = gave up
    }));
}
