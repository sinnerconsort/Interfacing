# Interfacing - Complete Development Specification

> **Version:** 3.0.0-dev  
> **Last Updated:** 2025-01-12  
> **Companion To:** Inland Empire (required dependency)  
> **Author:** sinnerconsort

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [File Structure](#3-file-structure)
4. [Data Structures](#4-data-structures)
5. [Inland Empire Integration](#5-inland-empire-integration)
6. [UI Specification](#6-ui-specification)
7. [Module Specifications](#7-module-specifications)
8. [Auto-Detection System](#8-auto-detection-system)
9. [Persistence Strategy](#9-persistence-strategy)
10. [Implementation Checklist](#10-implementation-checklist)
11. [Resume Instructions](#11-resume-instructions)

---

## 1. Overview

### 1.1 Purpose

**Interfacing** is a companion extension to Inland Empire that adds Disco Elysium-style gameplay systems:

- **Status** - Health, Morale, and active conditions/effects
- **Inventory** - Equipment (with skill modifiers), carried items, storage locations, assets
- **Ledger** - Quest/task tracking styled as police case files, plus memories/events

### 1.2 Design Philosophy

- **Disco Elysium Aesthetic** - Muted colors, gold accents, typewriter-style labels
- **IE Dependency** - Uses IE's API for skill modifiers, stat calculations, and generation
- **Non-Intrusive** - Sidebar panel with FAB toggle, no floating widgets
- **Context-Aware** - Can auto-detect inventory/status changes from narrative
- **Per-Chat Persistence** - Data saves to chat metadata, fresh for each conversation

### 1.3 Key Differences from RPG Companion

| Feature | RPG Companion | Interfacing |
|---------|---------------|-------------|
| API | Own configuration | Uses Inland Empire's API |
| Skills | Generic stats | DE's 24 skills via IE |
| Equipment | Simple items | Clothing with skill modifiers |
| Quests | Main/Optional | Case files with police styling |
| Conditions | Status effects | Synced with IE's status system |
| Weather/Time | Built-in tracking | Not included (narrative only) |

---

## 2. Architecture

### 2.1 System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SILLYTAVERN                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Chat Messages  │  │  Chat Metadata  │  │   Extensions    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INLAND EMPIRE                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Skills    │  │   Statuses   │  │  Generation  │          │
│  │  (24 skills) │  │ (conditions) │  │    (API)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └────────────┬────┴────────┬────────┘                   │
│                      ▼             ▼                            │
│              window.InlandEmpire API                            │
│         (getSkillLevel, registerModifier,                       │
│          getStatuses, generate, etc.)                           │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼ events + API calls
┌─────────────────────────────────────────────────────────────────┐
│                       INTERFACING                               │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   STATUS    │   │  INVENTORY  │   │   LEDGER    │           │
│  │             │   │             │   │             │           │
│  │ • Vitals    │   │ • Wearing   │   │ • Tasks     │           │
│  │ • Conditions│   │ • On Person │   │ • Completed │           │
│  │ • Bonuses   │   │ • Stored    │   │ • Memories  │           │
│  │             │   │ • Assets    │   │ • Case Info │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    UI LAYER                              │   │
│  │  Sidebar Panel + FAB Toggle + Tab System                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 PERSISTENCE LAYER                        │   │
│  │  Save/Load to SillyTavern chat_metadata                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Event Flow

```
User equips item in Interfacing UI
    │
    ▼
inventory.js: equipItem(item)
    │
    ├─► state.js: Update inventory.wearing[]
    │
    ├─► ie-bridge.js: registerEquipmentModifiers(item)
    │       │
    │       ▼
    │   IE.registerModifier(itemId, skillId, value) × N
    │
    ├─► persistence.js: saveToChat()
    │
    └─► ui/tabs.js: renderStatusTab() (bonuses updated)


IE fires skill-check event
    │
    ▼
ie-bridge.js: onSkillCheck handler
    │
    ├─► status.js: applyCheckConsequences(result)
    │       │
    │       ▼
    │   modifyHealth() or modifyMorale()
    │
    └─► ui/tabs.js: renderStatusTab() (vitals updated)


Message received (with auto-detect enabled)
    │
    ▼
ie-bridge.js: onMessageReceived
    │
    ▼
auto-detect.js: parseNarrativeChanges(message)
    │
    ├─► inventory changes detected? → inventory.js
    ├─► status changes detected? → status.js
    └─► events detected? → ledger.js
```

---

## 3. File Structure

```
Interfacing/
│
├── manifest.json           # Extension manifest
├── index.js                # Entry point, initialization
├── styles.css              # All styling
├── SPEC.md                 # This document
│
└── src/
    │
    ├── core/
    │   ├── state.js        # Central state store
    │   ├── persistence.js  # Chat metadata save/load
    │   ├── ie-bridge.js    # Inland Empire integration
    │   └── config.js       # Constants, defaults
    │
    ├── systems/
    │   ├── status.js       # Vitals and conditions
    │   ├── inventory.js    # Equipment and items
    │   ├── ledger.js       # Tasks and memories
    │   └── auto-detect.js  # Narrative parsing
    │
    └── ui/
        ├── panel.js        # Sidebar panel creation
        ├── tabs.js         # Tab content rendering
        ├── fab.js          # Floating action button
        └── modals.js       # Add/edit dialogs
```

### 3.1 Module Dependency Graph

```
index.js
    │
    ├── config.js (no deps)
    │
    ├── state.js
    │       └── config.js
    │
    ├── persistence.js
    │       └── state.js
    │
    ├── ie-bridge.js
    │       ├── state.js
    │       ├── status.js
    │       └── inventory.js
    │
    ├── status.js
    │       ├── state.js
    │       └── ie-bridge.js
    │
    ├── inventory.js
    │       ├── state.js
    │       └── ie-bridge.js
    │
    ├── ledger.js
    │       └── state.js
    │
    ├── auto-detect.js
    │       ├── ie-bridge.js
    │       ├── status.js
    │       ├── inventory.js
    │       └── ledger.js
    │
    └── ui/*
            ├── state.js
            ├── status.js
            ├── inventory.js
            └── ledger.js
```

---

## 4. Data Structures

### 4.1 Settings Schema

```javascript
const DEFAULT_SETTINGS = {
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
    autoDetectEnabled: true,
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
```

### 4.2 Vitals Schema

```javascript
const vitals = {
    health: {
        current: 6,              // Current HP
        max: 6,                  // baseHealth + Endurance level
        temp: 0                  // Temporary HP (from items, etc.)
    },
    morale: {
        current: 7,              // Current Morale
        max: 7,                  // baseMorale + Volition level
        temp: 0                  // Temporary Morale
    }
};
```

### 4.3 Condition Schema

```javascript
// Conditions are synced FROM Inland Empire's status system
// This is a read cache, not the source of truth
const conditions = [
    {
        id: 'hungover',
        name: 'Hungover',
        description: 'The consequences of last night.',
        icon: '🤢',              // Optional emoji/icon
        modifiers: {
            'endurance': -1,
            'intellect': -1      // Note: These are tracked in IE
        },
        source: 'narrative',     // 'narrative' | 'item' | 'manual' | 'thought'
        duration: null,          // null = permanent until removed
        addedAt: 1705012800000
    }
];
```

### 4.4 Inventory Schema

```javascript
const inventory = {
    // Currently worn clothing/accessories
    wearing: [
        {
            id: 'disco_blazer',
            name: 'Disco Ass Blazer',
            slot: 'jacket',      // See EQUIPMENT_SLOTS
            description: 'A flashy orange blazer with a disco ball pattern.',
            modifiers: {
                'savoir_faire': +1,
                'suggestion': +1,
                'composure': -1
            },
            special: null,       // Special effects text
            equippedAt: 1705012800000
        }
    ],
    
    // Items on person (pockets, hands, etc.)
    onPerson: [
        {
            id: 'flashlight_001',
            name: 'Flashlight',
            description: 'A standard police-issue flashlight.',
            quantity: 1,
            category: 'tool',    // See ITEM_CATEGORIES
            consumable: false,
            addedAt: 1705012800000
        }
    ],
    
    // Named storage locations with items
    stored: {
        'Whirling-in-Rags Room 9': [
            {
                id: 'spare_shirt',
                name: 'Spare Shirt',
                description: 'A wrinkled dress shirt.',
                quantity: 1,
                category: 'clothing'
            }
        ],
        'Kineema Trunk': [
            // items...
        ]
    },
    
    // Major assets (vehicles, property)
    assets: [
        {
            id: 'kineema',
            name: 'Kineema (MC Motor Carriage)',
            type: 'vehicle',     // 'vehicle' | 'property' | 'major_item'
            description: 'A Coupris Kineema motor carriage. Yours, apparently.',
            location: 'Behind Whirling-in-Rags',
            addedAt: 1705012800000
        }
    ]
};
```

### 4.5 Equipment Slots

```javascript
const EQUIPMENT_SLOTS = {
    head: { name: 'Head', icon: '🎩', maxItems: 1 },
    face: { name: 'Face', icon: '👓', maxItems: 1 },
    neck: { name: 'Neck', icon: '👔', maxItems: 1 },
    jacket: { name: 'Jacket', icon: '🧥', maxItems: 1 },
    shirt: { name: 'Shirt', icon: '👕', maxItems: 1 },
    pants: { name: 'Pants', icon: '👖', maxItems: 1 },
    shoes: { name: 'Shoes', icon: '👞', maxItems: 1 },
    gloves: { name: 'Gloves', icon: '🧤', maxItems: 1 },
    hands: { name: 'Hands', icon: '✋', maxItems: 2 }  // Can hold 2 items
};
```

### 4.6 Item Categories

```javascript
const ITEM_CATEGORIES = {
    weapon: { name: 'Weapon', icon: '🔫' },
    tool: { name: 'Tool', icon: '🔧' },
    document: { name: 'Document', icon: '📄' },
    evidence: { name: 'Evidence', icon: '🔍' },
    consumable: { name: 'Consumable', icon: '💊' },
    clothing: { name: 'Clothing', icon: '👔' },
    key: { name: 'Key Item', icon: '🔑' },
    misc: { name: 'Miscellaneous', icon: '📦' }
};
```

### 4.7 Ledger Schema

```javascript
const ledger = {
    // Case file metadata
    caseInfo: {
        officerInitials: 'HDB',
        caseNumber: 41,
        title: 'The Hanged Man',         // Optional case title
        openedAt: 1705012800000
    },
    
    // Active tasks
    tasks: {
        active: [
            {
                id: 'task_001',
                text: 'Find a way home',
                priority: 'main',         // 'main' | 'side' | 'optional'
                locked: false,            // If true, can't be manually completed
                addedAt: 1705012800000,
                source: 'manual'          // 'manual' | 'auto-detected' | 'thought'
            }
        ],
        completed: [
            {
                id: 'task_000',
                text: 'Wake up',
                priority: 'main',
                completedAt: 1705012800000,
                source: 'auto-detected'
            }
        ],
        failed: [
            // "Destroyed" tasks go here
        ]
    },
    
    // Memories / Events (auto-detected or manual)
    memories: [
        {
            id: 'mem_001',
            summary: 'Encountered a strange, meta-aware skeleton named Sans.',
            fullText: null,              // Optional longer description
            characters: ['Sans'],        // NPCs involved
            location: 'Snowdin Forest',  // Where it happened
            timestamp: 1705012800000,
            source: 'auto-detected'
        }
    ],
    
    // Named people/NPCs encountered
    contacts: [
        {
            id: 'sans',
            name: 'Sans',
            description: 'Short skeleton in a blue hoodie. Knows more than he lets on.',
            relationship: 'neutral',     // 'friendly' | 'neutral' | 'hostile' | 'unknown'
            firstMet: 1705012800000,
            notes: ''
        }
    ]
};
```

---

## 5. Inland Empire Integration

### 5.1 Required IE API Methods

These methods MUST exist in `window.InlandEmpire`:

```javascript
// READING
IE.getSkillLevel(skillId)           // Returns base level (1-6)
IE.getEffectiveSkillLevel(skillId)  // Returns level with all modifiers
IE.getSkillData(skillId)            // Returns full skill object
IE.getAllSkills()                   // Returns all 24 skills

// MODIFIERS
IE.registerModifier(sourceId, skillId, value)  // Add a modifier
IE.removeModifierSource(sourceId)              // Remove all from a source
IE.getModifiersForSkill(skillId)               // List modifiers on a skill

// STATUSES (may need to be added to IE)
IE.getStatuses()                    // Returns array of active statuses
IE.addStatus(statusObject)          // Add a status/condition
IE.removeStatus(statusId)           // Remove a status

// GENERATION (may need to be added to IE)
IE.generate(prompt, options)        // Generate text using IE's API config
IE.isAPIConfigured()                // Check if API is ready

// SKILL CHECK
IE.rollCheck(skillId, difficulty)   // Perform a skill check
```

### 5.2 IE Events to Listen For

```javascript
// Skill check completed
document.addEventListener('ie:skill-check', (e) => {
    const { 
        skillId,      // Which skill was checked
        difficulty,   // DC of the check
        roll,         // The 2d6 roll result
        modifier,     // Total skill modifier
        total,        // roll + modifier
        success,      // Did it pass?
        isBoxcars,    // Rolled 12 (critical success)
        isSnakeEyes,  // Rolled 2 (critical failure)
        attribute     // INTELLECT, PSYCHE, PHYSIQUE, MOTORICS
    } = e.detail;
});

// Modifier changed (equipment, drugs, etc.)
document.addEventListener('ie:modifier-changed', (e) => {
    const {
        sourceId,     // ID of the modifier source
        skillId,      // Affected skill (or null if removed)
        value,        // New value (or null if removed)
        totals,       // Updated totals for all skills
        removed       // Boolean - was source removed?
    } = e.detail;
});

// Status changed
document.addEventListener('ie:status-changed', (e) => {
    const {
        statusId,
        action,       // 'added' | 'removed' | 'updated'
        status        // The status object
    } = e.detail;
});

// IE ready (for initialization)
document.addEventListener('ie:ready', (e) => {
    const { version } = e.detail;
});
```

### 5.3 Events Interfacing Dispatches

```javascript
// Notify other extensions of inventory changes
document.dispatchEvent(new CustomEvent('if:item-equipped', {
    detail: { item, slot, modifiers }
}));

document.dispatchEvent(new CustomEvent('if:item-unequipped', {
    detail: { item, slot }
}));

document.dispatchEvent(new CustomEvent('if:vitals-changed', {
    detail: { health, morale, source }
}));

document.dispatchEvent(new CustomEvent('if:task-completed', {
    detail: { task }
}));
```

---

## 6. UI Specification

### 6.1 Panel Structure

```
┌─────────────────────────────────────────────────┐
│ 🔧 INTERFACING                             [×]  │  ← Header (fixed)
├─────────────────────────────────────────────────┤
│  STATUS  │  INVENTORY  │  LEDGER  │  [⚙️]      │  ← Tabs (fixed)
├─────────────────────────────────────────────────┤
│                                                 │
│              [Tab Content Area]                 │  ← Scrollable
│                   (varies)                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.2 Status Tab Layout

```
┌─────────────────────────────────────────────────┐
│ // VITALS                                       │
│                                                 │
│ HEALTH    ████████░░░░  6/8                     │
│           [−1] [+1]                             │
│                                                 │
│ MORALE    ██████████░░  7/9                     │
│           [−1] [+1]                             │
│                                                 │
├─────────────────────────────────────────────────┤
│ // CONDITIONS                                   │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🤢 Hungover                          [×] │    │
│ │    END -1, INT -1                        │    │
│ └─────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────┐    │
│ │ ☕ Caffeinated                       [×] │    │
│ │    INT +1, MOT +1                        │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│            [+ Add Condition]                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ // EQUIPMENT BONUSES                            │
│                                                 │
│ Savoir Faire     +1                             │
│ Suggestion       +1                             │
│ Composure        -1                             │
│                                                 │
│ (from: Disco Ass Blazer)                        │
└─────────────────────────────────────────────────┘
```

### 6.3 Inventory Tab Layout

```
┌─────────────────────────────────────────────────┐
│  [Wearing] [On Person] [Stored ▼] [Assets]      │  ← Subtabs
├─────────────────────────────────────────────────┤
│                                                 │
│ // WEARING                                      │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 🧥 JACKET                                │    │
│ │    Disco Ass Blazer                      │    │
│ │    +1 Savoir Faire, +1 Suggestion        │    │
│ │    -1 Composure                          │    │
│ │                        [Unequip] [Edit]  │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 👔 NECK                                  │    │
│ │    (empty)                    [+ Equip]  │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ 👖 PANTS                                 │    │
│ │    (empty)                    [+ Equip]  │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ...                                             │
└─────────────────────────────────────────────────┘

─── OR for "Stored" subtab: ───

┌─────────────────────────────────────────────────┐
│ // STORAGE LOCATIONS                            │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ ▼ Whirling-in-Rags Room 9    [+] [🗑]   │    │  ← Collapsible
│ ├─────────────────────────────────────────┤    │
│ │   • Spare Shirt                         │    │
│ │   • Empty Bottle                        │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ ▶ Kineema Trunk (3 items)    [+] [🗑]   │    │  ← Collapsed
│ └─────────────────────────────────────────┘    │
│                                                 │
│           [+ Add Storage Location]              │
└─────────────────────────────────────────────────┘
```

### 6.4 Ledger Tab Layout

```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐    │
│ │  CASE FILE                              │    │
│ │  HDB-041                                │    │
│ │  "The Hanged Man"              [Edit]   │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
├─────────────────────────────────────────────────┤
│ // ACTIVE TASKS                                 │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ ★ Find a way home               🔒 [✓]  │    │  ← Main task, locked
│ └─────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────┐    │
│ │ ○ Talk to Sans                     [✓]  │    │  ← Side task
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌───────────────────────────────────────┐      │
│ │ New task...                    [Add]  │      │
│ └───────────────────────────────────────┘      │
│                                                 │
├─────────────────────────────────────────────────┤
│ // COMPLETED (2)                      [Show]   │
│                                                 │
├─────────────────────────────────────────────────┤
│ // MEMORIES                                     │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │ • Encountered a strange, meta-aware     │    │
│ │   skeleton named Sans.                  │    │
│ │   ─ Snowdin Forest                      │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│            [+ Add Memory]                       │
│                                                 │
├─────────────────────────────────────────────────┤
│ // CONTACTS (1)                       [Show]   │
└─────────────────────────────────────────────────┘
```

### 6.5 FAB (Floating Action Button)

```
Properties:
- Size: 48×48px
- Shape: Circle
- Icon: 🔧 (wrench emoji) or custom icon
- Position: Saved to settings, defaults to bottom-left
- Draggable: Yes, position persists
- States:
  - Default: Shows icon
  - Panel Open: Hidden
  - Loading: Spinning animation (during generation)

Behavior:
- Tap: Toggle panel open/close
- Drag: Reposition (save on release)
- Long press: (future) Quick actions menu
```

### 6.6 Color Palette

```css
/* Disco Elysium Theme */
--if-bg: #1a1a1f;              /* Panel background */
--if-bg-dark: #141418;         /* Darker sections */
--if-accent: #252530;          /* Cards, inputs */
--if-text: #e8e8e8;            /* Primary text */
--if-text-dim: #888888;        /* Secondary text */
--if-border: #3a3a4a;          /* Borders */
--if-highlight: #bfa127;       /* Gold accent (DE yellow) */

/* Vitals */
--if-health: #c4a35a;          /* Health bar (amber/gold) */
--if-health-bg: #1a1510;       /* Health bar background */
--if-morale: #0d738a;          /* Morale bar (teal) */
--if-morale-bg: #0a1a1d;       /* Morale bar background */

/* States */
--if-positive: #4a9966;        /* Positive modifiers */
--if-negative: #a54444;        /* Negative modifiers */
--if-danger: #dc3545;          /* Critical, delete */
--if-success: #28a745;         /* Complete, success */
```

### 6.7 Typography

```css
/* Headers */
font-family: 'Segoe UI', system-ui, sans-serif;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 1px;

/* Labels (DE style) */
font-family: 'Courier New', monospace;  /* Or similar */
font-size: 11px;
color: var(--if-text-dim);
/* Prefix with // for section headers */

/* Body text */
font-family: 'Segoe UI', system-ui, sans-serif;
font-size: 13px;
line-height: 1.5;
```

---

## 7. Module Specifications

### 7.1 config.js

**Purpose:** Constants and default values. No dependencies.

```javascript
// Exports
export const EXTENSION_NAME = 'Interfacing';
export const EXTENSION_VERSION = '3.0.0';
export const EXTENSION_FOLDER = `scripts/extensions/third-party/${EXTENSION_NAME}`;

export const DEFAULT_SETTINGS = { /* see 4.1 */ };
export const EQUIPMENT_SLOTS = { /* see 4.5 */ };
export const ITEM_CATEGORIES = { /* see 4.6 */ };

export const SKILLS = {
    // Map of all 24 DE skills for reference
    logic: { name: 'Logic', attribute: 'INTELLECT' },
    encyclopedia: { name: 'Encyclopedia', attribute: 'INTELLECT' },
    // ... all 24
};
```

### 7.2 state.js

**Purpose:** Central state store. Single source of truth.

```javascript
// Private state (module-scoped)
let _settings = { ...DEFAULT_SETTINGS };
let _vitals = { health: {}, morale: {} };
let _conditions = [];
let _inventory = { wearing: [], onPerson: [], stored: {}, assets: [] };
let _ledger = { caseInfo: {}, tasks: {}, memories: [], contacts: [] };
let _ui = { isPanelOpen: false, currentTab: 'status', currentInventorySection: 'wearing' };
let _isIEConnected = false;

// Exports - getters
export function getSettings() { return _settings; }
export function getVitals() { return _vitals; }
export function getConditions() { return _conditions; }
export function getInventory() { return _inventory; }
export function getLedger() { return _ledger; }
export function getUIState() { return _ui; }
export function isIEConnected() { return _isIEConnected; }

// Exports - setters (with validation)
export function updateSettings(partial) { /* merge and validate */ }
export function setVitals(health, morale) { /* with bounds checking */ }
export function setConditions(conditions) { /* replace array */ }
export function setInventory(inventory) { /* replace object */ }
export function setLedger(ledger) { /* replace object */ }
export function setUIState(partial) { /* merge */ }
export function setIEConnected(value) { /* boolean */ }

// Full state export (for persistence)
export function getFullState() {
    return { settings: _settings, vitals: _vitals, conditions: _conditions, 
             inventory: _inventory, ledger: _ledger };
}

export function loadFullState(state) {
    // Restore from persisted data with validation
}
```

### 7.3 persistence.js

**Purpose:** Save/load to SillyTavern's chat metadata.

```javascript
import { getFullState, loadFullState, getSettings, updateSettings } from './state.js';
import { EXTENSION_NAME } from './config.js';

// Save current state to chat metadata
export function saveToChat() {
    const context = SillyTavern?.getContext?.();
    if (!context?.chat_metadata) return false;
    
    context.chat_metadata[EXTENSION_NAME] = getFullState();
    context.saveMetadataDebounced?.();
    return true;
}

// Load state from chat metadata
export function loadFromChat() {
    const context = SillyTavern?.getContext?.();
    const saved = context?.chat_metadata?.[EXTENSION_NAME];
    
    if (saved) {
        loadFullState(saved);
        return true;
    }
    return false;
}

// Save settings to extension_settings (persists across chats)
export function saveGlobalSettings() {
    const context = SillyTavern?.getContext?.();
    if (!context?.extensionSettings) return false;
    
    context.extensionSettings[EXTENSION_NAME] = getSettings();
    context.saveSettingsDebounced?.();
    return true;
}

// Load global settings
export function loadGlobalSettings() {
    const context = SillyTavern?.getContext?.();
    const saved = context?.extensionSettings?.[EXTENSION_NAME];
    
    if (saved) {
        updateSettings(saved);
        return true;
    }
    return false;
}
```

### 7.4 ie-bridge.js

**Purpose:** All Inland Empire interactions.

```javascript
import * as state from './state.js';
import * as status from '../systems/status.js';
import * as inventory from '../systems/inventory.js';

let IE = null;

// Initialize connection
export function init() {
    if (window.InlandEmpire) {
        onIEReady(window.InlandEmpire);
    }
    
    document.addEventListener('ie:ready', (e) => {
        onIEReady(window.InlandEmpire);
    });
}

function onIEReady(ieInstance) {
    IE = ieInstance;
    state.setIEConnected(true);
    
    // Set up event listeners
    document.addEventListener('ie:skill-check', onSkillCheck);
    document.addEventListener('ie:modifier-changed', onModifierChanged);
    document.addEventListener('ie:status-changed', onStatusChanged);
    
    // Initialize vitals based on skills
    status.initVitalsFromSkills();
    
    // Sync any existing equipment to IE
    inventory.syncAllModifiersToIE();
    
    console.log('[Interfacing] Connected to Inland Empire');
}

// Event handlers
function onSkillCheck(e) {
    status.handleSkillCheckResult(e.detail);
}

function onModifierChanged(e) {
    // Update UI when modifiers change
    document.dispatchEvent(new CustomEvent('if:modifiers-updated'));
}

function onStatusChanged(e) {
    // Sync status from IE
    status.syncFromIE();
}

// API wrappers
export function getSkillLevel(skillId) {
    return IE?.getSkillLevel?.(skillId) ?? 0;
}

export function getEffectiveSkillLevel(skillId) {
    return IE?.getEffectiveSkillLevel?.(skillId) ?? 0;
}

export function registerModifier(sourceId, skillId, value) {
    return IE?.registerModifier?.(sourceId, skillId, value);
}

export function removeModifierSource(sourceId) {
    return IE?.removeModifierSource?.(sourceId);
}

export function getStatuses() {
    return IE?.getStatuses?.() ?? [];
}

export async function generate(prompt, options = {}) {
    if (!IE?.generate) {
        console.warn('[Interfacing] IE generation not available');
        return null;
    }
    return IE.generate(prompt, options);
}

export function isAPIConfigured() {
    return IE?.isAPIConfigured?.() ?? false;
}
```

### 7.5 status.js

**Purpose:** Vitals (HP/Morale) and conditions management.

```javascript
import * as state from '../core/state.js';
import * as ieBridge from '../core/ie-bridge.js';
import * as persistence from '../core/persistence.js';
import { DEFAULT_SETTINGS } from '../core/config.js';

// Initialize vitals based on IE skill levels
export function initVitalsFromSkills() {
    const settings = state.getSettings();
    const endurance = ieBridge.getEffectiveSkillLevel('endurance') || 1;
    const volition = ieBridge.getEffectiveSkillLevel('volition') || 1;
    
    const vitals = state.getVitals();
    
    // Only init if not already set (preserve loaded data)
    if (!vitals.health.max) {
        const maxHealth = settings.baseHealth + endurance;
        const maxMorale = settings.baseMorale + volition;
        
        state.setVitals(
            { current: maxHealth, max: maxHealth, temp: 0 },
            { current: maxMorale, max: maxMorale, temp: 0 }
        );
    }
}

// Modify health
export function modifyHealth(delta, source = 'manual') {
    const vitals = state.getVitals();
    const newCurrent = Math.max(0, Math.min(
        vitals.health.max + vitals.health.temp,
        vitals.health.current + delta
    ));
    
    state.setVitals(
        { ...vitals.health, current: newCurrent },
        vitals.morale
    );
    
    persistence.saveToChat();
    dispatchVitalsChanged(source);
    
    if (newCurrent === 0) {
        dispatchDeath('health');
    }
}

// Modify morale
export function modifyMorale(delta, source = 'manual') {
    const vitals = state.getVitals();
    const newCurrent = Math.max(0, Math.min(
        vitals.morale.max + vitals.morale.temp,
        vitals.morale.current + delta
    ));
    
    state.setVitals(
        vitals.health,
        { ...vitals.morale, current: newCurrent }
    );
    
    persistence.saveToChat();
    dispatchVitalsChanged(source);
    
    if (newCurrent === 0) {
        dispatchDeath('morale');
    }
}

// Handle skill check consequences
export function handleSkillCheckResult(result) {
    const { success, isSnakeEyes, isBoxcars, attribute } = result;
    
    // Determine which vital to affect
    const isPhysical = attribute === 'PHYSIQUE' || attribute === 'MOTORICS';
    
    if (!success) {
        if (isPhysical) {
            modifyHealth(-1, 'skill-check');
        } else {
            modifyMorale(-1, 'skill-check');
        }
    }
    
    // Critical failure = extra damage
    if (isSnakeEyes) {
        if (isPhysical) {
            modifyHealth(-1, 'critical-failure');
        } else {
            modifyMorale(-1, 'critical-failure');
        }
    }
    
    // Critical success = heal
    if (isBoxcars) {
        if (isPhysical) {
            modifyHealth(1, 'critical-success');
        } else {
            modifyMorale(1, 'critical-success');
        }
    }
}

// Conditions management
export function addCondition(condition) {
    const conditions = state.getConditions();
    
    // Check for duplicate
    if (conditions.find(c => c.id === condition.id)) {
        return false;
    }
    
    // Register modifiers with IE
    if (condition.modifiers) {
        Object.entries(condition.modifiers).forEach(([skill, value]) => {
            ieBridge.registerModifier(`condition_${condition.id}`, skill, value);
        });
    }
    
    state.setConditions([...conditions, {
        ...condition,
        addedAt: Date.now()
    }]);
    
    persistence.saveToChat();
    return true;
}

export function removeCondition(conditionId) {
    const conditions = state.getConditions();
    const condition = conditions.find(c => c.id === conditionId);
    
    if (!condition) return false;
    
    // Remove modifiers from IE
    ieBridge.removeModifierSource(`condition_${conditionId}`);
    
    state.setConditions(conditions.filter(c => c.id !== conditionId));
    persistence.saveToChat();
    return true;
}

// Sync conditions from IE's status system
export function syncFromIE() {
    const ieStatuses = ieBridge.getStatuses();
    // Convert IE statuses to our condition format
    // This is a one-way sync - IE is the source of truth
    const conditions = ieStatuses.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        icon: s.icon,
        modifiers: s.modifiers,
        source: 'ie-sync',
        duration: s.duration,
        addedAt: s.addedAt || Date.now()
    }));
    
    state.setConditions(conditions);
}

// Get total equipment bonuses (for display)
export function getEquipmentBonuses() {
    const inventory = state.getInventory();
    const totals = {};
    
    inventory.wearing.forEach(item => {
        if (item.modifiers) {
            Object.entries(item.modifiers).forEach(([skill, value]) => {
                totals[skill] = (totals[skill] || 0) + value;
            });
        }
    });
    
    return totals;
}

// Helper: dispatch events
function dispatchVitalsChanged(source) {
    const vitals = state.getVitals();
    document.dispatchEvent(new CustomEvent('if:vitals-changed', {
        detail: { health: vitals.health, morale: vitals.morale, source }
    }));
}

function dispatchDeath(type) {
    document.dispatchEvent(new CustomEvent('if:death', {
        detail: { type } // 'health' or 'morale'
    }));
}
```

### 7.6 inventory.js

**Purpose:** Equipment and item management.

```javascript
import * as state from '../core/state.js';
import * as ieBridge from '../core/ie-bridge.js';
import * as persistence from '../core/persistence.js';
import { EQUIPMENT_SLOTS } from '../core/config.js';

// Generate unique ID
function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// EQUIPMENT (Wearing)
// ═══════════════════════════════════════════════════════════════

export function equipItem(item) {
    const inventory = state.getInventory();
    
    // Validate slot
    if (!item.slot || !EQUIPMENT_SLOTS[item.slot]) {
        console.warn('[Interfacing] Invalid equipment slot:', item.slot);
        return false;
    }
    
    // Check if slot is occupied
    const existingItem = inventory.wearing.find(i => i.slot === item.slot);
    if (existingItem) {
        unequipItem(existingItem.id);
    }
    
    // Add to wearing
    const newItem = {
        ...item,
        id: item.id || generateId('equip'),
        equippedAt: Date.now()
    };
    
    inventory.wearing.push(newItem);
    state.setInventory(inventory);
    
    // Register modifiers with IE
    if (newItem.modifiers) {
        Object.entries(newItem.modifiers).forEach(([skill, value]) => {
            ieBridge.registerModifier(newItem.id, skill, value);
        });
    }
    
    persistence.saveToChat();
    dispatchEquipped(newItem);
    return true;
}

export function unequipItem(itemId) {
    const inventory = state.getInventory();
    const itemIndex = inventory.wearing.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) return false;
    
    const item = inventory.wearing[itemIndex];
    
    // Remove modifiers from IE
    ieBridge.removeModifierSource(itemId);
    
    // Remove from wearing
    inventory.wearing.splice(itemIndex, 1);
    state.setInventory(inventory);
    
    persistence.saveToChat();
    dispatchUnequipped(item);
    return true;
}

export function getEquippedInSlot(slot) {
    const inventory = state.getInventory();
    return inventory.wearing.find(i => i.slot === slot) || null;
}

export function getAllEquipped() {
    return state.getInventory().wearing;
}

// ═══════════════════════════════════════════════════════════════
// ITEMS (On Person)
// ═══════════════════════════════════════════════════════════════

export function addItem(item, section = 'onPerson') {
    const inventory = state.getInventory();
    
    const newItem = {
        ...item,
        id: item.id || generateId('item'),
        quantity: item.quantity || 1,
        addedAt: Date.now()
    };
    
    if (section === 'onPerson') {
        inventory.onPerson.push(newItem);
    } else if (section === 'assets') {
        inventory.assets.push(newItem);
    }
    
    state.setInventory(inventory);
    persistence.saveToChat();
    return newItem;
}

export function removeItem(itemId, section = 'onPerson') {
    const inventory = state.getInventory();
    
    if (section === 'onPerson') {
        inventory.onPerson = inventory.onPerson.filter(i => i.id !== itemId);
    } else if (section === 'assets') {
        inventory.assets = inventory.assets.filter(i => i.id !== itemId);
    }
    
    state.setInventory(inventory);
    persistence.saveToChat();
}

export function updateItemQuantity(itemId, delta, section = 'onPerson') {
    const inventory = state.getInventory();
    const items = section === 'onPerson' ? inventory.onPerson : inventory.assets;
    const item = items.find(i => i.id === itemId);
    
    if (!item) return false;
    
    item.quantity = Math.max(0, (item.quantity || 1) + delta);
    
    if (item.quantity === 0) {
        removeItem(itemId, section);
    } else {
        state.setInventory(inventory);
        persistence.saveToChat();
    }
    
    return true;
}

// ═══════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════

export function addStorageLocation(name) {
    const inventory = state.getInventory();
    
    if (inventory.stored[name]) {
        return false; // Already exists
    }
    
    inventory.stored[name] = [];
    state.setInventory(inventory);
    persistence.saveToChat();
    return true;
}

export function removeStorageLocation(name) {
    const inventory = state.getInventory();
    
    if (!inventory.stored[name]) {
        return false;
    }
    
    delete inventory.stored[name];
    state.setInventory(inventory);
    persistence.saveToChat();
    return true;
}

export function addItemToStorage(locationName, item) {
    const inventory = state.getInventory();
    
    if (!inventory.stored[locationName]) {
        inventory.stored[locationName] = [];
    }
    
    const newItem = {
        ...item,
        id: item.id || generateId('stored'),
        quantity: item.quantity || 1,
        addedAt: Date.now()
    };
    
    inventory.stored[locationName].push(newItem);
    state.setInventory(inventory);
    persistence.saveToChat();
    return newItem;
}

export function removeItemFromStorage(locationName, itemId) {
    const inventory = state.getInventory();
    
    if (!inventory.stored[locationName]) return false;
    
    inventory.stored[locationName] = inventory.stored[locationName].filter(i => i.id !== itemId);
    state.setInventory(inventory);
    persistence.saveToChat();
    return true;
}

export function moveItem(itemId, fromSection, toSection, toLocation = null) {
    const inventory = state.getInventory();
    let item = null;
    
    // Find and remove from source
    if (fromSection === 'onPerson') {
        const idx = inventory.onPerson.findIndex(i => i.id === itemId);
        if (idx !== -1) {
            item = inventory.onPerson.splice(idx, 1)[0];
        }
    } else if (fromSection === 'stored') {
        for (const [loc, items] of Object.entries(inventory.stored)) {
            const idx = items.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                item = items.splice(idx, 1)[0];
                break;
            }
        }
    }
    
    if (!item) return false;
    
    // Add to destination
    if (toSection === 'onPerson') {
        inventory.onPerson.push(item);
    } else if (toSection === 'stored' && toLocation) {
        if (!inventory.stored[toLocation]) {
            inventory.stored[toLocation] = [];
        }
        inventory.stored[toLocation].push(item);
    }
    
    state.setInventory(inventory);
    persistence.saveToChat();
    return true;
}

// ═══════════════════════════════════════════════════════════════
// SYNC & UTILITIES
// ═══════════════════════════════════════════════════════════════

// Re-register all equipment modifiers with IE (on load)
export function syncAllModifiersToIE() {
    const inventory = state.getInventory();
    
    inventory.wearing.forEach(item => {
        if (item.modifiers) {
            Object.entries(item.modifiers).forEach(([skill, value]) => {
                ieBridge.registerModifier(item.id, skill, value);
            });
        }
    });
}

// Get total modifier for a specific skill from equipment
export function getEquipmentModifier(skillId) {
    const inventory = state.getInventory();
    let total = 0;
    
    inventory.wearing.forEach(item => {
        if (item.modifiers?.[skillId]) {
            total += item.modifiers[skillId];
        }
    });
    
    return total;
}

// Event dispatchers
function dispatchEquipped(item) {
    document.dispatchEvent(new CustomEvent('if:item-equipped', {
        detail: { item, slot: item.slot, modifiers: item.modifiers }
    }));
}

function dispatchUnequipped(item) {
    document.dispatchEvent(new CustomEvent('if:item-unequipped', {
        detail: { item, slot: item.slot }
    }));
}
```

### 7.7 ledger.js

**Purpose:** Task tracking and memories.

```javascript
import * as state from '../core/state.js';
import * as persistence from '../core/persistence.js';

// Generate unique ID
function generateId(prefix = 'task') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════
// CASE INFO
// ═══════════════════════════════════════════════════════════════

export function getCaseInfo() {
    return state.getLedger().caseInfo;
}

export function updateCaseInfo(updates) {
    const ledger = state.getLedger();
    ledger.caseInfo = { ...ledger.caseInfo, ...updates };
    state.setLedger(ledger);
    persistence.saveToChat();
}

export function formatCaseNumber() {
    const { officerInitials, caseNumber } = state.getLedger().caseInfo;
    return `${officerInitials}-${String(caseNumber).padStart(3, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════

export function addTask(text, priority = 'side', locked = false, source = 'manual') {
    const ledger = state.getLedger();
    
    const task = {
        id: generateId('task'),
        text,
        priority,      // 'main' | 'side' | 'optional'
        locked,
        addedAt: Date.now(),
        source         // 'manual' | 'auto-detected' | 'thought'
    };
    
    ledger.tasks.active.push(task);
    state.setLedger(ledger);
    persistence.saveToChat();
    
    return task;
}

export function completeTask(taskId) {
    const ledger = state.getLedger();
    const taskIndex = ledger.tasks.active.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return false;
    
    const task = ledger.tasks.active[taskIndex];
    
    // Check if locked
    if (task.locked) {
        console.warn('[Interfacing] Cannot complete locked task');
        return false;
    }
    
    // Move to completed
    ledger.tasks.active.splice(taskIndex, 1);
    ledger.tasks.completed.push({
        ...task,
        completedAt: Date.now()
    });
    
    state.setLedger(ledger);
    persistence.saveToChat();
    
    dispatchTaskCompleted(task);
    return true;
}

export function failTask(taskId) {
    const ledger = state.getLedger();
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
    persistence.saveToChat();
    
    return true;
}

export function removeTask(taskId) {
    const ledger = state.getLedger();
    
    // Remove from active
    ledger.tasks.active = ledger.tasks.active.filter(t => t.id !== taskId);
    
    state.setLedger(ledger);
    persistence.saveToChat();
}

export function updateTask(taskId, updates) {
    const ledger = state.getLedger();
    const task = ledger.tasks.active.find(t => t.id === taskId);
    
    if (!task) return false;
    
    Object.assign(task, updates);
    state.setLedger(ledger);
    persistence.saveToChat();
    return true;
}

export function getActiveTasks() {
    return state.getLedger().tasks.active;
}

export function getCompletedTasks() {
    return state.getLedger().tasks.completed;
}

export function getFailedTasks() {
    return state.getLedger().tasks.failed;
}

// ═══════════════════════════════════════════════════════════════
// MEMORIES
// ═══════════════════════════════════════════════════════════════

export function addMemory(summary, options = {}) {
    const ledger = state.getLedger();
    
    const memory = {
        id: generateId('mem'),
        summary,
        fullText: options.fullText || null,
        characters: options.characters || [],
        location: options.location || null,
        timestamp: Date.now(),
        source: options.source || 'manual'
    };
    
    ledger.memories.push(memory);
    state.setLedger(ledger);
    persistence.saveToChat();
    
    return memory;
}

export function removeMemory(memoryId) {
    const ledger = state.getLedger();
    ledger.memories = ledger.memories.filter(m => m.id !== memoryId);
    state.setLedger(ledger);
    persistence.saveToChat();
}

export function getMemories() {
    return state.getLedger().memories;
}

// ═══════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════

export function addContact(name, options = {}) {
    const ledger = state.getLedger();
    
    // Check for existing
    if (ledger.contacts.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        return null; // Already exists
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
    persistence.saveToChat();
    
    return contact;
}

export function updateContact(contactId, updates) {
    const ledger = state.getLedger();
    const contact = ledger.contacts.find(c => c.id === contactId);
    
    if (!contact) return false;
    
    Object.assign(contact, updates);
    state.setLedger(ledger);
    persistence.saveToChat();
    return true;
}

export function getContacts() {
    return state.getLedger().contacts;
}

// Event dispatcher
function dispatchTaskCompleted(task) {
    document.dispatchEvent(new CustomEvent('if:task-completed', {
        detail: { task }
    }));
}
```

### 7.8 auto-detect.js

**Purpose:** Parse narrative for changes (stub - complex feature).

```javascript
import * as ieBridge from '../core/ie-bridge.js';
import * as state from '../core/state.js';
import * as inventory from './inventory.js';
import * as status from './status.js';
import * as ledger from './ledger.js';

// Patterns to look for in narrative
const PATTERNS = {
    itemPickup: /(?:pick(?:s|ed)? up|grab(?:s|bed)?|take(?:s|n)?|acquire(?:s|d)?)\s+(?:a |an |the )?(.+?)(?:\.|,|$)/gi,
    itemDrop: /(?:drop(?:s|ped)?|discard(?:s|ed)?|throw(?:s|n)? away)\s+(?:a |an |the )?(.+?)(?:\.|,|$)/gi,
    clothingChange: /(?:put(?:s|ting)? on|wear(?:s|ing)?|don(?:s|ned)?)\s+(?:a |an |the )?(.+?)(?:\.|,|$)/gi,
    healthDamage: /(?:hurt|wound(?:s|ed)?|injur(?:y|ed|ies)|damage(?:s|d)?|hit|struck|pain)/gi,
    moraleDamage: /(?:depress(?:ed|ing)?|sad(?:den)?|discourag(?:ed|ing)?|upset|devastat(?:ed|ing)?)/gi,
    newCharacter: /(?:meet(?:s)?|encounter(?:s)?|approach(?:es|ed)?|see(?:s)?)\s+(?:a |an )?(?:person |man |woman |figure )?(?:named |called )?([A-Z][a-z]+)/g
};

// Main parse function
export async function parseMessage(messageText, options = {}) {
    const settings = state.getSettings();
    
    if (!settings.autoDetectEnabled) return { changes: [] };
    
    const changes = [];
    
    // Item detection
    if (settings.autoDetectInventory) {
        const itemChanges = detectItemChanges(messageText);
        changes.push(...itemChanges);
    }
    
    // Status detection
    if (settings.autoDetectStatus) {
        const statusChanges = detectStatusChanges(messageText);
        changes.push(...statusChanges);
    }
    
    // Event detection
    if (settings.autoDetectEvents) {
        const eventChanges = detectEvents(messageText);
        changes.push(...eventChanges);
    }
    
    return { changes };
}

function detectItemChanges(text) {
    const changes = [];
    
    // This is a simplified stub - real implementation would be more sophisticated
    // Potentially using IE's generate() for LLM-assisted detection
    
    let match;
    
    // Item pickups
    while ((match = PATTERNS.itemPickup.exec(text)) !== null) {
        changes.push({
            type: 'item_added',
            itemName: match[1].trim(),
            section: 'onPerson',
            confidence: 0.6
        });
    }
    
    return changes;
}

function detectStatusChanges(text) {
    const changes = [];
    
    // Simple keyword detection - stub
    if (PATTERNS.healthDamage.test(text)) {
        changes.push({
            type: 'health_hint',
            direction: 'damage',
            confidence: 0.4
        });
    }
    
    return changes;
}

function detectEvents(text) {
    const changes = [];
    
    // Character detection - stub
    let match;
    while ((match = PATTERNS.newCharacter.exec(text)) !== null) {
        changes.push({
            type: 'character_encountered',
            name: match[1],
            confidence: 0.5
        });
    }
    
    return changes;
}

// Apply detected changes (with confirmation)
export function applyChange(change) {
    switch (change.type) {
        case 'item_added':
            inventory.addItem({
                name: change.itemName,
                category: 'misc'
            }, change.section);
            break;
            
        case 'character_encountered':
            ledger.addContact(change.name);
            break;
            
        // ... other types
    }
}

// LLM-assisted detection (uses IE's API)
export async function detectWithLLM(messageText) {
    if (!ieBridge.isAPIConfigured()) {
        return { success: false, reason: 'API not configured' };
    }
    
    const prompt = `Analyze this roleplay message for inventory/status changes. Return JSON only.

Message:
"${messageText}"

Return format:
{
  "items_added": ["item name"],
  "items_removed": ["item name"],
  "health_change": 0,
  "morale_change": 0,
  "new_characters": ["name"],
  "notable_events": ["brief description"]
}`;

    try {
        const response = await ieBridge.generate(prompt, { maxTokens: 300 });
        const data = JSON.parse(response);
        return { success: true, data };
    } catch (e) {
        console.error('[Interfacing] LLM detection failed:', e);
        return { success: false, reason: e.message };
    }
}
```

---

## 8. Auto-Detection System

### 8.1 Overview

Auto-detection is an **optional feature** that parses incoming messages for:
- Inventory changes (picking up/dropping items)
- Status changes (health/morale implications)
- Notable events (for the memory log)
- New characters encountered

### 8.2 Detection Modes

1. **Regex-based (fast, lower accuracy)**
   - Pattern matching for common phrases
   - No API calls required
   - Good for obvious changes

2. **LLM-assisted (slower, higher accuracy)**
   - Uses IE's configured API
   - Better understanding of context
   - Can generate item descriptions

### 8.3 Confirmation Flow

```
Message received
    │
    ▼
Auto-detect parses message
    │
    ▼
Changes detected?
    │
    ├─ No → Done
    │
    └─ Yes → Show suggestion banner
              │
              ├─ User confirms → Apply changes
              │
              └─ User dismisses → Ignore
```

### 8.4 Settings

```javascript
autoDetectEnabled: true,      // Master toggle
autoDetectInventory: true,    // Detect item changes
autoDetectStatus: true,       // Detect health/morale hints
autoDetectEvents: true,       // Detect notable events
autoConfirmLowConfidence: false,  // Auto-apply low confidence?
confidenceThreshold: 0.7      // Minimum confidence to auto-apply
```

---

## 9. Persistence Strategy

### 9.1 What Goes Where

| Data | Storage Location | When Saved |
|------|------------------|------------|
| Settings (UI prefs) | `extension_settings.Interfacing` | On change |
| Inventory | `chat_metadata.Interfacing` | On change |
| Vitals | `chat_metadata.Interfacing` | On change |
| Ledger | `chat_metadata.Interfacing` | On change |
| FAB position | `extension_settings.Interfacing` | On drag end |

### 9.2 Save/Load Triggers

**Save:**
- Any state change (debounced, 500ms)
- Panel close
- Tab switch
- Before page unload

**Load:**
- Extension init
- Chat change (`eventSource.on(event_types.CHAT_CHANGED)`)
- Manual refresh

### 9.3 Data Migration

For future versions, include a version number in saved data:

```javascript
{
    _version: 3,
    settings: { ... },
    inventory: { ... },
    // ...
}
```

Migration logic:
```javascript
function migrate(savedData) {
    if (savedData._version < 3) {
        // Migrate v2 → v3
    }
    return savedData;
}
```

---

## 10. Implementation Checklist

### Phase 1: Core Foundation
- [ ] `config.js` - Constants and defaults
- [ ] `state.js` - State management
- [ ] `persistence.js` - Save/load functions
- [ ] `ie-bridge.js` - IE connection

### Phase 2: Systems
- [ ] `status.js` - Vitals and conditions
- [ ] `inventory.js` - Equipment and items
- [ ] `ledger.js` - Tasks and memories

### Phase 3: UI
- [ ] `styles.css` - Complete styling
- [ ] `panel.js` - Sidebar panel
- [ ] `fab.js` - Floating action button
- [ ] `tabs.js` - Tab content rendering

### Phase 4: Entry Point
- [ ] `index.js` - Initialization
- [ ] `manifest.json` - Extension manifest

### Phase 5: Polish
- [ ] `modals.js` - Add/edit dialogs
- [ ] `auto-detect.js` - Narrative parsing
- [ ] Testing and bug fixes

### Phase 6: Advanced Features
- [ ] LLM-assisted item descriptions
- [ ] LLM-assisted auto-detection
- [ ] Thought Cabinet integration
- [ ] Choice Suggestions integration

---

## 11. Resume Instructions

### For New Chat Sessions

1. **Upload this SPEC.md file**
2. **State which module you're working on**
3. **Upload the current version of that module (if exists)**

Example prompt:
> "I'm building Interfacing. Here's the SPEC.md. I'm currently working on `inventory.js` - here's what I have so far. Next I need to implement the storage location functions."

### Module Build Order

Build in this order to minimize dependency issues:

1. `config.js` (no deps)
2. `state.js` (depends on config)
3. `persistence.js` (depends on state)
4. `ie-bridge.js` (depends on state)
5. `status.js` (depends on state, ie-bridge)
6. `inventory.js` (depends on state, ie-bridge)
7. `ledger.js` (depends on state)
8. `styles.css` (no deps)
9. `fab.js` (depends on state)
10. `panel.js` (depends on state, fab)
11. `tabs.js` (depends on state, status, inventory, ledger)
12. `index.js` (depends on everything)
13. `auto-detect.js` (depends on ie-bridge, systems)
14. `modals.js` (depends on ui, systems)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0-dev | 2025-01-12 | Initial spec, complete rewrite |

---

## Appendix A: Disco Elysium Skills Reference

```
INTELLECT          PSYCHE             PHYSIQUE           MOTORICS
─────────────      ─────────────      ─────────────      ─────────────
Logic              Volition           Endurance          Hand/Eye Coord
Encyclopedia       Inland Empire      Pain Threshold     Perception
Rhetoric           Empathy            Physical Instr.    Reaction Speed
Drama              Authority          Electrochemistry   Savoir Faire
Conceptualization  Esprit de Corps    Shivers            Interfacing
Visual Calculus    Suggestion         Half Light         Composure
```

### Skill IDs

```javascript
const SKILL_IDS = [
    'logic', 'encyclopedia', 'rhetoric', 'drama', 'conceptualization', 'visual_calculus',
    'volition', 'inland_empire', 'empathy', 'authority', 'esprit_de_corps', 'suggestion',
    'endurance', 'pain_threshold', 'physical_instrument', 'electrochemistry', 'shivers', 'half_light',
    'hand_eye_coordination', 'perception', 'reaction_speed', 'savoir_faire', 'interfacing', 'composure'
];
```

---

## Appendix B: Example Items

```javascript
// The Horrific Necktie
{
    id: 'horrific_necktie',
    name: 'Horrific Necktie',
    slot: 'neck',
    description: 'A loud, ugly necktie. It seems to whisper to you.',
    modifiers: {
        'inland_empire': +2,
        'electrochemistry': +1,
        'composure': -1
    },
    special: 'The necktie occasionally speaks to you.'
}

// Cheap Wine
{
    id: 'cheap_wine',
    name: 'Cheap Wine',
    category: 'consumable',
    description: 'A bottle of questionable vintage.',
    consumable: true,
    effects: {
        modifiers: { 'pain_threshold': +1, 'intellect': -1 },
        duration: 'scene',
        healthChange: -1
    }
}
```

---

*End of Specification*
