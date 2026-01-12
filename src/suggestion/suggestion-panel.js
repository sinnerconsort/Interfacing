/**
 * Interfacing - Suggestion Panel UI
 * The floating panel that displays skill-voiced suggestions
 * 
 * "What would you have me say?"
 * 
 * Dependencies: suggestion-state.js, suggestion-gen.js, config.js
 */

import * as state from './suggestion-state.js';
import * as gen from './suggestion-gen.js';
import { SKILLS, ATTRIBUTES } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
// ═══════════════════════════════════════════════════════════════

let panelElement = null;
let toggleButton = null;
let isInitialized = false;

/**
 * Initialize the Suggestion panel
 */
export function init() {
    if (isInitialized) return;
    
    createToggleButton();
    createPanel();
    setupEventListeners();
    
    isInitialized = true;
    console.log('[Suggestion] Panel initialized');
}

/**
 * Create the toggle button (floating)
 */
function createToggleButton() {
    toggleButton = document.createElement('div');
    toggleButton.id = 'suggestion-toggle';
    toggleButton.className = 'suggestion-toggle';
    toggleButton.innerHTML = `
        <span class="suggestion-toggle-icon">💭</span>
        <span class="suggestion-toggle-badge" style="display: none;">0</span>
    `;
    toggleButton.title = 'Suggestions';
    
    toggleButton.addEventListener('click', () => {
        state.togglePanel();
    });
    
    document.body.appendChild(toggleButton);
}

/**
 * Create the main panel
 */
function createPanel() {
    panelElement = document.createElement('div');
    panelElement.id = 'suggestion-panel';
    panelElement.className = 'suggestion-panel';
    panelElement.style.display = 'none';
    
    panelElement.innerHTML = `
        <div class="suggestion-panel-header">
            <span class="suggestion-panel-title">SUGGESTION</span>
            <div class="suggestion-panel-controls">
                <label class="suggestion-mode-toggle">
                    <input type="radio" name="suggestion-mode" value="auto">
                    <span>Auto</span>
                </label>
                <label class="suggestion-mode-toggle">
                    <input type="radio" name="suggestion-mode" value="manual" checked>
                    <span>Manual</span>
                </label>
                <button class="suggestion-refresh-btn" title="Refresh suggestions">⟳</button>
                <button class="suggestion-close-btn" title="Close">✕</button>
            </div>
        </div>
        
        <div class="suggestion-panel-body">
            <div class="suggestion-list">
                <!-- Suggestions render here -->
            </div>
            
            <div class="suggestion-loading" style="display: none;">
                <div class="suggestion-loading-spinner"></div>
                <span>Consulting your skills...</span>
            </div>
            
            <div class="suggestion-error" style="display: none;">
                <span class="suggestion-error-text"></span>
                <button class="suggestion-retry-btn">Retry</button>
            </div>
            
            <div class="suggestion-result" style="display: none;">
                <div class="suggestion-result-header">
                    <span class="suggestion-result-skill"></span>
                    <span class="suggestion-result-roll"></span>
                </div>
                <div class="suggestion-result-text"></div>
                <div class="suggestion-result-actions">
                    <button class="suggestion-copy-btn">Copy</button>
                    <button class="suggestion-dismiss-btn">Dismiss</button>
                </div>
            </div>
        </div>
        
        <div class="suggestion-panel-footer">
            <div class="suggestion-intent-wrapper">
                <span class="suggestion-intent-label">I want to...</span>
                <input type="text" class="suggestion-intent-input" placeholder="intimidate him into talking">
            </div>
            <button class="suggestion-generate-btn">Generate</button>
        </div>
    `;
    
    document.body.appendChild(panelElement);
    
    // Attach panel event listeners
    attachPanelListeners();
}

/**
 * Attach event listeners to panel elements
 */
