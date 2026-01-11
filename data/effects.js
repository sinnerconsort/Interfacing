/**
 * Interfacing - Effects Data
 * Consumable durations, withdrawals, and temporary effect definitions
 */

// ═══════════════════════════════════════════════════════════════
// WITHDRAWAL EFFECTS
// ═══════════════════════════════════════════════════════════════

export const WITHDRAWAL_EFFECTS = {
    pyrholidon_withdrawal: {
        id: 'pyrholidon_withdrawal',
        name: 'Pyrholidon Withdrawal',
        duration: 15,  // messages
        modifiers: {
            reaction_speed: -1,
            perception: -1,
            volition: -1
        },
        description: 'The comedown hits. Your thoughts feel like they\'re wading through syrup.'
    },
    
    alcohol_withdrawal: {
        id: 'alcohol_withdrawal',
        name: 'Alcohol Withdrawal',
        duration: 20,
        modifiers: {
            hand_eye_coordination: -1,
            composure: -1,
            volition: -1
        },
        description: 'The shakes begin. Your body remembers what you\'ve done to it.'
    },
    
    nicotine_craving: {
        id: 'nicotine_craving',
        name: 'Nicotine Craving',
        duration: 10,
        modifiers: {
            composure: -1,
            volition: -1
        },
        description: 'Your fingers twitch for something to hold. Something to burn.'
    }
};

// ═══════════════════════════════════════════════════════════════
// DURATION DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DURATION_DEFAULTS = {
    cigarette: 10,
    alcohol: 20,
    stimulant: 15,
    sedative: 25,
    psychedelic: 30
};

// ═══════════════════════════════════════════════════════════════
// EFFECT CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const EFFECT_CATEGORIES = {
    stimulant: {
        name: 'Stimulant',
        icon: '⚡',
        color: '#bfa127',
        typicalEffects: ['reaction_speed', 'perception', 'logic'],
        typicalDebuffs: ['composure', 'empathy']
    },
    depressant: {
        name: 'Depressant',
        icon: '🌊',
        color: '#6449af',
        typicalEffects: ['inland_empire', 'electrochemistry', 'drama'],
        typicalDebuffs: ['logic', 'reaction_speed', 'hand_eye_coordination']
    },
    nicotine: {
        name: 'Nicotine',
        icon: '🚬',
        color: '#888',
        typicalEffects: ['composure', 'volition'],
        typicalDebuffs: ['endurance']
    },
    psychedelic: {
        name: 'Psychedelic',
        icon: '🌀',
        color: '#53a4b5',
        typicalEffects: ['inland_empire', 'conceptualization', 'shivers'],
        typicalDebuffs: ['logic', 'authority', 'composure']
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get withdrawal effect for a consumable
 */
export function getWithdrawalEffect(consumableId) {
    // Map consumable IDs to withdrawal effects
    const withdrawalMap = {
        'pyrholidon': 'pyrholidon_withdrawal',
        'speed': 'pyrholidon_withdrawal',
        'alcohol_commodore_red': 'alcohol_withdrawal',
        'cigarettes_astra': 'nicotine_craving'
    };
    
    const withdrawalId = withdrawalMap[consumableId];
    return withdrawalId ? WITHDRAWAL_EFFECTS[withdrawalId] : null;
}

/**
 * Create a temporary effect from a withdrawal
 */
export function createWithdrawalInstance(withdrawalId) {
    const withdrawal = WITHDRAWAL_EFFECTS[withdrawalId];
    if (!withdrawal) return null;
    
    return {
        id: `withdrawal_${withdrawalId}_${Date.now()}`,
        sourceId: withdrawalId,
        name: withdrawal.name,
        description: withdrawal.description,
        messagesRemaining: withdrawal.duration,
        modifiers: { ...withdrawal.modifiers },
        isWithdrawal: true
    };
}
