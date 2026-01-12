/**
 * Interfacing - Main Panel
 * Sliding sidebar panel with tab navigation
 * 
 * Tabs: Vitals | Inventory | Ledger | Settings
 */

import { createFab, injectFabStyles } from './fab.js';
import * as tabs from './tabs.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let panelElement = null;
let mainFab = null;
let isOpen = false;
let currentTab = 'vitals';
let isInitialized = false;

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function init() {
    if (isInitialized) return;
    
    injectFabStyles();
    injectPanelStyles();
    createPanel();
    createMainFab();
    
    // Listen for state changes to refresh UI
    document.addEventListener('if:vitals-changed', () => {
        if (isOpen && currentTab === 'vitals') renderCurrentTab();
    });
    document.addEventListener('if:inventory-changed', () => {
        if (isOpen && currentTab === 'inventory') renderCurrentTab();
    });
    document.addEventListener('if:ledger-changed', () => {
        if (isOpen && currentTab === 'ledger') renderCurrentTab();
    });
    
    isInitialized = true;
    console.log('[Interfacing] Panel initialized');
}

// ═══════════════════════════════════════════════════════════════
// MAIN FAB (📋)
// ═══════════════════════════════════════════════════════════════

function createMainFab() {
    mainFab = createFab({
        id: 'if-main-fab',
        icon: '📋',
        tooltip: 'Interfacing',
        position: { bottom: 160, right: 20 },
        className: 'if-fab-main',
        onClick: togglePanel
    });
}

export function showFab() {
    mainFab?.show();
}

export function hideFab() {
    mainFab?.hide();
}

// ═══════════════════════════════════════════════════════════════
// PANEL CREATION
// ═══════════════════════════════════════════════════════════════

