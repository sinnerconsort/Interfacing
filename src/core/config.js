/**
 * Interfacing - Configuration & Constants
 * No dependencies - this is the foundation
 */

export const EXTENSION_NAME = 'Interfacing';
export const EXTENSION_VERSION = '3.0.0';
export const EXTENSION_FOLDER = `scripts/extensions/third-party/${EXTENSION_NAME}`;

// ═══════════════════════════════════════════════════════════════
// DEFAULT SETTINGS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_SETTINGS = {
    // Extension state
    enabled: true,
    
    // UI preferences
    panelPosition: 'right',      // 'left' | 'right'
    fabPosition: null,           // { top: number, left: number } | null
    defaultTab: 'status',        // 'status' | 'inventory' | 'ledger'
    
    // Vitals configuration
    baseHealth: 3,               // Added to Endurance for max HP
    baseMorale: 3,               // Added to Volition for max Morale
    
    // Auto-detection
    autoDetectEnabled: false,    // Off by default - user opts in
    autoDetectInventory: true,
    autoDetectStatus: true,
    autoDetectEvents: true,
    
    // Ledger configuration
    officerInitials: 'HDB',      // For case file numbering
    nextCaseNumber: 1,           // Auto-incrementing
    
    // Generation
    generateItemDescriptions: true,
    generateMemorySummaries: true
};

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT SLOTS
// ═══════════════════════════════════════════════════════════════

export const EQUIPMENT_SLOTS = {
    head:   { name: 'Head',   icon: '🎩', maxItems: 1 },
    face:   { name: 'Face',   icon: '👓', maxItems: 1 },
    neck:   { name: 'Neck',   icon: '👔', maxItems: 1 },
    jacket: { name: 'Jacket', icon: '🧥', maxItems: 1 },
    shirt:  { name: 'Shirt',  icon: '👕', maxItems: 1 },
    pants:  { name: 'Pants',  icon: '👖', maxItems: 1 },
    shoes:  { name: 'Shoes',  icon: '👞', maxItems: 1 },
    gloves: { name: 'Gloves', icon: '🧤', maxItems: 1 },
    hands:  { name: 'Hands',  icon: '✋', maxItems: 2 }  // Can hold 2 items
};

// ═══════════════════════════════════════════════════════════════
// ITEM CATEGORIES
// ═══════════════════════════════════════════════════════════════

export const ITEM_CATEGORIES = {
    weapon:     { name: 'Weapon',        icon: '🔫' },
    tool:       { name: 'Tool',          icon: '🔧' },
    document:   { name: 'Document',      icon: '📄' },
    evidence:   { name: 'Evidence',      icon: '🔍' },
    consumable: { name: 'Consumable',    icon: '💊' },
    clothing:   { name: 'Clothing',      icon: '👔' },
    key:        { name: 'Key Item',      icon: '🔑' },
    misc:       { name: 'Miscellaneous', icon: '📦' }
};

// ═══════════════════════════════════════════════════════════════
// DISCO ELYSIUM SKILLS
// ═══════════════════════════════════════════════════════════════

export const ATTRIBUTES = {
    INTELLECT: { name: 'Intellect', color: '#5b8dd9' },
    PSYCHE:    { name: 'Psyche',    color: '#d65b5b' },
    PHYSIQUE:  { name: 'Physique',  color: '#8b5d33' },
    MOTORICS:  { name: 'Motorics',  color: '#d9a55b' }
};

export const SKILLS = {
    // INTELLECT
    logic:              { name: 'Logic',              attribute: 'INTELLECT' },
    encyclopedia:       { name: 'Encyclopedia',       attribute: 'INTELLECT' },
    rhetoric:           { name: 'Rhetoric',           attribute: 'INTELLECT' },
    drama:              { name: 'Drama',              attribute: 'INTELLECT' },
    conceptualization:  { name: 'Conceptualization',  attribute: 'INTELLECT' },
    visual_calculus:    { name: 'Visual Calculus',    attribute: 'INTELLECT' },
    
    // PSYCHE
    volition:           { name: 'Volition',           attribute: 'PSYCHE' },
    inland_empire:      { name: 'Inland Empire',      attribute: 'PSYCHE' },
    empathy:            { name: 'Empathy',            attribute: 'PSYCHE' },
    authority:          { name: 'Authority',          attribute: 'PSYCHE' },
    esprit_de_corps:    { name: 'Esprit de Corps',    attribute: 'PSYCHE' },
    suggestion:         { name: 'Suggestion',         attribute: 'PSYCHE' },
    
    // PHYSIQUE
    endurance:          { name: 'Endurance',          attribute: 'PHYSIQUE' },
    pain_threshold:     { name: 'Pain Threshold',     attribute: 'PHYSIQUE' },
    physical_instrument:{ name: 'Physical Instrument',attribute: 'PHYSIQUE' },
    electrochemistry:   { name: 'Electrochemistry',   attribute: 'PHYSIQUE' },
    shivers:            { name: 'Shivers',            attribute: 'PHYSIQUE' },
    half_light:         { name: 'Half Light',         attribute: 'PHYSIQUE' },
    
    // MOTORICS
    hand_eye_coordination: { name: 'Hand/Eye Coord.',  attribute: 'MOTORICS' },
    perception:            { name: 'Perception',       attribute: 'MOTORICS' },
    reaction_speed:        { name: 'Reaction Speed',   attribute: 'MOTORICS' },
    savoir_faire:          { name: 'Savoir Faire',     attribute: 'MOTORICS' },
    interfacing:           { name: 'Interfacing',      attribute: 'MOTORICS' },
    composure:             { name: 'Composure',        attribute: 'MOTORICS' }
};

// Flat array of skill IDs for iteration
export const SKILL_IDS = Object.keys(SKILLS);

// ═══════════════════════════════════════════════════════════════
// TASK PRIORITIES
// ═══════════════════════════════════════════════════════════════

export const TASK_PRIORITIES = {
    main:     { name: 'Main',     icon: '★', color: '#bfa127' },
    side:     { name: 'Side',     icon: '○', color: '#888888' },
    optional: { name: 'Optional', icon: '·', color: '#555555' }
};

// ═══════════════════════════════════════════════════════════════
// RELATIONSHIP TYPES (for contacts)
// ═══════════════════════════════════════════════════════════════

export const RELATIONSHIPS = {
    friendly: { name: 'Friendly', color: '#4a9966' },
    neutral:  { name: 'Neutral',  color: '#888888' },
    hostile:  { name: 'Hostile',  color: '#a54444' },
    unknown:  { name: 'Unknown',  color: '#555555' }
};

// ═══════════════════════════════════════════════════════════════
// UI CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const UI = {
    FAB_SIZE: 48,
    PANEL_WIDTH: 340,
    PANEL_WIDTH_MOBILE: '100%',
    DEBOUNCE_SAVE_MS: 500,
    ANIMATION_DURATION_MS: 300
};

// ═══════════════════════════════════════════════════════════════
// HELPER: Format skill name from ID
// ═══════════════════════════════════════════════════════════════

export function formatSkillName(skillId) {
    const skill = SKILLS[skillId];
    if (skill) return skill.name;
    
    // Fallback: convert snake_case to Title Case
    return skillId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// HELPER: Get attribute for skill
// ═══════════════════════════════════════════════════════════════

export function getSkillAttribute(skillId) {
    return SKILLS[skillId]?.attribute || null;
}
