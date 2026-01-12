/**
 * Interfacing - Suggestion System State
 * Manages state for the Suggestion panel (skill-voiced action prompts)
 * 
 * Dependencies: ../core/state.js
 */

import { getSetting, setSetting } from '../core/state.js';

// ═══════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_SUGGESTION_SETTINGS = {
    enabled: true,
    mode: 'manual',           // 'auto' | 'manual'
    suggestionCount: 4,       // 3-5 suggestions per generation
    chaosLevel: 0.5,          // 0 (practical) to 1 (unhinged)
    contextMessages: 5,       // How many messages to include for context
    copyToClipboard: true,    // Auto-copy result text
    autoCloseOnSelect: false, // Close panel after selecting
    showResultInPanel: true,  // Show roll result in panel vs toast
    panelPosition: null       // { top, left } or null for default
};

// ═══════════════════════════════════════════════════════════════
// DIFFICULTY TIERS
// ═══════════════════════════════════════════════════════════════

export const DIFFICULTY = {
    TRIVIAL:    { name: 'Trivial',    dc: 6,  color: '#4a9966' },
    EASY:       { name: 'Easy',       dc: 8,  color: '#5b8dd9' },
    MEDIUM:     { name: 'Medium',     dc: 10, color: '#bfa127' },
    CHALLENGING:{ name: 'Challenging',dc: 12, color: '#d9a55b' },
    FORMIDABLE: { name: 'Formidable', dc: 14, color: '#d65b5b' },
    LEGENDARY:  { name: 'Legendary',  dc: 16, color: '#8b5d33' },
    IMPOSSIBLE: { name: 'Impossible', dc: 18, color: '#a54444' }
};

/**
 * Get difficulty tier from DC value
 */
export function getDifficultyTier(dc) {
    if (dc <= 6) return DIFFICULTY.TRIVIAL;
    if (dc <= 8) return DIFFICULTY.EASY;
    if (dc <= 10) return DIFFICULTY.MEDIUM;
    if (dc <= 12) return DIFFICULTY.CHALLENGING;
    if (dc <= 14) return DIFFICULTY.FORMIDABLE;
    if (dc <= 16) return DIFFICULTY.LEGENDARY;
    return DIFFICULTY.IMPOSSIBLE;
}

// ═══════════════════════════════════════════════════════════════
// PANEL STATE (runtime, not persisted)
// ═══════════════════════════════════════════════════════════════

let _panelState = {
    isOpen: false,
    isGenerating: false,
    suggestions: [],
    lastContextHash: null,
    pendingRoll: null,
    lastResult: null,
    error: null
};

/**
 * Get current panel state
 */
export function getPanelState() {
    return { ..._panelState };
}

/**
 * Update panel state
 */
export function updatePanelState(partial) {
    _panelState = { ..._panelState, ...partial };
    dispatchStateChange('panel');
}

// ═══════════════════════════════════════════════════════════════
// PANEL OPEN/CLOSE
// ═══════════════════════════════════════════════════════════════

export function isPanelOpen() {
    return _panelState.isOpen;
}

export function openPanel() {
    _panelState.isOpen = true;
    dispatchStateChange('panel-open');
}

export function closePanel() {
    _panelState.isOpen = false;
    _panelState.pendingRoll = null;
    dispatchStateChange('panel-close');
}