function createPanel() {
    panelElement = document.createElement('div');
    panelElement.id = 'if-panel';
    panelElement.className = 'if-panel';
    
    panelElement.innerHTML = `
        <div class="if-panel-header">
            <span class="if-panel-title">INTERFACING</span>
            <button class="if-panel-close" title="Close">✕</button>
        </div>
        
        <div class="if-panel-tabs">
            <button class="if-tab-btn active" data-tab="vitals" title="Vitals">
                <span class="if-tab-icon">❤️</span>
            </button>
            <button class="if-tab-btn" data-tab="inventory" title="Inventory">
                <span class="if-tab-icon">🎒</span>
            </button>
            <button class="if-tab-btn" data-tab="ledger" title="Ledger">
                <span class="if-tab-icon">📓</span>
            </button>
            <button class="if-tab-btn" data-tab="settings" title="Settings">
                <span class="if-tab-icon">⚙️</span>
            </button>
        </div>
        
        <div class="if-panel-content">
            <div class="if-tab-content active" id="if-tab-vitals"></div>
            <div class="if-tab-content" id="if-tab-inventory"></div>
            <div class="if-tab-content" id="if-tab-ledger"></div>
            <div class="if-tab-content" id="if-tab-settings"></div>
        </div>
    `;
    
    // Event listeners
    panelElement.querySelector('.if-panel-close').addEventListener('click', closePanel);
    
    panelElement.querySelectorAll('.if-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    document.body.appendChild(panelElement);
}

// ═══════════════════════════════════════════════════════════════
// PANEL OPEN/CLOSE
// ═══════════════════════════════════════════════════════════════

export function openPanel() {
    if (!panelElement) return;
    
    isOpen = true;
    panelElement.classList.add('open');
    mainFab?.setActive(true);
    
    renderCurrentTab();
    
    document.dispatchEvent(new CustomEvent('if:panel-opened'));
}

export function closePanel() {
    if (!panelElement) return;
    
    isOpen = false;
    panelElement.classList.remove('open');
    mainFab?.setActive(false);
    
    document.dispatchEvent(new CustomEvent('if:panel-closed'));
}

export function togglePanel() {
    if (isOpen) {
        closePanel();
    } else {
        openPanel();
    }
}

export function isPanelOpen() {
    return isOpen;
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════

function switchTab(tabId) {
    if (currentTab === tabId) return;
    
    currentTab = tabId;
    
    // Update tab button states
    panelElement.querySelectorAll('.if-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // Update content visibility
    panelElement.querySelectorAll('.if-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `if-tab-${tabId}`);
    });
    
    renderCurrentTab();
}

export function goToTab(tabId) {
    if (['vitals', 'inventory', 'ledger', 'settings'].includes(tabId)) {
        switchTab(tabId);
    }
}

function renderCurrentTab() {
    const container = panelElement?.querySelector(`#if-tab-${currentTab}`);
    if (!container) return;
    
    switch (currentTab) {
        case 'vitals':
            tabs.renderVitalsTab(container);
            break;
        case 'inventory':
            tabs.renderInventoryTab(container);
            break;
        case 'ledger':
            tabs.renderLedgerTab(container);
            break;
        case 'settings':
            tabs.renderSettingsTab(container);
            break;
    }
}

export function refresh() {
    if (isOpen) {
        renderCurrentTab();
    }
}

// ═══════════════════════════════════════════════════════════════
// PANEL STYLES
// ═══════════════════════════════════════════════════════════════

function injectPanelStyles() {
    if (document.getElementById('if-panel-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'if-panel-styles';
    style.textContent = `
        /* ════════════════════════════════════════════════════════════
           PANEL CONTAINER
           ════════════════════════════════════════════════════════════ */
        
        .if-panel {
            position: fixed;
            top: 0;
            right: -320px;
            width: 320px;
            height: 100vh;
            height: 100dvh;
            background: #1a1a1f;
            border-left: 1px solid #3a3a4a;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            transition: right 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .if-panel.open {
            right: 0;
        }
        
        /* ════════════════════════════════════════════════════════════
           HEADER
           ════════════════════════════════════════════════════════════ */
        
        .if-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: #141418;
            border-bottom: 1px solid #3a3a4a;
            flex-shrink: 0;
        }
        
        .if-panel-title {
            font-size: 14px;
            font-weight: 600;
            color: #bfa127;
            letter-spacing: 1px;
        }
        
        .if-panel-close {
            background: none;
            border: none;
            color: #888;
            font-size: 18px;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.15s ease;
        }
        
        .if-panel-close:hover {
            color: #fff;
            background: #333;
        }
        
        /* ════════════════════════════════════════════════════════════
           TAB BAR
           ════════════════════════════════════════════════════════════ */
        
        .if-panel-tabs {
            display: flex;
            background: #141418;
            border-bottom: 1px solid #3a3a4a;
            flex-shrink: 0;
        }
        
        .if-tab-btn {
            flex: 1;
            padding: 12px 8px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .if-tab-btn:hover {
            background: #222228;
        }
        
        .if-tab-btn.active {
            border-bottom-color: #bfa127;
            background: #1a1a1f;
        }
        
        .if-tab-icon {
            font-size: 18px;
        }
        
        /* ════════════════════════════════════════════════════════════
           TAB CONTENT
           ════════════════════════════════════════════════════════════ */
        
        .if-panel-content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }
        
        .if-tab-content {
            display: none;
            padding: 16px;
            color: #e8e8e8;
        }
        
        .if-tab-content.active {
            display: block;
        }
        
        /* ════════════════════════════════════════════════════════════
           COMMON UI ELEMENTS
           ════════════════════════════════════════════════════════════ */
        
        .if-section {
            margin-bottom: 20px;
        }
        
        .if-section-title {
            font-size: 11px;
            font-weight: 600;
            color: #bfa127;
            letter-spacing: 1px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .if-card {
            background: #222228;
            border: 1px solid #3a3a4a;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 8px;
        }
        
        .if-card:hover {
            border-color: #4a4a5a;
        }
        
        .if-bar-container {
            margin-bottom: 12px;
        }
        
        .if-bar-label {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 4px;
        }
        
        .if-bar-name {
            color: #e8e8e8;
        }
        
        .if-bar-value {
            color: #888;
        }
        
        .if-bar {
            height: 8px;
            background: #333;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .if-bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .if-bar-fill.health {
            background: linear-gradient(90deg, #8b2222 0%, #cd5c5c 100%);
        }
        
        .if-bar-fill.morale {
            background: linear-gradient(90deg, #1e3a5f 0%, #4a90c2 100%);
        }
        
        .if-bar-fill.critical {
            animation: pulse-critical 1s infinite;
        }
        
        @keyframes pulse-critical {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .if-btn {
            padding: 8px 16px;
            background: #333;
            border: 1px solid #4a4a5a;
            border-radius: 4px;
            color: #e8e8e8;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .if-btn:hover {
            background: #444;
            border-color: #bfa127;
        }
        
        .if-btn.primary {
            background: #bfa127;
            color: #000;
            border-color: #bfa127;
        }
        
        .if-btn.primary:hover {
            background: #d4b82e;
        }
        
        .if-btn-small {
            padding: 4px 8px;
            font-size: 11px;
        }
        
        .if-btn-row {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .if-empty {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 20px;
        }
        
        .if-tag {
            display: inline-block;
            padding: 2px 6px;
            background: #333;
            border-radius: 3px;
            font-size: 10px;
            color: #888;
            margin-right: 4px;
            margin-bottom: 4px;
        }
        
        .if-tag.positive {
            background: #1e3a2a;
            color: #4a9966;
        }
        
        .if-tag.negative {
            background: #3a1e1e;
            color: #a54444;
        }
        
        /* ════════════════════════════════════════════════════════════
           CHECKBOX / TOGGLE
           ════════════════════════════════════════════════════════════ */
        
        .if-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            margin-bottom: 8px;
        }
        
        .if-checkbox input {
            width: 16px;
            height: 16px;
            accent-color: #bfa127;
        }
        
        .if-checkbox span {
            font-size: 13px;
            color: #e8e8e8;
        }
        
        /* ════════════════════════════════════════════════════════════
           SLIDER
           ════════════════════════════════════════════════════════════ */
        
        .if-slider-container {
            margin-bottom: 12px;
        }
        
        .if-slider-label {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 4px;
            color: #e8e8e8;
        }
        
        .if-slider {
            width: 100%;
            height: 6px;
            -webkit-appearance: none;
            appearance: none;
            background: #333;
            border-radius: 3px;
            outline: none;
        }
        
        .if-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: #bfa127;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .if-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #bfa127;
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }
        
        /* ════════════════════════════════════════════════════════════
           SELECT
           ════════════════════════════════════════════════════════════ */
        
        .if-select {
            width: 100%;
            padding: 8px;
            background: #222228;
            border: 1px solid #3a3a4a;
            border-radius: 4px;
            color: #e8e8e8;
            font-size: 13px;
        }
        
        .if-select:focus {
            border-color: #bfa127;
            outline: none;
        }
        
        /* ════════════════════════════════════════════════════════════
           VITALS ADJUSTMENT BUTTONS
           ════════════════════════════════════════════════════════════ */
        
        .if-vital-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }
        
        .if-vital-btn {
            width: 28px;
            height: 28px;
            border-radius: 4px;
            border: 1px solid #4a4a5a;
            background: #333;
            color: #e8e8e8;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .if-vital-btn:hover {
            border-color: #bfa127;
        }
        
        .if-vital-btn.damage {
            border-color: #8b2222;
        }
        
        .if-vital-btn.damage:hover {
            background: #3a1e1e;
        }
        
        .if-vital-btn.heal {
            border-color: #4a9966;
        }
        
        .if-vital-btn.heal:hover {
            background: #1e3a2a;
        }
        
        /* ════════════════════════════════════════════════════════════
           CONDITION CARDS
           ════════════════════════════════════════════════════════════ */
        
        .if-condition {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px;
            background: #222228;
            border: 1px solid #3a3a4a;
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .if-condition-icon {
            font-size: 18px;
            flex-shrink: 0;
        }
        
        .if-condition-info {
            flex: 1;
            min-width: 0;
        }
        
        .if-condition-name {
            font-size: 13px;
            font-weight: 500;
            color: #e8e8e8;
            margin-bottom: 2px;
        }
        
        .if-condition-desc {
            font-size: 11px;
            color: #888;
        }
        
        .if-condition-remove {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            padding: 2px;
            font-size: 14px;
        }
        
        .if-condition-remove:hover {
            color: #a54444;
        }
        
        /* ════════════════════════════════════════════════════════════
           MOBILE ADJUSTMENTS
           ════════════════════════════════════════════════════════════ */
        
        @media (max-width: 400px) {
            .if-panel {
                width: 100%;
                right: -100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export function destroy() {
    if (panelElement) {
        panelElement.remove();
        panelElement = null;
    }
    if (mainFab) {
        mainFab.destroy();
        mainFab = null;
    }
    isInitialized = false;
    isOpen = false;
}