function attachPanelListeners() {
    // Close button
    panelElement.querySelector('.suggestion-close-btn').addEventListener('click', () => {
        state.closePanel();
    });
    
    // Refresh button
    panelElement.querySelector('.suggestion-refresh-btn').addEventListener('click', () => {
        gen.generateSuggestions({ force: true });
    });
    
    // Retry button
    panelElement.querySelector('.suggestion-retry-btn').addEventListener('click', () => {
        gen.generateSuggestions({ force: true });
    });
    
    // Mode toggle
    panelElement.querySelectorAll('input[name="suggestion-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.set('mode', e.target.value);
        });
    });
    
    // Intent input
    const intentInput = panelElement.querySelector('.suggestion-intent-input');
    intentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && intentInput.value.trim()) {
            gen.generateSuggestions({ intent: intentInput.value.trim(), force: true });
        }
    });
    
    // Generate button
    panelElement.querySelector('.suggestion-generate-btn').addEventListener('click', () => {
        const intent = intentInput.value.trim();
        if (intent) {
            gen.generateSuggestions({ intent, force: true });
        } else {
            gen.generateSuggestions({ force: true });
        }
    });
    
    // Copy button
    panelElement.querySelector('.suggestion-copy-btn').addEventListener('click', () => {
        const result = state.getPendingRoll();
        if (result?.resultText) {
            navigator.clipboard.writeText(result.resultText).then(() => {
                showToast('Copied to clipboard!');
            });
        }
    });
    
    // Dismiss button
    panelElement.querySelector('.suggestion-dismiss-btn').addEventListener('click', () => {
        state.clearPendingRoll();
        renderSuggestions();
    });
    
    // Make panel draggable
    makeDraggable(panelElement, panelElement.querySelector('.suggestion-panel-header'));
}

/**
 * Set up state event listeners
 */
