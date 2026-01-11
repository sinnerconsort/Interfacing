/**
 * Interfacing - Vitals System
 * Health and Morale pools with damage/healing
 */

// ═══════════════════════════════════════════════════════════════
// VITALS STATE
// ═══════════════════════════════════════════════════════════════

let vitals = {
    health: { current: 3, max: 3 },
    morale: { current: 3, max: 3 }
};

let vitalChangeCallbacks = [];

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize vitals with max values
 */
export function initVitals(maxHealth, maxMorale) {
    vitals.health.max = maxHealth;
    vitals.health.current = maxHealth;
    vitals.morale.max = maxMorale;
    vitals.morale.current = maxMorale;
    
    notifyChange();
    console.log(`[Interfacing:Vitals] Initialized - Health: ${maxHealth}, Morale: ${maxMorale}`);
}

/**
 * Recalculate max vitals based on IE skill levels
 */
export function recalculateMaxVitals(baseHealth = 3, baseMorale = 3) {
    const IE = window.InlandEmpire;
    
    const endurance = IE?.getEffectiveSkillLevel?.('endurance') || 2;
    const volition = IE?.getEffectiveSkillLevel?.('volition') || 2;
    
    const newMaxHealth = baseHealth + endurance;
    const newMaxMorale = baseMorale + volition;
    
    // Update max, keeping current proportional
    const healthRatio = vitals.health.current / vitals.health.max;
    const moraleRatio = vitals.morale.current / vitals.morale.max;
    
    vitals.health.max = newMaxHealth;
    vitals.morale.max = newMaxMorale;
    
    // Optionally adjust current to maintain ratio
    // vitals.health.current = Math.round(newMaxHealth * healthRatio);
    // vitals.morale.current = Math.round(newMaxMorale * moraleRatio);
    
    // Cap current at new max
    vitals.health.current = Math.min(vitals.health.current, newMaxHealth);
    vitals.morale.current = Math.min(vitals.morale.current, newMaxMorale);
    
    notifyChange();
}

// ═══════════════════════════════════════════════════════════════
// DAMAGE & HEALING
// ═══════════════════════════════════════════════════════════════

/**
 * Damage health
 * @returns {boolean} True if this caused death (health <= 0)
 */
export function damageHealth(amount) {
    vitals.health.current = Math.max(0, vitals.health.current - amount);
    notifyChange();
    
    if (vitals.health.current <= 0) {
        onHealthDepleted();
        return true;
    }
    return false;
}

/**
 * Damage morale
 * @returns {boolean} True if this caused breakdown (morale <= 0)
 */
export function damageMorale(amount) {
    vitals.morale.current = Math.max(0, vitals.morale.current - amount);
    notifyChange();
    
    if (vitals.morale.current <= 0) {
        onMoraleDepleted();
        return true;
    }
    return false;
}

/**
 * Heal health
 */
export function healHealth(amount) {
    vitals.health.current = Math.min(vitals.health.max, vitals.health.current + amount);
    notifyChange();
}

/**
 * Heal morale
 */
export function healMorale(amount) {
    vitals.morale.current = Math.min(vitals.morale.max, vitals.morale.current + amount);
    notifyChange();
}

/**
 * Full heal
 */
export function fullHeal() {
    vitals.health.current = vitals.health.max;
    vitals.morale.current = vitals.morale.max;
    notifyChange();
}

/**
 * Set vitals directly (for loading saves)
 */
export function setVitals(health, morale) {
    if (health !== undefined) {
        vitals.health.current = Math.min(health, vitals.health.max);
    }
    if (morale !== undefined) {
        vitals.morale.current = Math.min(morale, vitals.morale.max);
    }
    notifyChange();
}

// ═══════════════════════════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get current vitals
 */
export function getVitals() {
    return {
        health: { ...vitals.health },
        morale: { ...vitals.morale }
    };
}

/**
 * Get health as percentage (0-1)
 */
export function getHealthPercent() {
    return vitals.health.current / vitals.health.max;
}

/**
 * Get morale as percentage (0-1)
 */
export function getMoralePercent() {
    return vitals.morale.current / vitals.morale.max;
}

/**
 * Check if health is critical (25% or less)
 */
export function isHealthCritical() {
    return getHealthPercent() <= 0.25;
}

/**
 * Check if morale is critical
 */
export function isMoraleCritical() {
    return getMoralePercent() <= 0.25;
}

// ═══════════════════════════════════════════════════════════════
// DEPLETION EVENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Called when health hits 0
 */
function onHealthDepleted() {
    console.log('[Interfacing:Vitals] Health depleted!');
    
    // Dispatch event for other systems to react
    document.dispatchEvent(new CustomEvent('interfacing:health-depleted', {
        detail: { vitals: getVitals() }
    }));
    
    // Could trigger The Pale sequence, game over, etc.
}

/**
 * Called when morale hits 0
 */
function onMoraleDepleted() {
    console.log('[Interfacing:Vitals] Morale depleted!');
    
    document.dispatchEvent(new CustomEvent('interfacing:morale-depleted', {
        detail: { vitals: getVitals() }
    }));
    
    // Could trigger breakdown, The Pale, etc.
}

// ═══════════════════════════════════════════════════════════════
// CHANGE NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Subscribe to vital changes
 */
export function onVitalChange(callback) {
    vitalChangeCallbacks.push(callback);
    return () => {
        vitalChangeCallbacks = vitalChangeCallbacks.filter(cb => cb !== callback);
    };
}

/**
 * Notify all subscribers of change
 */
function notifyChange() {
    const current = getVitals();
    for (const cb of vitalChangeCallbacks) {
        try {
            cb(current);
        } catch (e) {
            console.error('[Interfacing:Vitals] Callback error:', e);
        }
    }
    
    // Also dispatch DOM event
    document.dispatchEvent(new CustomEvent('interfacing:vitals-changed', {
        detail: current
    }));
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Export state for saving
 */
export function exportState() {
    return {
        health: vitals.health.current,
        morale: vitals.morale.current,
        maxHealth: vitals.health.max,
        maxMorale: vitals.morale.max
    };
}

/**
 * Import state from save
 */
export function importState(state) {
    if (!state) return;
    
    if (state.maxHealth) vitals.health.max = state.maxHealth;
    if (state.maxMorale) vitals.morale.max = state.maxMorale;
    if (state.health !== undefined) vitals.health.current = state.health;
    if (state.morale !== undefined) vitals.morale.current = state.morale;
    
    notifyChange();
}
