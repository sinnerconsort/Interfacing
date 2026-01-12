/**
 * Interfacing - Floating Action Button (FAB)
 * Draggable floating buttons for mobile-friendly UI
 * 
 * Used by both Interfacing main panel and Suggestion panel
 */

// ═══════════════════════════════════════════════════════════════
// FAB FACTORY
// ═══════════════════════════════════════════════════════════════

const activeFabs = new Map();

/**
 * Create a draggable floating action button
 * @param {Object} config
 * @param {string} config.id - Unique ID for the FAB
 * @param {string} config.icon - Emoji or HTML for the button
 * @param {string} config.tooltip - Hover/long-press tooltip
 * @param {Function} config.onClick - Click handler
 * @param {Object} [config.position] - Initial position { bottom, right } in px
 * @param {string} [config.className] - Additional CSS class
 * @param {boolean} [config.badge] - Show notification badge
 * @returns {Object} FAB controller
 */
export function createFab(config) {
    const {
        id,
        icon,
        tooltip = '',
        onClick,
        position = { bottom: 100, right: 20 },
        className = '',
        badge = false
    } = config;
    
    // Don't create duplicates
    if (activeFabs.has(id)) {
        console.warn(`[FAB] FAB with id "${id}" already exists`);
        return activeFabs.get(id);
    }
    
    // Create element
    const fab = document.createElement('div');
    fab.id = id;
    fab.className = `if-fab ${className}`.trim();
    fab.innerHTML = `
        <span class="if-fab-icon">${icon}</span>
        <span class="if-fab-badge" style="display: none;">0</span>
    `;
    fab.title = tooltip;
    
    // Load saved position or use default
    const savedPos = loadPosition(id);
    const finalPos = savedPos || position;
    
    fab.style.cssText = `
        position: fixed;
        bottom: ${finalPos.bottom}px;
        right: ${finalPos.right}px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #1a1a1f;
        border: 2px solid #3a3a4a;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        user-select: none;
        touch-action: none;
        transition: transform 0.15s ease, border-color 0.15s ease;
    `;
    
    // State
    let isDragging = false;
    let isActive = false;
    let dragStartX, dragStartY;
    let fabStartX, fabStartY;
    let hasMoved = false;
    
    // ═══════════════════════════════════════════════════════════
    // DRAG HANDLING
    // ═══════════════════════════════════════════════════════════
    
    function onDragStart(e) {
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        
        const rect = fab.getBoundingClientRect();
        fabStartX = rect.left;
        fabStartY = rect.top;
        
        isDragging = true;
        hasMoved = false;
        
        fab.style.transition = 'none';
        fab.style.transform = 'scale(1.1)';
        
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
    }
    
    function onDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const touch = e.touches ? e.touches[0] : e;
        const deltaX = touch.clientX - dragStartX;
        const deltaY = touch.clientY - dragStartY;
        
        // Only consider it moved if dragged more than 5px
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            hasMoved = true;
        }
        
        let newX = fabStartX + deltaX;
        let newY = fabStartY + deltaY;
        
        // Constrain to viewport
        const maxX = window.innerWidth - fab.offsetWidth;
        const maxY = window.innerHeight - fab.offsetHeight;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Convert to bottom/right positioning
        const newRight = window.innerWidth - newX - fab.offsetWidth;
        const newBottom = window.innerHeight - newY - fab.offsetHeight;
        
        fab.style.right = `${newRight}px`;
        fab.style.bottom = `${newBottom}px`;
    }
    
    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        
        fab.style.transition = 'transform 0.15s ease, border-color 0.15s ease';
        fab.style.transform = 'scale(1)';
        
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        
        // Save position
        const rect = fab.getBoundingClientRect();
        const newRight = window.innerWidth - rect.right;
        const newBottom = window.innerHeight - rect.bottom;
        savePosition(id, { bottom: newBottom, right: newRight });
        
        // If didn't move much, treat as click
        if (!hasMoved && onClick) {
            onClick();
        }
    }
    
    // Attach drag listeners
    fab.addEventListener('mousedown', onDragStart);
    fab.addEventListener('touchstart', onDragStart, { passive: false });
    
    // Hover effects (mouse only)
    fab.addEventListener('mouseenter', () => {
        if (!isDragging) {
            fab.style.borderColor = '#bfa127';
        }
    });
    fab.addEventListener('mouseleave', () => {
        if (!isDragging && !isActive) {
            fab.style.borderColor = '#3a3a4a';
        }
    });
    
    // ═══════════════════════════════════════════════════════════
    // CONTROLLER
    // ═══════════════════════════════════════════════════════════
    
    const controller = {
        element: fab,
        id,
        
        show() {
            fab.style.display = 'flex';
        },
        
        hide() {
            fab.style.display = 'none';
        },
        
        setActive(active) {
            isActive = active;
            if (active) {
                fab.style.borderColor = '#bfa127';
                fab.style.background = '#2a2a1f';
            } else {
                fab.style.borderColor = '#3a3a4a';
                fab.style.background = '#1a1a1f';
            }
        },
        
        setBadge(count) {
            const badge = fab.querySelector('.if-fab-badge');
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        },
        
        setIcon(newIcon) {
            fab.querySelector('.if-fab-icon').innerHTML = newIcon;
        },
        
        destroy() {
            fab.remove();
            activeFabs.delete(id);
        },
        
        resetPosition() {
            localStorage.removeItem(`if-fab-pos-${id}`);
            fab.style.bottom = `${position.bottom}px`;
            fab.style.right = `${position.right}px`;
        }
    };
    
    // Add to DOM and registry
    document.body.appendChild(fab);
    activeFabs.set(id, controller);
    
    return controller;
}

// ═══════════════════════════════════════════════════════════════
// POSITION PERSISTENCE
// ═══════════════════════════════════════════════════════════════

function savePosition(id, pos) {
    try {
        localStorage.setItem(`if-fab-pos-${id}`, JSON.stringify(pos));
    } catch (e) {
        // localStorage might be unavailable
    }
}

function loadPosition(id) {
    try {
        const saved = localStorage.getItem(`if-fab-pos-${id}`);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// FAB STYLES (injected once)
// ═══════════════════════════════════════════════════════════════

let stylesInjected = false;

export function injectFabStyles() {
    if (stylesInjected) return;
    
    const style = document.createElement('style');
    style.id = 'if-fab-styles';
    style.textContent = `
        .if-fab {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .if-fab-icon {
            font-size: 22px;
            line-height: 1;
            pointer-events: none;
        }
        
        .if-fab-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            min-width: 18px;
            height: 18px;
            padding: 0 4px;
            background: #bfa127;
            color: #000;
            font-size: 11px;
            font-weight: bold;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        
        .if-fab.if-fab-suggestion {
            /* Suggestion specific styles */
        }
        
        .if-fab.if-fab-main {
            /* Main panel specific styles */
        }
        
        /* Prevent text selection during drag */
        .if-fab-dragging * {
            user-select: none !important;
        }
    `;
    
    document.head.appendChild(style);
    stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export function getFab(id) {
    return activeFabs.get(id) || null;
}

export function destroyAllFabs() {
    activeFabs.forEach(fab => fab.destroy());
    activeFabs.clear();
}