function setupEventListeners() {
    // Panel open/close
    state.on('panel-opened', () => {
        showPanel();
        // Generate if empty
        if (state.getSuggestions().length === 0) {
            gen.generateSuggestions();
        }
    });
    
    state.on('panel-closed', () => {
        hidePanel();
    });
    
    // Suggestions updated
    state.on('suggestions-updated', ({ suggestions }) => {
        renderSuggestions(suggestions);
        updateBadge(suggestions.length);
    });
    
    state.on('suggestions-cleared', () => {
        renderSuggestions([]);
        updateBadge(0);
    });
    
    // Generation state
    state.on('generating-changed', ({ isGenerating }) => {
        if (isGenerating) {
            showLoading();
        } else {
            hideLoading();
        }
    });
    
    // Errors
    state.on('error', ({ error }) => {
        showError(error);
    });
    
    // Roll completed
    state.on('roll-completed', ({ result }) => {
        renderRollResult(result);
    });
    
    state.on('roll-cleared', () => {
        hideRollResult();
    });
    
    // Settings changed
    state.on('settings-changed', (settings) => {
        // Update mode radio
        const modeRadio = panelElement.querySelector(`input[name="suggestion-mode"][value="${settings.mode}"]`);
        if (modeRadio) modeRadio.checked = true;
    });
    
    // Listen for new messages (auto mode)
    document.addEventListener('st:message-received', () => {
        if (state.get('mode') === 'auto' && state.get('enabled')) {
            gen.generateSuggestions();
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Render suggestions list
 */
function renderSuggestions(suggestions = null) {
    suggestions = suggestions || state.getSuggestions();
    const listEl = panelElement.querySelector('.suggestion-list');
    
    if (suggestions.length === 0) {
        listEl.innerHTML = `
            <div class="suggestion-empty">
                <p>No suggestions yet.</p>
                <p class="suggestion-empty-hint">Click Refresh or enter an intent below.</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = suggestions.map(sug => renderSuggestionCard(sug)).join('');
    
    // Attach click listeners
    listEl.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', () => {
            const sugId = card.dataset.suggestionId;
            executeSuggestion(sugId);
        });
    });
}

/**
 * Render a single suggestion card
 */
function renderSuggestionCard(suggestion) {
    const skill = SKILLS[suggestion.skill];
    const attribute = skill ? ATTRIBUTES[skill.attribute] : null;
    const color = attribute?.color || '#888888';
    const diffInfo = state.getDifficultyFromDC(suggestion.dc);
    
    return `
        <div class="suggestion-card" data-suggestion-id="${suggestion.id}">
            <div class="suggestion-card-header">
                <span class="suggestion-card-skill" style="color: ${color}">
                    [${suggestion.skillName} ${suggestion.dc}]
                </span>
                <span class="suggestion-card-difficulty" style="color: ${diffInfo.color}">
                    ${suggestion.difficulty}
                </span>
            </div>
            <div class="suggestion-card-short">${escapeHtml(suggestion.shortText)}</div>
            <div class="suggestion-card-voice">${escapeHtml(suggestion.voiceText)}</div>
            ${suggestion.tags.length > 0 ? `
                <div class="suggestion-card-tags">
                    ${suggestion.tags.map(t => `<span class="suggestion-tag">${t}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render roll result
 */
function renderRollResult(result) {
    const resultEl = panelElement.querySelector('.suggestion-result');
    const listEl = panelElement.querySelector('.suggestion-list');
    
    // Hide list, show result
    listEl.style.display = 'none';
    resultEl.style.display = 'block';
    
    // Determine result class
    let resultClass = result.success ? 'success' : 'failure';
    if (result.isCriticalSuccess) resultClass = 'critical-success';
    if (result.isCriticalFailure) resultClass = 'critical-failure';
    
    resultEl.className = `suggestion-result ${resultClass}`;
    
    // Populate
    const skill = SKILLS[result.suggestion.skill];
    const attribute = skill ? ATTRIBUTES[skill.attribute] : null;
    const color = attribute?.color || '#888888';
    
    resultEl.querySelector('.suggestion-result-skill').innerHTML = 
        `<span style="color: ${color}">${result.suggestion.skillName}</span>`;
    
    let rollText = `${result.roll}`;
    if (result.total !== result.roll) {
        rollText = `${result.roll} + ${result.total - result.roll} = ${result.total}`;
    }
    rollText += ` vs ${result.dc}`;
    
    let outcomeText = result.success ? 'SUCCESS' : 'FAILURE';
    if (result.isCriticalSuccess) outcomeText = '✦ CRITICAL SUCCESS ✦';
    if (result.isCriticalFailure) outcomeText = '✦ CRITICAL FAILURE ✦';
    
    resultEl.querySelector('.suggestion-result-roll').innerHTML = 
        `<span class="roll-numbers">${rollText}</span> <span class="roll-outcome">${outcomeText}</span>`;
    
    resultEl.querySelector('.suggestion-result-text').textContent = result.resultText;
}

/**
 * Hide roll result, show suggestions again
 */
function hideRollResult() {
    const resultEl = panelElement.querySelector('.suggestion-result');
    const listEl = panelElement.querySelector('.suggestion-list');
    
    resultEl.style.display = 'none';
    listEl.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
// PANEL VISIBILITY
// ═══════════════════════════════════════════════════════════════

function showPanel() {
    panelElement.style.display = 'flex';
    panelElement.classList.add('suggestion-panel-visible');
    toggleButton.classList.add('active');
}

function hidePanel() {
    panelElement.classList.remove('suggestion-panel-visible');
    toggleButton.classList.remove('active');
    
    setTimeout(() => {
        if (!state.isOpen()) {
            panelElement.style.display = 'none';
        }
    }, 300); // Match CSS transition
}

function showLoading() {
    panelElement.querySelector('.suggestion-list').style.display = 'none';
    panelElement.querySelector('.suggestion-error').style.display = 'none';
    panelElement.querySelector('.suggestion-loading').style.display = 'flex';
}

function hideLoading() {
    panelElement.querySelector('.suggestion-loading').style.display = 'none';
    panelElement.querySelector('.suggestion-list').style.display = 'block';
}

function showError(message) {
    panelElement.querySelector('.suggestion-list').style.display = 'none';
    panelElement.querySelector('.suggestion-loading').style.display = 'none';
    panelElement.querySelector('.suggestion-error').style.display = 'flex';
    panelElement.querySelector('.suggestion-error-text').textContent = message;
}

function updateBadge(count) {
    const badge = toggleButton.querySelector('.suggestion-toggle-badge');
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Execute a suggestion (roll it)
 */
async function executeSuggestion(suggestionId) {
    const card = panelElement.querySelector(`[data-suggestion-id="${suggestionId}"]`);
    if (card) {
        card.classList.add('suggestion-card-rolling');
    }
    
    const result = await gen.executeSuggestion(suggestionId);
    
    if (card) {
        card.classList.remove('suggestion-card-rolling');
    }
    
    if (!result.success) {
        showToast(result.error || 'Roll failed', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Make an element draggable
 */
function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', dragMouseDown);
    handle.addEventListener('touchstart', dragTouchStart, { passive: false });
    
    function dragMouseDown(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }
    
    function dragTouchStart(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.addEventListener('touchend', closeDragElement);
        document.addEventListener('touchmove', elementTouchDrag, { passive: false });
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        moveElement();
    }
    
    function elementTouchDrag(e) {
        e.preventDefault();
        const touch = e.touches[0];
        pos1 = pos3 - touch.clientX;
        pos2 = pos4 - touch.clientY;
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        moveElement();
    }
    
    function moveElement() {
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        // Keep within viewport
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 100));
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));
        
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }
    
    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementTouchDrag);
        
        // Save position
        state.set('panelPosition', {
            top: element.offsetTop,
            left: element.offsetLeft
        });
    }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (typeof toastr !== 'undefined') {
        toastr[type](message, 'Suggestion');
    } else {
        console.log(`[Suggestion] ${type}: ${message}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

/**
 * Destroy the panel (for cleanup)
 */
export function destroy() {
    if (panelElement) {
        panelElement.remove();
        panelElement = null;
    }
    if (toggleButton) {
        toggleButton.remove();
        toggleButton = null;
    }
    isInitialized = false;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { state, gen };
