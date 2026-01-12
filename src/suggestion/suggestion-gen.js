/**
 * Interfacing - Suggestion Generation
 * Builds prompts, calls IE's API, parses responses
 * 
 * "I know exactly what you should say..."
 * 
 * Dependencies: ie-bridge.js, suggestion-state.js, status.js
 */

import * as ie from '../core/ie-bridge.js';
import * as suggestionState from './suggestion-state.js';
import * as status from '../systems/status.js';
import { SKILLS, ATTRIBUTES, formatSkillName } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// CONTEXT GATHERING
// ═══════════════════════════════════════════════════════════════

/**
 * Get recent messages from SillyTavern chat
 * @param {number} count - Number of messages to retrieve
 * @returns {Array} Array of message objects
 */
export function getRecentMessages(count = 5) {
    // Try to get ST context
    const context = getSTContext();
    if (!context?.chat) return [];
    
    const messages = context.chat.slice(-count);
    
    return messages.map(msg => ({
        role: msg.is_user ? 'user' : 'character',
        name: msg.is_user ? 'You' : (msg.name || 'Character'),
        content: msg.mes || ''
    }));
}

/**
 * Get SillyTavern context
 */
function getSTContext() {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
        return SillyTavern.getContext();
    }
    if (typeof getContext === 'function') {
        return getContext();
    }
    return null;
}

/**
 * Format messages for prompt
 */
function formatMessagesForPrompt(messages) {
    return messages.map(m => `${m.name}: ${m.content}`).join('\n\n');
}

/**
 * Generate a hash of the context for change detection
 */
