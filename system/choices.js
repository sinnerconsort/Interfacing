/**
 * Interfacing - Choice Suggestions System
 * Parses scenes for possible actions and presents skill-check options
 * 
 * TODO: Implement after inventory/vitals are working
 */

// ═══════════════════════════════════════════════════════════════
// PLACEHOLDER - TO BE IMPLEMENTED
// ═══════════════════════════════════════════════════════════════

export function initChoices() {
    console.log('[Interfacing:Choices] System placeholder initialized');
}

/**
 * Parse a scene/message for possible actions
 * Will eventually call IE for skill data and roll checks
 */
export function parseSceneForChoices(text) {
    // TODO: Implement scene parsing
    // Look for dialogue options, investigation opportunities, etc.
    return [];
}

/**
 * Present a choice with a skill check
 * Example: [Rhetoric - Challenging 12] Convince them you're not a cop
 */
export function createChoice(skillId, difficulty, description) {
    return {
        skillId,
        difficulty,
        description,
        result: null
    };
}

/**
 * Execute a choice - roll the check and return result
 */
export function executeChoice(choice) {
    const IE = window.InlandEmpire;
    
    if (IE) {
        const result = IE.rollCheck(choice.skillId, choice.difficulty);
        choice.result = result;
        return result;
    }
    
    // Fallback without IE
    const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const result = {
        success: roll >= choice.difficulty,
        total: roll,
        isBoxcars: roll === 12,
        isSnakeEyes: roll === 2
    };
    choice.result = result;
    return result;
}
