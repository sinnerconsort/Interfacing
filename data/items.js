/**
 * Interfacing - Items Data
 * Equipment definitions with stat modifiers and flavor
 */

// ═══════════════════════════════════════════════════════════════
// ITEM SCHEMA
// ═══════════════════════════════════════════════════════════════

/**
 * Item structure:
 * {
 *   id: string,
 *   name: string,
 *   category: 'clothes' | 'tools' | 'held' | 'consumable',
 *   slot?: string (for clothes: 'hat', 'glasses', 'neck', 'jacket', 'shirt', 'gloves', 'pants', 'shoes'),
 *   modifiers: { [skillId]: number },  // +1, -1, +2, etc.
 *   description?: string,              // Generated or preset
 *   voiceDescriptions?: { [skillId]: string },  // Reaction quotes from other skills
 *   // Consumable-specific:
 *   quantity?: number,
 *   duration?: number,  // in messages or minutes
 *   onUse?: string,     // status effect to apply
 *   onExpire?: string,  // withdrawal effect
 * }
 */

// ═══════════════════════════════════════════════════════════════
// PRESET ITEMS (from Disco Elysium)
// ═══════════════════════════════════════════════════════════════

export const PRESET_ITEMS = {
    // ─────────────────────────────────────────────────────────────
    // CLOTHES - NECK
    // ─────────────────────────────────────────────────────────────
    horrific_necktie: {
        id: 'horrific_necktie',
        name: 'Horrific Necktie',
        category: 'clothes',
        slot: 'neck',
        modifiers: {
            inland_empire: 2,
            electrochemistry: 1,
            composure: -1
        },
        description: null,  // Will be generated
        voiceDescriptions: {}
    },
    
    hideous_necktie: {
        id: 'hideous_necktie', 
        name: 'Hideous Tie',
        category: 'clothes',
        slot: 'neck',
        modifiers: {
            electrochemistry: 1,
            suggestion: -1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // CLOTHES - HAT
    // ─────────────────────────────────────────────────────────────
    faln_pipo_hat: {
        id: 'faln_pipo_hat',
        name: 'FALN "Pipo" Pipo',
        category: 'clothes',
        slot: 'hat',
        modifiers: {
            logic: 2,
            perception: 1
        }
    },

    thought_hat: {
        id: 'thought_hat',
        name: 'Thought Cabinet Hat',
        category: 'clothes', 
        slot: 'hat',
        modifiers: {
            conceptualization: 1,
            inland_empire: 1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // CLOTHES - JACKET
    // ─────────────────────────────────────────────────────────────
    aerostatic_pilot_jacket: {
        id: 'aerostatic_pilot_jacket',
        name: 'Aerostatic Pilot Jacket',
        category: 'clothes',
        slot: 'jacket',
        modifiers: {
            conceptualization: 1,
            inland_empire: 1,
            esprit_de_corps: 1,
            authority: -1
        }
    },

    disco_ass_blazer: {
        id: 'disco_ass_blazer',
        name: 'Disco-Ass Blazer',
        category: 'clothes',
        slot: 'jacket',
        modifiers: {
            electrochemistry: 2,
            savoir_faire: 1,
            suggestion: 1,
            logic: -1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // CLOTHES - SHOES
    // ─────────────────────────────────────────────────────────────
    green_snakeskin_shoes: {
        id: 'green_snakeskin_shoes',
        name: 'Green Snakeskin Shoes',
        category: 'clothes',
        slot: 'shoes',
        modifiers: {
            savoir_faire: 1,
            composure: -1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // CLOTHES - GLOVES
    // ─────────────────────────────────────────────────────────────
    fingerless_gloves: {
        id: 'fingerless_gloves',
        name: 'Fingerless Gloves',
        category: 'clothes',
        slot: 'gloves',
        modifiers: {
            electrochemistry: 1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // TOOLS
    // ─────────────────────────────────────────────────────────────
    flashlight: {
        id: 'flashlight',
        name: 'Flashlight',
        category: 'tools',
        modifiers: {
            perception: 1,
            visual_calculus: 1
        }
    },

    prybar: {
        id: 'prybar',
        name: 'Prybar',
        category: 'tools',
        modifiers: {
            physical_instrument: 1,
            interfacing: 1
        }
    },

    tape_recorder: {
        id: 'tape_recorder',
        name: 'Tape Recorder',
        category: 'tools',
        modifiers: {
            esprit_de_corps: 1,
            rhetoric: 1
        }
    },

    yellow_plastic_bag: {
        id: 'yellow_plastic_bag',
        name: 'Yellow Plastic Bag "Frittte!"',
        category: 'tools',
        modifiers: {
            shivers: 1,
            savoir_faire: -1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // HELD ITEMS
    // ─────────────────────────────────────────────────────────────
    spirit_bomb: {
        id: 'spirit_bomb',
        name: 'Spirit Bomb',
        category: 'held',
        modifiers: {
            half_light: 2,
            hand_eye_coordination: 1
        }
    },

    // ─────────────────────────────────────────────────────────────
    // CONSUMABLES
    // ─────────────────────────────────────────────────────────────
    cigarettes_astra: {
        id: 'cigarettes_astra',
        name: 'Astra Cigarettes',
        category: 'consumable',
        quantity: 5,
        duration: 10,  // messages
        modifiers: {
            composure: 1,
            volition: 1,
            endurance: -1
        },
        onUse: 'nicotine_rush',
        onExpire: null  // No withdrawal for cigs
    },

    pyrholidon: {
        id: 'pyrholidon',
        name: 'Pyrholidon',
        category: 'consumable',
        quantity: 1,
        duration: 15,
        modifiers: {
            reaction_speed: 1,
            perception: 1,
            logic: 1,
            composure: -1
        },
        onUse: 'pyrholidon',
        onExpire: 'pyrholidon_withdrawal'
    },

    alcohol_commodore_red: {
        id: 'alcohol_commodore_red',
        name: 'Commodore Red',
        category: 'consumable',
        quantity: 1,
        duration: 20,
        modifiers: {
            electrochemistry: 2,
            inland_empire: 1,
            logic: -1,
            hand_eye_coordination: -1
        },
        onUse: 'revacholian_courage',
        onExpire: 'volumetric_shit_compressor'
    },

    speed: {
        id: 'speed',
        name: 'Amphetamine',
        category: 'consumable',
        quantity: 1,
        duration: 25,
        modifiers: {
            reaction_speed: 2,
            perception: 1,
            volition: -1,
            empathy: -1
        },
        onUse: 'pyrholidon',
        onExpire: 'pyrholidon_withdrawal'
    }
};

// ═══════════════════════════════════════════════════════════════
// ITEM CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const CATEGORIES = {
    clothes: {
        name: 'Clothes',
        icon: '👔',
        slots: ['hat', 'glasses', 'neck', 'jacket', 'shirt', 'gloves', 'pants', 'shoes']
    },
    tools: {
        name: 'Tools',
        icon: '🔧'
    },
    held: {
        name: 'Held',
        icon: '✋'
    },
    consumable: {
        name: 'Consumables',
        icon: '💊'
    }
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the skill with highest modifier for an item (the "owner" voice)
 */
export function getItemOwnerSkill(item) {
    if (!item.modifiers) return null;
    
    let maxSkill = null;
    let maxValue = -Infinity;
    
    for (const [skillId, value] of Object.entries(item.modifiers)) {
        if (value > maxValue) {
            maxValue = value;
            maxSkill = skillId;
        }
    }
    
    return maxSkill;
}

/**
 * Get skills that react to an item (non-owner skills with modifiers)
 */
export function getItemReactingSkills(item) {
    if (!item.modifiers) return [];
    
    const owner = getItemOwnerSkill(item);
    return Object.entries(item.modifiers)
        .filter(([skillId]) => skillId !== owner)
        .map(([skillId, value]) => ({ skillId, value }));
}

/**
 * Create a custom item from user input
 */
export function createCustomItem(name, category, modifiers = {}) {
    const id = `custom_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    return {
        id,
        name,
        category,
        modifiers,
        isCustom: true
    };
}

/**
 * Format modifier display (+1, -2, etc.)
 */
export function formatModifier(value) {
    return value > 0 ? `+${value}` : `${value}`;
}