export function hashContext(messages) {
    const text = messages.map(m => m.content).join('|');
    // Simple hash - good enough for change detection
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// ═══════════════════════════════════════════════════════════════
// SKILL SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Get relevant skills based on context and player stats
 * Returns skills sorted by relevance (higher level = more likely to chime in)
 */
export function getRelevantSkills(count = 6) {
    const skills = [];
    
    for (const [skillId, skillInfo] of Object.entries(SKILLS)) {
        const level = ie.getEffectiveSkillLevel(skillId) || 1;
        const attribute = ATTRIBUTES[skillInfo.attribute];
        
        skills.push({
            id: skillId,
            name: skillInfo.name,
            level,
            attribute: skillInfo.attribute,
            color: attribute?.color || '#888888'
        });
    }
    
    // Sort by level (higher skills speak up more)
    // Add some randomness so it's not always the same skills
    skills.sort((a, b) => {
        const aScore = a.level + Math.random() * 2;
        const bScore = b.level + Math.random() * 2;
        return bScore - aScore;
    });
    
    return skills.slice(0, count);
}

/**
 * Get skill voice/personality info from IE (or fallback)
 */
export function getSkillVoice(skillId) {
    // Try to get from IE first
    if (ie.getIE()?.getSkillVoice) {
        const voice = ie.getIE().getSkillVoice(skillId);
        if (voice) return voice;
    }
    
    // Fallback personality descriptions
    return SKILL_VOICES[skillId] || {
        personality: 'A voice in your head',
        speakingStyle: 'Direct and clear',
        concerns: ['helping you'],
        quirks: []
    };
}

// ═══════════════════════════════════════════════════════════════
// SKILL VOICE FALLBACKS
// ═══════════════════════════════════════════════════════════════

const SKILL_VOICES = {
    // INTELLECT
    logic: {
        personality: 'Cold, analytical, seeks patterns and contradictions',
        speakingStyle: 'Precise, methodical, uses "therefore" and "thus"',
        concerns: ['inconsistencies', 'logical fallacies', 'evidence'],
        quirks: ['dismisses emotion', 'loves puzzles']
    },
    encyclopedia: {
        personality: 'Eager to share knowledge, sometimes irrelevantly',
        speakingStyle: 'Academic, peppered with facts and trivia',
        concerns: ['historical context', 'definitions', 'connections'],
        quirks: ['tangential knowledge dumps', 'excited by obscure facts']
    },
    rhetoric: {
        personality: 'Persuasive, sees every conversation as a debate',
        speakingStyle: 'Eloquent, structured arguments, rhetorical questions',
        concerns: ['winning arguments', 'logical structure', 'persuasion'],
        quirks: ['identifies fallacies', 'suggests counterpoints']
    },
    drama: {
        personality: 'Theatrical, detects lies, loves performance',
        speakingStyle: 'Dramatic, uses italics and emphasis liberally',
        concerns: ['deception', 'performance', 'hidden truths'],
        quirks: ['everything is a stage', 'encourages lying artfully']
    },
    conceptualization: {
        personality: 'Artistic, abstract, sees beauty and meaning everywhere',
        speakingStyle: 'Poetic, metaphorical, wistful',
        concerns: ['art', 'meaning', 'creative expression'],
        quirks: ['distracted by aesthetics', 'prone to tangents about art']
    },
    visual_calculus: {
        personality: 'Spatial, reconstructive, sees trajectories and physics',
        speakingStyle: 'Clinical, descriptive, visualizes scenarios',
        concerns: ['physical evidence', 'trajectories', 'reconstruction'],
        quirks: ['mental simulations', 'obsessed with angles']
    },
    
    // PSYCHE
    volition: {
        personality: 'Your willpower, morale center, keeps you going',
        speakingStyle: 'Encouraging but honest, sometimes stern',
        concerns: ['your mental health', 'staying strong', 'self-worth'],
        quirks: ['protective', 'reality checks']
    },
    inland_empire: {
        personality: 'Mystical, hunches, feelings that defy logic',
        speakingStyle: 'Dreamy, cryptic, speaks of feelings and premonitions',
        concerns: ['hunches', 'the unexplainable', 'hidden meanings'],
        quirks: ['talks to objects', 'senses impossible things']
    },
    empathy: {
        personality: 'Feels what others feel, sometimes too much',
        speakingStyle: 'Gentle, concerned, uses "they feel" language',
        concerns: ['others emotions', 'trauma', 'connection'],
        quirks: ['overwhelmed by suffering', 'reads microexpressions']
    },
    authority: {
        personality: 'Dominance, command, respect through power',
        speakingStyle: 'Commanding, uses imperatives, ALL CAPS when intense',
        concerns: ['respect', 'hierarchy', 'being in charge'],
        quirks: ['easily offended', 'loves intimidation']
    },
    esprit_de_corps: {
        personality: 'Police intuition, bond with fellow officers',
        speakingStyle: 'Cop speak, references "the force", nostalgic',
        concerns: ['fellow officers', 'police culture', 'the job'],
        quirks: ['flashes of other cops lives', 'institutional loyalty']
    },
    suggestion: {
        personality: 'Influence, manipulation, getting what you want',
        speakingStyle: 'Smooth, conspiratorial, "let me tell you..."',
        concerns: ['influence', 'desires', 'social leverage'],
        quirks: ['reads vulnerabilities', 'suggests manipulation']
    },
    
    // PHYSIQUE
    endurance: {
        personality: 'Your body, pain tolerance, physical resilience',
        speakingStyle: 'Grunting, physical sensations, body awareness',
        concerns: ['physical limits', 'health', 'stamina'],
        quirks: ['reports every ache', 'knows your limits']
    },
    pain_threshold: {
        personality: 'Relationship with pain, mental fortitude against physical',
        speakingStyle: 'Stoic, dismissive of pain, "you can take it"',
        concerns: ['enduring pain', 'physical courage'],
        quirks: ['minimizes injuries', 'dares you to push through']
    },
    physical_instrument: {
        personality: 'Raw strength, physicality, the joy of force',
        speakingStyle: 'Simple, direct, loves ACTION verbs',
        concerns: ['strength', 'physical solutions', 'intimidation'],
        quirks: ['wants to hit things', 'admires muscles']
    },
    electrochemistry: {
        personality: 'Drugs, pleasure, immediate gratification',
        speakingStyle: 'Enthusiastic, tempting, "just one more..."',
        concerns: ['substances', 'pleasure', 'dopamine'],
        quirks: ['notices drugs everywhere', 'rationalizes addiction']
    },
    shivers: {
        personality: 'Connection to the city, weather, atmosphere',
        speakingStyle: 'Poetic, environmental, speaks through sensations',
        concerns: ['the city', 'atmosphere', 'weather'],
        quirks: ['the city speaks through it', 'knows things it shouldnt']
    },
    half_light: {
        personality: 'Fight or flight, paranoia, survival instinct',
        speakingStyle: 'Tense, urgent, warning of DANGER',
        concerns: ['threats', 'survival', 'violence'],
        quirks: ['sees threats everywhere', 'advocates preemptive action']
    },
    
    // MOTORICS
    hand_eye_coordination: {
        personality: 'Precision, aim, fine motor control',
        speakingStyle: 'Technical, focused on execution',
        concerns: ['accuracy', 'timing', 'precision tasks'],
        quirks: ['notices hand tremors', 'loves precise movements']
    },
    perception: {
        personality: 'Senses, noticing details others miss',
        speakingStyle: 'Observational, "did you notice...", detail-oriented',
        concerns: ['details', 'evidence', 'hidden things'],
        quirks: ['sensory overload sometimes', 'misses nothing']
    },
    reaction_speed: {
        personality: 'Quick reflexes, snap decisions',
        speakingStyle: 'Quick, urgent, split-second timing',
        concerns: ['speed', 'reflexes', 'quick decisions'],
        quirks: ['impatient', 'acts before thinking']
    },
    savoir_faire: {
        personality: 'Cool, style, acrobatics, looking good',
        speakingStyle: 'Smooth, confident, style-conscious',
        concerns: ['coolness', 'style', 'physical grace'],
        quirks: ['obsessed with looking cool', 'suggests acrobatic solutions']
    },
    interfacing: {
        personality: 'Connection with machines, technology, mechanisms',
        speakingStyle: 'Technical, tactile, "feel the mechanism"',
        concerns: ['machines', 'locks', 'technology'],
        quirks: ['talks to machines', 'understands mechanisms intuitively']
    },
    composure: {
        personality: 'Poker face, body language, staying cool',
        speakingStyle: 'Calm, controlled, reads body language',
        concerns: ['maintaining composure', 'reading others'],
        quirks: ['notices every twitch', 'master of the poker face']
    }
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDING
// ═══════════════════════════════════════════════════════════════

/**
 * Build the suggestion generation prompt
 */
export function buildGenerationPrompt(options = {}) {
    const settings = suggestionState.getSettings();
    const messageCount = options.contextMessages || settings.contextMessages;
    const suggestionCount = options.suggestionCount || settings.suggestionCount;
    const chaosLevel = options.chaosLevel ?? settings.chaosLevel;
    
    // Gather context
    const messages = getRecentMessages(messageCount);
    const formattedMessages = formatMessagesForPrompt(messages);
    
    // Get player status
    const health = status.getHealth();
    const morale = status.getMorale();
    const conditions = status.getConditions();
    
    // Get relevant skills
    const skills = getRelevantSkills(6);
    const skillsWithVoices = skills.map(s => ({
        ...s,
        voice: getSkillVoice(s.id)
    }));
    
    // Build skill descriptions for prompt
    const skillDescriptions = skillsWithVoices.map(s => 
        `- ${s.name} (Level ${s.level}): ${s.voice.personality}. Style: ${s.voice.speakingStyle}`
    ).join('\n');
    
    // Determine tone guidance based on chaos level
    let toneGuidance = '';
    if (chaosLevel < 0.3) {
        toneGuidance = 'Focus on practical, sensible options. Keep suggestions grounded and useful.';
    } else if (chaosLevel < 0.7) {
        toneGuidance = 'Mix practical options with some unexpected or creative suggestions. Balance helpful and chaotic.';
    } else {
        toneGuidance = 'Embrace chaos. Include unhinged, terrible ideas, self-destructive impulses, and suggestions that would make a sane person pause. At least one option should be gloriously ill-advised.';
    }
    
    const prompt = `You are generating skill-voiced suggestions for a Disco Elysium-style RPG. Each suggestion comes from a different skill - a voice in the detective's head with its own personality.

CURRENT SCENE:
${formattedMessages}

DETECTIVE STATUS:
- Health: ${health.current}/${health.effectiveMax}${health.isCritical ? ' [CRITICAL]' : ''}
- Morale: ${morale.current}/${morale.effectiveMax}${morale.isCritical ? ' [CRITICAL]' : ''}
- Conditions: ${conditions.length > 0 ? conditions.map(c => c.name).join(', ') : 'None'}

AVAILABLE SKILLS (use these voices):
${skillDescriptions}

TONE GUIDANCE:
${toneGuidance}

Generate exactly ${suggestionCount} suggestions. Each should:
1. Come from a DIFFERENT skill listed above
2. Be voiced in that skill's distinct personality
3. Suggest a specific action the player could take
4. Include an appropriate difficulty (Trivial 6 / Easy 8 / Medium 10 / Challenging 12 / Formidable 14 / Legendary 16)
5. The voiceText should be 1-3 sentences in the skill's voice, pitching the action

DIFFICULTY GUIDE:
- Trivial (6): Almost automatic
- Easy (8): Slight challenge  
- Medium (10): Standard difficulty
- Challenging (12): Requires effort
- Formidable (14): Serious challenge
- Legendary (16): Exceptional feat

Return ONLY a JSON array, no other text:
[
  {
    "skill": "authority",
    "dc": 12,
    "difficulty": "Challenging",
    "shortText": "Assert dominance",
    "voiceText": "You're a COP. Make her FEEL it. Show her what the 41st precinct means.",
    "tags": ["aggressive", "intimidating"]
  }
]`;

    return {
        prompt,
        contextHash: hashContext(messages),
        skills: skillsWithVoices
    };
}

/**
 * Build prompt for intent-based generation
 * (When user types "I want to..." )
 */
export function buildIntentPrompt(intent, options = {}) {
    const settings = suggestionState.getSettings();
    const suggestionCount = options.suggestionCount || settings.suggestionCount;
    
    const messages = getRecentMessages(settings.contextMessages);
    const formattedMessages = formatMessagesForPrompt(messages);
    
    const skills = getRelevantSkills(8);
    const skillDescriptions = skills.map(s => {
        const voice = getSkillVoice(s.id);
        return `- ${s.name} (Level ${s.level}): ${voice.personality}`;
    }).join('\n');
    
    const prompt = `You are generating skill-voiced suggestions for a Disco Elysium-style RPG.

PLAYER INTENT: "${intent}"

CURRENT SCENE:
${formattedMessages}

AVAILABLE SKILLS:
${skillDescriptions}

Generate ${suggestionCount} different ways to accomplish this intent, each from a different skill's perspective. Each skill should suggest its own unique approach.

Return ONLY a JSON array:
[
  {
    "skill": "skill_id",
    "dc": 10,
    "difficulty": "Medium",
    "shortText": "Brief action",
    "voiceText": "The skill's pitch for this approach in its voice.",
    "tags": ["optional", "tags"]
  }
]`;

    return {
        prompt,
        contextHash: hashContext(messages) + '_' + intent,
        intent
    };
}

// ═══════════════════════════════════════════════════════════════
// GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate suggestions
 * @param {Object} options - Generation options
 * @param {string} options.intent - Optional user intent ("I want to...")
 */
export async function generateSuggestions(options = {}) {
    // Check if IE is ready
    if (!ie.isReady()) {
        suggestionState.setError('Inland Empire not connected');
        return { success: false, error: 'IE not connected' };
    }
    
    // Check if API is configured
    if (!ie.isAPIConfigured()) {
        suggestionState.setError('API not configured in Inland Empire');
        return { success: false, error: 'API not configured' };
    }
    
    suggestionState.setGenerating(true);
    suggestionState.clearError();
    
    try {
        // Build prompt
        const { prompt, contextHash } = options.intent 
            ? buildIntentPrompt(options.intent, options)
            : buildGenerationPrompt(options);
        
        // Check if we even need to regenerate
        if (!options.force && !suggestionState.needsRegeneration(contextHash)) {
            suggestionState.setGenerating(false);
            return { success: true, cached: true, suggestions: suggestionState.getSuggestions() };
        }
        
        // Call IE's generate
        const response = await ie.generate(prompt, {
            maxTokens: 1000,
            temperature: 0.8 // Some creativity
        });
        
        if (!response) {
            throw new Error('Empty response from API');
        }
        
        // Parse response
        const suggestions = parseGenerationResponse(response);
        
        if (suggestions.length === 0) {
            throw new Error('No valid suggestions in response');
        }
        
        // Store suggestions
        suggestionState.setSuggestions(suggestions, contextHash);
        suggestionState.setGenerating(false);
        
        return { success: true, suggestions };
        
    } catch (error) {
        console.error('[Suggestion] Generation failed:', error);
        suggestionState.setError(error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Parse the generation response into Suggestion objects
 */
function parseGenerationResponse(response) {
    try {
        // Try to extract JSON from response
        let jsonStr = response;
        
        // Handle markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }
        
        // Try to find array in response
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            jsonStr = arrayMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr);
        
        if (!Array.isArray(parsed)) {
            console.warn('[Suggestion] Response is not an array');
            return [];
        }
        
        // Validate and transform each suggestion
        return parsed.map((item, index) => ({
            id: `sug_${Date.now()}_${index}`,
            skill: item.skill || 'unknown',
            skillName: formatSkillName(item.skill) || item.skill,
            dc: parseInt(item.dc) || 10,
            difficulty: item.difficulty || 'Medium',
            shortText: item.shortText || 'Take action',
            voiceText: item.voiceText || item.shortText || '',
            tags: Array.isArray(item.tags) ? item.tags : []
        })).filter(s => s.skill && s.voiceText);
        
    } catch (error) {
        console.error('[Suggestion] Failed to parse response:', error, response);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// ROLL & RESULT
// ═══════════════════════════════════════════════════════════════

/**
 * Execute a suggestion (roll and generate result)
 * @param {string} suggestionId - ID of suggestion to execute
 */
export async function executeSuggestion(suggestionId) {
    const suggestions = suggestionState.getSuggestions();
    const suggestion = suggestions.find(s => s.id === suggestionId);
    
    if (!suggestion) {
        return { success: false, error: 'Suggestion not found' };
    }
    
    // Roll via IE
    const rollResult = ie.rollCheck(suggestion.skill, suggestion.dc);
    
    if (!rollResult) {
        return { success: false, error: 'Roll failed' };
    }
    
    // Generate result text
    const resultText = await generateResultText(suggestion, rollResult);
    
    const fullResult = {
        suggestionId,
        suggestion,
        success: rollResult.success,
        roll: rollResult.roll,
        total: rollResult.total,
        dc: suggestion.dc,
        isCriticalSuccess: rollResult.isBoxcars || rollResult.roll === 12,
        isCriticalFailure: rollResult.isSnakeEyes || rollResult.roll === 2,
        resultText
    };
    
    suggestionState.setPendingRoll(fullResult);
    
    // Copy to clipboard if enabled
    const settings = suggestionState.getSettings();
    if (settings.copyToClipboard && resultText) {
        try {
            await navigator.clipboard.writeText(resultText);
        } catch (e) {
            console.warn('[Suggestion] Could not copy to clipboard:', e);
        }
    }
    
    return { success: true, result: fullResult };
}

/**
 * Generate the result text for a roll
 */
async function generateResultText(suggestion, rollResult) {
    const settings = suggestionState.getSettings();
    const messages = getRecentMessages(settings.contextMessages);
    const formattedMessages = formatMessagesForPrompt(messages);
    
    let resultType = rollResult.success ? 'SUCCESS' : 'FAILURE';
    if (rollResult.isBoxcars || rollResult.roll === 12) resultType = 'CRITICAL SUCCESS';
    if (rollResult.isSnakeEyes || rollResult.roll === 2) resultType = 'CRITICAL FAILURE';
    
    const prompt = `Generate the result of this action attempt in a Disco Elysium style.

ACTION: ${suggestion.shortText}
SKILL: ${suggestion.skillName}
ROLL: ${rollResult.roll} + modifiers = ${rollResult.total} vs DC ${suggestion.dc}
RESULT: ${resultType}

CONTEXT:
${formattedMessages}

THE SKILL'S SUGGESTION WAS:
"${suggestion.voiceText}"

Write 2-3 sentences describing how the detective attempts this action and what happens.
- On SUCCESS: The action works, describe the positive outcome
- On FAILURE: The attempt backfires or fails awkwardly
- On CRITICAL SUCCESS: Exceptional, impressive, beyond expectations
- On CRITICAL FAILURE: Spectacular disaster, embarrassing, possibly harmful

Write in second person ("You..."). Be vivid and specific. Match Disco Elysium's literary style.

Return ONLY the result text, no other commentary.`;

    try {
        const response = await ie.generate(prompt, {
            maxTokens: 200,
            temperature: 0.7
        });
        
        return response?.trim() || getFallbackResult(suggestion, rollResult);
    } catch (error) {
        console.error('[Suggestion] Result generation failed:', error);
        return getFallbackResult(suggestion, rollResult);
    }
}

/**
 * Fallback result if generation fails
 */
function getFallbackResult(suggestion, rollResult) {
    if (rollResult.success) {
        return `You attempt to ${suggestion.shortText.toLowerCase()}. It works.`;
    } else {
        return `You attempt to ${suggestion.shortText.toLowerCase()}. It doesn't go as planned.`;
    }
}