export function togglePanel() {
    if (_panelState.isOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

// ═══════════════════════════════════════════════════════════════
// SUGGESTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Suggestion
 * @property {string} id - Unique identifier
 * @property {string} skill - Skill ID (authority, empathy, etc.)
 * @property {number} dc - Difficulty class
 * @property {string} difficulty - Human readable (Easy, Medium, etc.)
 * @property {string} shortText - Brief action description
 * @property {string} voiceText - The skill's pitch in its personality
 * @property {string[]} [tags] - Optional tags (aggressive, deceptive, kind, unhinged)
 */

/**
 * Get current suggestions
 * @returns {Suggestion[]}
 */
export function getSuggestions() {
    return [..._panelState.suggestions];
}

/**
 * Set new suggestions (replaces existing)
 * @param {Suggestion[]} suggestions
 */
export function setSuggestions(suggestions) {
    _panelState.suggestions = suggestions.map((s, i) => ({
        ...s,
        id: s.id || `sug_${Date.now()}_${i}`
    }));
    _panelState.error = null;
    dispatchStateChange('suggestions');
}

/**
 * Clear all suggestions
 */
export function clearSuggestions() {
    _panelState.suggestions = [];
    _panelState.lastContextHash = null;
    dispatchStateChange('suggestions');
}

/**
 * Get a suggestion by ID
 */
export function getSuggestion(id) {
    return _panelState.suggestions.find(s => s.id === id) || null;
}

// ═══════════════════════════════════════════════════════════════
// GENERATION STATE
// ═══════════════════════════════════════════════════════════════

export function isGenerating() {
    return _panelState.isGenerating;
}

export function setGenerating(generating) {
    _panelState.isGenerating = generating;
    if (generating) {
        _panelState.error = null;
    }
    dispatchStateChange('generating');
}

export function setContextHash(hash) {
    _panelState.lastContextHash = hash;
}

export function getContextHash() {
    return _panelState.lastContextHash;
}

export function setError(error) {
    _panelState.error = error;
    _panelState.isGenerating = false;
    dispatchStateChange('error');
}

export function getError() {
    return _panelState.error;
}

// ═══════════════════════════════════════════════════════════════
// ROLL STATE
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} RollResult
 * @property {boolean} success - Did the check pass
 * @property {number} roll - The dice roll (2d6)
 * @property {number} total - Roll + modifiers
 * @property {boolean} critical - Was it a critical (snake eyes or boxcars)
 * @property {boolean} isSnakeEyes - Rolled 2 (auto-fail)
 * @property {boolean} isBoxcars - Rolled 12 (auto-success)
 * @property {string} resultText - Generated description of the attempt
 */

/**
 * Set pending roll (user selected a suggestion, waiting for roll)
 * @param {Suggestion} suggestion
 */
export function setPendingRoll(suggestion) {
    _panelState.pendingRoll = {
        suggestion,
        startedAt: Date.now()
    };
    _panelState.lastResult = null;
    dispatchStateChange('pending-roll');
}

/**
 * Get pending roll
 */
export function getPendingRoll() {
    return _panelState.pendingRoll;
}

/**
 * Clear pending roll
 */
export function clearPendingRoll() {
    _panelState.pendingRoll = null;
    dispatchStateChange('pending-roll');
}

/**
 * Set the result of a roll
 * @param {RollResult} result
 */
export function setRollResult(result) {
    _panelState.lastResult = {
        suggestion: _panelState.pendingRoll?.suggestion || null,
        result,
        completedAt: Date.now()
    };
    _panelState.pendingRoll = null;
    dispatchStateChange('roll-result');
}

/**
 * Get last roll result
 */
export function getLastResult() {
    return _panelState.lastResult;
}

/**
 * Clear last result
 */
export function clearLastResult() {
    _panelState.lastResult = null;
    dispatchStateChange('roll-result');
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS (persisted via main state)
// ═══════════════════════════════════════════════════════════════

/**
 * Get suggestion settings
 */
export function getSettings() {
    const saved = getSetting('suggestion') || {};
    return { ...DEFAULT_SUGGESTION_SETTINGS, ...saved };
}

/**
 * Update suggestion settings
 */
export function updateSettings(partial) {
    const current = getSettings();
    setSetting('suggestion', { ...current, ...partial });
}

/**
 * Get a single setting
 */
export function getSettingValue(key) {
    return getSettings()[key];
}

/**
 * Set a single setting
 */
export function setSettingValue(key, value) {
    updateSettings({ [key]: value });
}

// ═══════════════════════════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════════════════════════

export function getMode() {
    return getSettings().mode;
}

export function setMode(mode) {
    if (mode !== 'auto' && mode !== 'manual') {
        console.warn('[Suggestion] Invalid mode:', mode);
        return;
    }
    updateSettings({ mode });
}

export function isAutoMode() {
    return getSettings().mode === 'auto';
}

// ═══════════════════════════════════════════════════════════════
// RESET
// ═══════════════════════════════════════════════════════════════

export function resetPanelState() {
    _panelState = {
        isOpen: false,
        isGenerating: false,
        suggestions: [],
        lastContextHash: null,
        pendingRoll: null,
        lastResult: null,
        error: null
    };
    dispatchStateChange('reset');
}

// ═══════════════════════════════════════════════════════════════
// EVENT SYSTEM
// ═══════════════════════════════════════════════════════════════

function dispatchStateChange(source) {
    document.dispatchEvent(new CustomEvent('suggestion:state-changed', {
        detail: { source, state: getPanelState() }
    }));
}

/**
 * Subscribe to suggestion state changes
 * @param {Function} callback - Called with (source, state)
 * @returns {Function} Unsubscribe function
 */
export function onSuggestionStateChange(callback) {
    const handler = (e) => callback(e.detail.source, e.detail.state);
    document.addEventListener('suggestion:state-changed', handler);
    return () => document.removeEventListener('suggestion:state-changed', handler);
}
