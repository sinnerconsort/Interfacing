/**
 * Interfacing - Ledger System
 * Manages tasks (quests), memories, and contacts
 * Styled as police case files
 * 
 * Dependencies: state.js, config.js
 */

import * as state from '../core/state.js';
import { TASK_PRIORITIES, RELATIONSHIPS } from '../core/config.js';

// ═══════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════

function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// CASE INFO
// ═══════════════════════════════════════════════════════════════

/**
 * Get case info
 */
export function getCaseInfo() {
    return state.getLedger().caseInfo;
}

/**
 * Update case info
 */
export function updateCaseInfo(updates) {
    const ledger = state._getLedgerRef();
    ledger.caseInfo = { ...ledger.caseInfo, ...updates };
    state.setLedger(ledger);
}

/**
 * Format case number as string (e.g., "HDB-041")
 */
export function formatCaseNumber() {
    const { officerInitials, caseNumber } = state.getLedger().caseInfo;
    return `${officerInitials || 'HDB'}-${String(caseNumber || 1).padStart(3, '0')}`;
}

/**
 * Initialize case info for new chat
 */
export function initializeCase(options = {}) {
    const settings = state.getSettings();
    
    updateCaseInfo({
        officerInitials: options.initials || settings.officerInitials || 'HDB',
        caseNumber: options.caseNumber || settings.nextCaseNumber || 1,
        title: options.title || '',
        openedAt: Date.now()
    });
    
    // Increment next case number in settings
    state.setSetting('nextCaseNumber', (settings.nextCaseNumber || 1) + 1);
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a new task
 * @param {string} text - Task description
 * @param {Object} options - Additional options
 */
export function addTask(text, options = {}) {
    const ledger = state._getLedgerRef();
    
    const task = {
        id: generateId('task'),
        text,
        priority: options.priority || 'side',    // 'main' | 'side' | 'optional'
        locked: options.locked || false,
        addedAt: Date.now(),
        source: options.source || 'manual',      // 'manual' | 'auto-detected' | 'thought'
        notes: options.notes || ''
    };
    
    ledger.tasks.active.push(task);
    state.setLedger(ledger);
    
    dispatchTaskAdded(task);
    return task;
}

/**
 * Complete a task
 * @param {string} taskId - ID of task to complete
 */
export function completeTask(taskId) {
    const ledger = state._getLedgerRef();
    const taskIndex = ledger.tasks.active.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    const task = ledger.tasks.active[taskIndex];
    
    // Check if locked
    if (task.locked) {
        console.warn('[Interfacing] Cannot manually complete locked task');
        return false;
    }
    
    // Move to completed
    ledger.tasks.active.splice(taskIndex, 1);
    ledger.tasks.completed.push({
        ...task,
        completedAt: Date.now()
    });
    
    state.setLedger(ledger);
    dispatchTaskCompleted(task);
    return true;
}

/**
 * Fail a task (move to "Destroyed Ledger")
 */
export function failTask(taskId) {
    const ledger = state._getLedgerRef();
    const taskIndex = ledger.tasks.active.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    const task = ledger.tasks.active[taskIndex];
    
    // Move to failed
    ledger.tasks.active.splice(taskIndex, 1);
    ledger.tasks.failed.push({
        ...task,
        failedAt: Date.now()
    });
    
    state.setLedger(ledger);
    dispatchTaskFailed(task);
    return true;
}

/**
 * Update a task
 */
export function updateTask(taskId, updates) {
    const ledger = state._getLedgerRef();
    const task = ledger.tasks.active.find(t => t.id === taskId);
    
    if (!task) return false;
    
    Object.assign(task, updates);
    state.setLedger(ledger);
    return true;
}

/**
 * Remove a task (delete, not complete or fail)
 */
export function removeTask(taskId) {
    const ledger = state._getLedgerRef();
    
    // Check all lists
    let found = false;
    
    const activeIdx = ledger.tasks.active.findIndex(t => t.id === taskId);
    if (activeIdx !== -1) {
        ledger.tasks.active.splice(activeIdx, 1);
        found = true;
    }
    
    const completedIdx = ledger.tasks.completed.findIndex(t => t.id === taskId);
    if (completedIdx !== -1) {
        ledger.tasks.completed.splice(completedIdx, 1);
        found = true;
    }
    
    const failedIdx = ledger.tasks.failed.findIndex(t => t.id === taskId);
    if (failedIdx !== -1) {
        ledger.tasks.failed.splice(failedIdx, 1);
        found = true;
    }
    
    if (found) {
        state.setLedger(ledger);
    }
    
    return found;
}

/**
 * Unlock a task (allow manual completion)
 */
export function unlockTask(taskId) {
    return updateTask(taskId, { locked: false });
}

/**
 * Lock a task (prevent manual completion)
 */
export function lockTask(taskId) {
    return updateTask(taskId, { locked: true });
}

/**
 * Get active tasks
 */
export function getActiveTasks() {
    return state.getLedger().tasks.active;
}

/**
 * Get completed tasks
 */
export function getCompletedTasks() {
    return state.getLedger().tasks.completed;
}

/**
 * Get failed tasks
 */
export function getFailedTasks() {
    return state.getLedger().tasks.failed;
}

/**
 * Get tasks by priority
 */
export function getTasksByPriority(priority) {
    return state.getLedger().tasks.active.filter(t => t.priority === priority);
}

/**
 * Get main quest tasks
 */
export function getMainTasks() {
    return getTasksByPriority('main');
}

/**
 * Get side tasks
 */
export function getSideTasks() {
    return getTasksByPriority('side');
}

// ═══════════════════════════════════════════════════════════════
// MEMORIES / EVENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a memory/event
 * @param {string} summary - Brief description
 * @param {Object} options - Additional options
 */
export function addMemory(summary, options = {}) {
    const ledger = state._getLedgerRef();
    
    const memory = {
        id: generateId('mem'),
        summary,
        fullText: options.fullText || null,
        characters: options.characters || [],
        location: options.location || null,
        timestamp: Date.now(),
        source: options.source || 'manual'    // 'manual' | 'auto-detected'
    };
    
    ledger.memories.push(memory);
    state.setLedger(ledger);
    
    return memory;
}

/**
 * Update a memory
 */
export function updateMemory(memoryId, updates) {
    const ledger = state._getLedgerRef();
    const memory = ledger.memories.find(m => m.id === memoryId);
    
    if (!memory) return false;
    
    Object.assign(memory, updates);
    state.setLedger(ledger);
    return true;
}

/**
 * Remove a memory
 */
export function removeMemory(memoryId) {
    const ledger = state._getLedgerRef();
    const idx = ledger.memories.findIndex(m => m.id === memoryId);
    
    if (idx === -1) return false;
    
    ledger.memories.splice(idx, 1);
    state.setLedger(ledger);
    return true;
}

/**
 * Get all memories
 */
export function getMemories() {
    return state.getLedger().memories;
}

/**
 * Get recent memories (last N)
 */
export function getRecentMemories(count = 5) {
    const memories = state.getLedger().memories;
    return memories.slice(-count).reverse();
}

/**
 * Get memories involving a character
 */
export function getMemoriesWithCharacter(characterName) {
    const lowerName = characterName.toLowerCase();
    return state.getLedger().memories.filter(m => 
        m.characters.some(c => c.toLowerCase() === lowerName)
    );
}

/**
 * Get memories at a location
 */
export function getMemoriesAtLocation(location) {
    const lowerLoc = location.toLowerCase();
    return state.getLedger().memories.filter(m => 
        m.location && m.location.toLowerCase().includes(lowerLoc)
    );
}

// ═══════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════

/**
 * Add a contact
 * @param {string} name - Contact's name
 * @param {Object} options - Additional options
 */
export function addContact(name, options = {}) {
    const ledger = state._getLedgerRef();
    
    // Check for existing contact
    const existing = ledger.contacts.find(c => 
        c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
        // Update existing instead
        return updateContact(existing.id, options);
    }
    
    const contact = {
        id: generateId('contact'),
        name,
        description: options.description || '',
        relationship: options.relationship || 'neutral',
        firstMet: Date.now(),
        notes: options.notes || ''
    };
    
    ledger.contacts.push(contact);
    state.setLedger(ledger);
    
    return contact;
}

/**
 * Update a contact
 */
export function updateContact(contactId, updates) {
    const ledger = state._getLedgerRef();
    const contact = ledger.contacts.find(c => c.id === contactId);
    
    if (!contact) return null;
    
    Object.assign(contact, updates);
    state.setLedger(ledger);
    return contact;
}

/**
 * Remove a contact
 */
export function removeContact(contactId) {
    const ledger = state._getLedgerRef();
    const idx = ledger.contacts.findIndex(c => c.id === contactId);
    
    if (idx === -1) return false;
    
    ledger.contacts.splice(idx, 1);
    state.setLedger(ledger);
    return true;
}

/**
 * Get all contacts
 */
export function getContacts() {
    return state.getLedger().contacts;
}

/**
 * Find contact by name
 */
export function findContactByName(name) {
    const lowerName = name.toLowerCase();
    return state.getLedger().contacts.find(c => 
        c.name.toLowerCase() === lowerName
    );
}

/**
 * Get contacts by relationship type
 */
export function getContactsByRelationship(relationship) {
    return state.getLedger().contacts.filter(c => c.relationship === relationship);
}

/**
 * Set contact relationship
 */
export function setContactRelationship(contactId, relationship) {
    if (!RELATIONSHIPS[relationship]) {
        console.warn('[Interfacing] Invalid relationship type:', relationship);
        return false;
    }
    return updateContact(contactId, { relationship }) !== null;
}

// ═══════════════════════════════════════════════════════════════
// QUERIES & STATS
// ═══════════════════════════════════════════════════════════════

/**
 * Get ledger statistics
 */
export function getLedgerStats() {
    const ledger = state.getLedger();
    
    return {
        tasks: {
            active: ledger.tasks.active.length,
            completed: ledger.tasks.completed.length,
            failed: ledger.tasks.failed.length,
            mainActive: ledger.tasks.active.filter(t => t.priority === 'main').length
        },
        memories: ledger.memories.length,
        contacts: {
            total: ledger.contacts.length,
            friendly: ledger.contacts.filter(c => c.relationship === 'friendly').length,
            hostile: ledger.contacts.filter(c => c.relationship === 'hostile').length
        }
    };
}

/**
 * Search across all ledger content
 */
export function searchLedger(query) {
    const ledger = state.getLedger();
    const lowerQuery = query.toLowerCase();
    const results = [];
    
    // Search tasks
    [...ledger.tasks.active, ...ledger.tasks.completed, ...ledger.tasks.failed].forEach(task => {
        if (task.text.toLowerCase().includes(lowerQuery)) {
            results.push({ type: 'task', item: task });
        }
    });
    
    // Search memories
    ledger.memories.forEach(mem => {
        if (mem.summary.toLowerCase().includes(lowerQuery) ||
            (mem.fullText && mem.fullText.toLowerCase().includes(lowerQuery))) {
            results.push({ type: 'memory', item: mem });
        }
    });
    
    // Search contacts
    ledger.contacts.forEach(contact => {
        if (contact.name.toLowerCase().includes(lowerQuery) ||
            contact.description.toLowerCase().includes(lowerQuery)) {
            results.push({ type: 'contact', item: contact });
        }
    });
    
    return results;
}

// ═══════════════════════════════════════════════════════════════
// EVENT DISPATCHERS
// ═══════════════════════════════════════════════════════════════

function dispatchTaskAdded(task) {
    document.dispatchEvent(new CustomEvent('if:task-added', {
        detail: { task }
    }));
}

function dispatchTaskCompleted(task) {
    document.dispatchEvent(new CustomEvent('if:task-completed', {
        detail: { task }
    }));
}

function dispatchTaskFailed(task) {
    document.dispatchEvent(new CustomEvent('if:task-failed', {
        detail: { task }
    }));
}
