/**
 * Interfacing - Disco Elysium Gameplay Systems
 * Companion extension to Inland Empire
 */

(function() {
    'use strict';
    
    const extensionName = 'Interfacing';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // ═══════════════════════════════════════════════════════════════
    // PRESET ITEMS DATA
    // ═══════════════════════════════════════════════════════════════
    
    const PRESET_ITEMS = {
        // ─────────────────────────────────────────────────────────────
        // CLOTHES - NECK
        // ─────────────────────────────────────────────────────────────
        horrific_necktie: {
            id: 'horrific_necktie',
            name: 'Horrific Necktie',
            category: 'clothes',
            slot: 'neck',
            icon: '👔',
            modifiers: { inland_empire: 2, esprit_de_corps: 1, authority: -1 },
            description: "The necktie is adorned with a garish pattern. It's disturbingly vivid. Somehow you feel as if it would be wrong to ever take it off.",
            voiceDescriptions: {
                inland_empire: {
                    check: 'Easy', success: true,
                    text: "No one is saying the multi-patterned necktie you found tied to the ceiling fan can *talk*. No one. It must be merely *imagination*, but...",
                    comment: "HORRIFIC NECKTIE – Let's bail! Time to push the EJECT button. Sounds like a *responsibility*. You don't like those."
                },
                authority: {
                    check: 'Medium', success: false,
                    text: "This tie undermines everything you're trying to project. No one will take you seriously wearing this... thing."
                }
            }
        },
        
        // ─────────────────────────────────────────────────────────────
        // CLOTHES - HAT
        // ─────────────────────────────────────────────────────────────
        faln_pipo_hat: {
            id: 'faln_pipo_hat',
            name: 'FALN "Pipo" Hat',
            category: 'clothes',
            slot: 'hat',
            icon: '🧢',
            modifiers: { esprit_de_corps: 2, rhetoric: 1, authority: -1 },
            description: "A cheap synthetic fiber hat with the FALN logo. Standard issue for the Revolutionary Youth.",
            voiceDescriptions: {
                esprit_de_corps: {
                    check: 'Medium', success: true,
                    text: "You feel it. The camaraderie of the downtrodden. The shared struggle. Somewhere, comrades are fighting.",
                    comment: "ESPRIT DE CORPS – Brothers and sisters in arms. They wore these in the fields, in the factories. Now you wear it too."
                },
                authority: {
                    check: 'Easy', success: false,
                    text: "Revolutionary headwear? Really? You're supposed to be the law, not the resistance."
                }
            }
        },
        
        cuno_cap: {
            id: 'cuno_cap',
            name: "Cuno's Cap",
            category: 'clothes',
            slot: 'hat',
            icon: '🧢',
            modifiers: { suggestion: 2, authority: -2 },
            description: "A grimy baseball cap. The previous owner was... memorable.",
            voiceDescriptions: {
                suggestion: {
                    check: 'Medium', success: true,
                    text: "Street cred, baby. The kids will think you're cool. Or crazy. Same thing, really.",
                    comment: "SUGGESTION – Cuno doesn't care. Cuno doesn't give a f—. And neither do you. Not anymore."
                }
            }
        },
        
        // ─────────────────────────────────────────────────────────────
        // CLOTHES - JACKET
        // ─────────────────────────────────────────────────────────────
        disco_ass_blazer: {
            id: 'disco_ass_blazer',
            name: 'Disco-Ass Blazer',
            category: 'clothes',
            slot: 'jacket',
            icon: '🧥',
            modifiers: { electrochemistry: 2, savoir_faire: 1, suggestion: 1, logic: -1 },
            description: "A flashy blazer with a shimmering disco pattern. It screams 'party' and whispers 'poor decisions'.",
            voiceDescriptions: {
                electrochemistry: {
                    check: 'Easy', success: true,
                    text: "Oh YEAH. This jacket knows things. It's been to places. It's *done* things. Put it on and let the good times roll.",
                    comment: "ELECTROCHEMISTRY – This baby's seen more dance floors than a disco ball. Wear it. *Become* the party."
                },
                logic: {
                    check: 'Easy', success: false,
                    text: "This is not professional attire. This is not *any* kind of appropriate attire. Why would you wear this?"
                }
            }
        },
        
        aerostatic_pilot_jacket: {
            id: 'aerostatic_pilot_jacket',
            name: 'Aerostatic Pilot Jacket',
            category: 'clothes',
            slot: 'jacket',
            icon: '🧥',
            modifiers: { conceptualization: 1, inland_empire: 1, esprit_de_corps: 1, authority: -1 },
            description: "A worn leather jacket from the Aerostatic Corps. Smells like adventure and engine oil.",
            voiceDescriptions: {
                conceptualization: {
                    check: 'Medium', success: true,
                    text: "You're not just wearing a jacket. You're wearing the *idea* of flight. Of escape. Of becoming something more.",
                    comment: "CONCEPTUALIZATION – Every scratch tells a story. Every stain is a memory of the clouds."
                },
                inland_empire: {
                    check: 'Easy', success: true,
                    text: "The jacket remembers things. The pilots who wore it. The skies they crossed. Put it on and *listen*."
                }
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
            icon: '👟',
            modifiers: { savoir_faire: 1, composure: -1 },
            description: "Flashy green shoes made from synthetic snakeskin. They make a statement. Not necessarily a good one.",
            voiceDescriptions: {
                savoir_faire: {
                    check: 'Easy', success: true,
                    text: "These shoes have *presence*. They enter a room before you do. Own it.",
                    comment: "SAVOIR FAIRE – Bold choice. Controversial. But undeniably memorable."
                },
                composure: {
                    check: 'Easy', success: false,
                    text: "People are staring at your feet. They're *always* staring at your feet now."
                }
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
            icon: '🧤',
            modifiers: { interfacing: 1, electrochemistry: 1 },
            description: "Black leather gloves with the fingers cut off. For when you need dexterity and style.",
            voiceDescriptions: {
                interfacing: {
                    check: 'Easy', success: true,
                    text: "Your fingertips are free. You can *feel* the world. Locks, wires, machinery—all of it speaks to you.",
                    comment: "INTERFACING – Touch is knowledge. These let you learn."
                }
            }
        },
        
        // ─────────────────────────────────────────────────────────────
        // CLOTHES - GLASSES
        // ─────────────────────────────────────────────────────────────
        pigs_glasses: {
            id: 'pigs_glasses',
            name: 'Pigs Glasses',
            category: 'clothes',
            slot: 'glasses',
            icon: '🕶️',
            modifiers: { authority: 2, empathy: -1 },
            description: "Mirrored aviator sunglasses. The kind cops wear when they want to look intimidating.",
            voiceDescriptions: {
                authority: {
                    check: 'Easy', success: true,
                    text: "Perfect. They can't see your eyes. They don't know what you're thinking. You're in control.",
                    comment: "AUTHORITY – Hide behind the mirror. Let them see only what you want them to see."
                },
                empathy: {
                    check: 'Medium', success: false,
                    text: "You can't connect with people if they can't see your eyes. You're building walls."
                }
            }
        },
        
        // ─────────────────────────────────────────────────────────────
        // TOOLS
        // ─────────────────────────────────────────────────────────────
        flashlight: {
            id: 'flashlight',
            name: 'Flashlight',
            category: 'tools',
            icon: '🔦',
            modifiers: { perception: 1, visual_calculus: 1 },
            description: "A standard-issue police flashlight. Heavy enough to double as a weapon.",
            voiceDescriptions: {
                perception: {
                    check: 'Easy', success: true,
                    text: "Light cuts through darkness. Secrets hide in shadows. This is your sword against the unknown.",
                    comment: "PERCEPTION – Point it at the truth. Force it into the light."
                }
            }
        },
        
        prybar: {
            id: 'prybar',
            name: 'Prybar',
            category: 'tools',
            icon: '🔧',
            modifiers: { physical_instrument: 2, interfacing: 1, savoir_faire: -1 },
            description: "A red-tipped prybar with 'Gaston T. Heavy Duty' engraved below the handle. Satisfyingly heavy.",
            voiceDescriptions: {
                physical_instrument: {
                    check: 'Easy', success: true,
                    text: "Oh, this is a good one. Solid steel. You could open *anything* with this. Doors. Crates. Skulls.",
                    comment: "PHYSICAL INSTRUMENT – Feel that weight? That's potential energy. Kinetic problem-solving."
                },
                savoir_faire: {
                    check: 'Easy', success: false,
                    text: "There's nothing elegant about this. It's a caveman's solution to a lockpick's problem."
                }
            }
        },
        
        tape_recorder: {
            id: 'tape_recorder',
            name: 'Tape Recorder',
            category: 'tools',
            icon: '📼',
            modifiers: { esprit_de_corps: 1, rhetoric: 1, drama: 1 },
            description: "A portable tape recorder. Good for interviews. Better for catching people in lies.",
            voiceDescriptions: {
                rhetoric: {
                    check: 'Medium', success: true,
                    text: "Record everything. Words are slippery—pin them down. Make them accountable.",
                    comment: "RHETORIC – The tape doesn't lie. People do. Let them hang themselves."
                }
            }
        },
        
        yellow_plastic_bag: {
            id: 'yellow_plastic_bag',
            name: 'Yellow Plastic Bag "Frittte!"',
            category: 'tools',
            icon: '🛍️',
            modifiers: { shivers: 1, composure: -1 },
            description: "This plastic bag has 'Frittte' (sic!) written on it. Smells of yeast and beer. Perfect for collecting tare.",
            voiceDescriptions: {
                shivers: {
                    check: 'Medium', success: true,
                    text: "The bag crinkles in the wind. It's been everywhere. Seen everything. A humble witness to the city's decay.",
                    comment: "SHIVERS – The plastic remembers. Every hand that held it. Every corner it blew through."
                },
                composure: {
                    check: 'Easy', success: false,
                    text: "You're carrying your belongings in a beer bag. This is what your life has become."
                }
            }
        },
        
        // ─────────────────────────────────────────────────────────────
        // CONSUMABLES
        // ─────────────────────────────────────────────────────────────
        cigarettes_astra: {
            id: 'cigarettes_astra',
            name: 'Astra Cigarettes',
            category: 'consumable',
            icon: '🚬',
            quantity: 5,
            duration: 10,
            modifiers: { composure: 1, volition: 1, endurance: -1 },
            description: "A pack of Astra cigarettes. The smoke steadies your nerves.",
            voiceDescriptions: {
                composure: {
                    check: 'Easy', success: true,
                    text: "Breathe it in. Let the smoke fill your lungs. Feel the calm wash over you.",
                    comment: "COMPOSURE – A moment of peace in a world of chaos. You've earned this."
                }
            },
            isConsumable: true
        },
        
        pyrholidon: {
            id: 'pyrholidon',
            name: 'Pyrholidon',
            category: 'consumable',
            icon: '💊',
            quantity: 1,
            duration: 15,
            modifiers: { logic: 2, conceptualization: 2, visual_calculus: 1, inland_empire: -2, shivers: -1 },
            description: "A nootropic compound. Makes you sharp. Cold. Calculating. The world becomes a problem to solve.",
            voiceDescriptions: {
                logic: {
                    check: 'Easy', success: true,
                    text: "Yes. Take it. Let the noise fade. Let only the *signal* remain. Pure, crystalline thought.",
                    comment: "LOGIC – Your mind becomes a scalpel. Cut away the fat. Get to the truth."
                },
                inland_empire: {
                    check: 'Hard', success: false,
                    text: "No! Don't silence us! The whispers have meaning! You need the *noise*!"
                }
            },
            isConsumable: true
        },
        
        alcohol_commodore_red: {
            id: 'alcohol_commodore_red',
            name: 'Commodore Red',
            category: 'consumable',
            icon: '🍷',
            quantity: 1,
            duration: 20,
            modifiers: { electrochemistry: 2, pain_threshold: 1, inland_empire: 1, logic: -1, hand_eye_coordination: -1 },
            description: "Cheap fortified wine. It burns going down and makes everything else hurt less.",
            voiceDescriptions: {
                electrochemistry: {
                    check: 'Easy', success: true,
                    text: "Ah, the sweet embrace of fortified wine. It's not good, but it's *yours*. Drink deep.",
                    comment: "ELECTROCHEMISTRY – The world is hard. This makes it soft. Simple math."
                },
                logic: {
                    check: 'Easy', success: false,
                    text: "You're drinking cheap wine to dull the pain of existence. This is not a solution."
                }
            },
            isConsumable: true
        },
        
        speed: {
            id: 'speed',
            name: 'Speed',
            category: 'consumable',
            icon: '💎',
            quantity: 1,
            duration: 12,
            modifiers: { reaction_speed: 3, perception: 2, volition: -2, composure: -2 },
            description: "Amphetamines. Everything moves faster. Including your heart. Including your paranoia.",
            voiceDescriptions: {
                reaction_speed: {
                    check: 'Medium', success: true,
                    text: "FASTER. You need to be FASTER. The world is moving and you need to KEEP UP.",
                    comment: "REACTION SPEED – Time dilates. You can see the bullets. Dodge the raindrops. Go go GO."
                },
                volition: {
                    check: 'Hard', success: false,
                    text: "This isn't strength. This is borrowed time. You're going to crash. You always crash."
                }
            },
            isConsumable: true
        }
    };
    
    // ═══════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════
    
    let IE = null;
    let isIEConnected = false;
    let extensionSettings = { 
        enabled: true, 
        baseHealth: 3, 
        baseMorale: 3,
        fabPosition: null,
        vitalsPosition: null,
        ledger: null
    };
    
    let equipped = { clothes: {}, tools: [], held: [] };
    let consumables = [];
    let activeEffects = [];
    let allItems = Object.assign({}, PRESET_ITEMS);
    
    let vitals = {
        health: { current: 3, max: 3 },
        morale: { current: 3, max: 3 }
    };
    
    let panelElement = null;
    let vitalsWidgetElement = null;
    let fabElement = null;
    let isPanelOpen = false;
    let currentTab = 'inventory';
    
    // Ledger state - tasks/quests journal
    let ledger = {
        officerInitials: 'HDB', // Default to Harry Du Bois, can be customized
        caseNumber: 41,
        tasks: {
            active: [],
            completed: []
        }
    };
    
    // ═══════════════════════════════════════════════════════════════
    // INVENTORY
    // ═══════════════════════════════════════════════════════════════
    
    function equipItem(itemOrId) {
        var item = typeof itemOrId === 'string' ? allItems[itemOrId] : itemOrId;
        if (!item) return null;
        
        var previousItem = null;
        
        if (item.category === 'clothes') {
            if (item.slot) {
                previousItem = equipped.clothes[item.slot] || null;
                equipped.clothes[item.slot] = item;
            }
        } else if (item.category === 'tools') {
            if (!equipped.tools.find(function(t) { return t.id === item.id; })) {
                equipped.tools.push(item);
            }
        } else if (item.category === 'held') {
            if (equipped.held.length >= 2) {
                previousItem = equipped.held.shift();
            }
            if (!equipped.held.find(function(h) { return h.id === item.id; })) {
                equipped.held.push(item);
            }
        } else if (item.category === 'consumable') {
            addConsumable(item);
            return null;
        }
        
        syncItemToIE(item, true);
        if (previousItem) syncItemToIE(previousItem, false);
        return previousItem;
    }
    
    function unequipItem(itemOrId) {
        var itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId.id;
        var removed = null;
        
        Object.keys(equipped.clothes).forEach(function(slot) {
            if (equipped.clothes[slot] && equipped.clothes[slot].id === itemId) {
                removed = equipped.clothes[slot];
                delete equipped.clothes[slot];
            }
        });
        
        if (!removed) {
            var toolIdx = equipped.tools.findIndex(function(t) { return t.id === itemId; });
            if (toolIdx !== -1) removed = equipped.tools.splice(toolIdx, 1)[0];
        }
        
        if (!removed) {
            var heldIdx = equipped.held.findIndex(function(h) { return h.id === itemId; });
            if (heldIdx !== -1) removed = equipped.held.splice(heldIdx, 1)[0];
        }
        
        if (removed) syncItemToIE(removed, false);
        renderCurrentTab();
        return removed;
    }
    
    function getEquippedItems() {
        var items = [];
        Object.values(equipped.clothes).forEach(function(item) { if (item) items.push(item); });
        items = items.concat(equipped.tools);
        items = items.concat(equipped.held);
        return items;
    }
    
    function addConsumable(itemOrId, quantity) {
        quantity = quantity || 1;
        var item = typeof itemOrId === 'string' ? allItems[itemOrId] : itemOrId;
        if (!item || item.category !== 'consumable') return;
        
        var existing = consumables.find(function(c) { return c.item.id === item.id; });
        if (existing) {
            existing.quantity += quantity;
        } else {
            consumables.push({ item: item, quantity: quantity });
        }
    }
    
    function useConsumable(itemId) {
        var consumable = consumables.find(function(c) { return c.item.id === itemId; });
        if (!consumable || consumable.quantity <= 0) return null;
        
        consumable.quantity--;
        if (consumable.quantity <= 0) {
            consumables = consumables.filter(function(c) { return c.item.id !== itemId; });
        }
        
        var effect = {
            itemId: consumable.item.id,
            item: consumable.item,
            messagesRemaining: consumable.item.duration || 10,
            modifiers: Object.assign({}, consumable.item.modifiers)
        };
        
        activeEffects.push(effect);
        syncConsumableToIE(effect, true);
        renderCurrentTab();
        return effect;
    }
    
    function getAggregatedBonuses() {
        var totals = {};
        getEquippedItems().forEach(function(item) {
            if (item.modifiers) {
                Object.keys(item.modifiers).forEach(function(skillId) {
                    totals[skillId] = (totals[skillId] || 0) + item.modifiers[skillId];
                });
            }
        });
        activeEffects.forEach(function(effect) {
            Object.keys(effect.modifiers).forEach(function(skillId) {
                totals[skillId] = (totals[skillId] || 0) + effect.modifiers[skillId];
            });
        });
        return totals;
    }
    
    function formatModifier(value) { return value > 0 ? '+' + value : '' + value; }
    
    function formatSkillName(skillId) {
        return skillId.split('_').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VITALS
    // ═══════════════════════════════════════════════════════════════
    
    function initVitals(maxHealth, maxMorale) {
        vitals.health.max = maxHealth;
        vitals.health.current = maxHealth;
        vitals.morale.max = maxMorale;
        vitals.morale.current = maxMorale;
        updateVitalsDisplay();
    }
    
    function damageHealth(amount) {
        vitals.health.current = Math.max(0, vitals.health.current - amount);
        updateVitalsDisplay();
    }
    
    function damageMorale(amount) {
        vitals.morale.current = Math.max(0, vitals.morale.current - amount);
        updateVitalsDisplay();
    }
    
    function healHealth(amount) {
        vitals.health.current = Math.min(vitals.health.max, vitals.health.current + amount);
        updateVitalsDisplay();
    }
    
    function healMorale(amount) {
        vitals.morale.current = Math.min(vitals.morale.max, vitals.morale.current + amount);
        updateVitalsDisplay();
    }
    
    // ═══════════════════════════════════════════════════════════════
    // IE INTEGRATION
    // ═══════════════════════════════════════════════════════════════
    
    function connectToInlandEmpire() {
        if (window.InlandEmpire) {
            onIEConnected(window.InlandEmpire);
            return;
        }
        
        document.addEventListener('ie:ready', function() {
            console.log('[Interfacing] IE connected');
            onIEConnected(window.InlandEmpire);
        });
        
        setTimeout(function() {
            if (!isIEConnected) {
                console.log('[Interfacing] Running standalone');
                initVitals(extensionSettings.baseHealth || 3, extensionSettings.baseMorale || 3);
            }
        }, 3000);
    }
    
    function onIEConnected(ieApi) {
        IE = ieApi;
        isIEConnected = true;
        
        document.addEventListener('ie:skill-check', onSkillCheck);
        
        var endurance = IE.getEffectiveSkillLevel ? IE.getEffectiveSkillLevel('endurance') : 2;
        var volition = IE.getEffectiveSkillLevel ? IE.getEffectiveSkillLevel('volition') : 2;
        initVitals((extensionSettings.baseHealth || 3) + endurance, (extensionSettings.baseMorale || 3) + volition);
        
        getEquippedItems().forEach(function(item) { syncItemToIE(item, true); });
    }
    
    function onSkillCheck(event) {
        var d = event.detail || {};
        if (!d.success) {
            if (d.attribute === 'PHYSIQUE' || d.attribute === 'MOTORICS') damageHealth(1);
            else damageMorale(1);
        }
        if (d.isSnakeEyes) {
            if (d.attribute === 'PHYSIQUE' || d.attribute === 'MOTORICS') damageHealth(1);
            else damageMorale(1);
        }
    }
    
    function syncItemToIE(item, isEquipping) {
        if (!IE || !IE.registerModifier) return;
        if (isEquipping && item.modifiers) {
            Object.keys(item.modifiers).forEach(function(skillId) {
                IE.registerModifier(item.id, skillId, item.modifiers[skillId]);
            });
        } else if (IE.removeModifierSource) {
            IE.removeModifierSource(item.id);
        }
    }
    
    function syncConsumableToIE(effect, isApplying) {
        if (!IE || !IE.registerModifier) return;
        var sourceId = 'consumable_' + effect.itemId;
        if (isApplying) {
            Object.keys(effect.modifiers).forEach(function(skillId) {
                IE.registerModifier(sourceId, skillId, effect.modifiers[skillId]);
            });
        } else if (IE.removeModifierSource) {
            IE.removeModifierSource(sourceId);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UI
    // ═══════════════════════════════════════════════════════════════
    
    function createFAB() {
        fabElement = document.createElement('div');
        fabElement.id = 'interfacing-fab';
        fabElement.innerHTML = '🔧';
        fabElement.title = 'Interfacing';
        
        // TOP-RIGHT corner - definitely visible
        fabElement.setAttribute('style', 
            'position: fixed; ' +
            'top: 60px; ' +
            'right: 10px; ' +
            'width: 40px; ' +
            'height: 40px; ' +
            'background: #252530; ' +
            'border: 2px solid #bfa127; ' +
            'border-radius: 8px; ' +
            'display: flex; ' +
            'align-items: center; ' +
            'justify-content: center; ' +
            'font-size: 18px; ' +
            'cursor: pointer; ' +
            'z-index: 99999; ' +
            'box-shadow: 0 2px 8px rgba(0,0,0,0.5); ' +
            'user-select: none;'
        );
        
        fabElement.addEventListener('click', function(e) {
            if (!fabElement.dataset.justDragged) {
                togglePanel();
            }
            fabElement.dataset.justDragged = '';
        });
        
        makeDraggable(fabElement, 'fabPosition');
        document.body.appendChild(fabElement);
        
        // Restore saved position
        if (extensionSettings.fabPosition) {
            fabElement.style.top = extensionSettings.fabPosition.top + 'px';
            fabElement.style.right = 'auto';
            fabElement.style.left = extensionSettings.fabPosition.left + 'px';
        }
        
        console.log('[Interfacing] FAB created at top-right');
    }
    
    function createVitalsWidget() {
        vitalsWidgetElement = document.createElement('div');
        vitalsWidgetElement.id = 'interfacing-vitals-widget';
        
        // Below FAB in top-right
        vitalsWidgetElement.setAttribute('style',
            'position: fixed; ' +
            'top: 110px; ' +
            'right: 10px; ' +
            'width: 130px; ' +
            'background: #1a1a1f; ' +
            'border: 1px solid #3a3a4a; ' +
            'border-radius: 6px; ' +
            'padding: 8px; ' +
            'z-index: 99998; ' +
            'font-family: Segoe UI, system-ui, sans-serif; ' +
            'box-shadow: 0 2px 8px rgba(0,0,0,0.3); ' +
            'cursor: move; ' +
            'user-select: none;'
        );
        
        makeDraggable(vitalsWidgetElement, 'vitalsPosition');
        
        // Restore saved position
        if (extensionSettings.vitalsPosition) {
            vitalsWidgetElement.style.top = extensionSettings.vitalsPosition.top + 'px';
            vitalsWidgetElement.style.right = 'auto';
            vitalsWidgetElement.style.left = extensionSettings.vitalsPosition.left + 'px';
        }
        
        updateVitalsDisplay();
        document.body.appendChild(vitalsWidgetElement);
        console.log('[Interfacing] Vitals widget created at top-right');
    }
    
    function makeDraggable(element, saveKey) {
        var isDragging = false;
        var startX, startY, startLeft, startTop;
        var hasMoved = false;
        
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, {passive: false});
        
        function startDrag(e) {
            isDragging = true;
            hasMoved = false;
            
            var touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            
            var rect = element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', drag, {passive: false});
            document.addEventListener('touchend', stopDrag);
        }
        
        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            var touch = e.touches ? e.touches[0] : e;
            var dx = touch.clientX - startX;
            var dy = touch.clientY - startY;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved = true;
                element.dataset.justDragged = 'true';
            }
            
            var newLeft = startLeft + dx;
            var newTop = startTop + dy;
            
            // Keep in bounds
            newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));
            
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            element.style.right = 'auto';
        }
        
        function stopDrag() {
            if (isDragging && hasMoved && saveKey) {
                extensionSettings[saveKey] = {
                    left: parseInt(element.style.left),
                    top: parseInt(element.style.top)
                };
                // Save to ST if available
                saveSettings();
            }
            
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', stopDrag);
            
            // Clear justDragged after a short delay
            setTimeout(function() {
                element.dataset.justDragged = '';
            }, 100);
        }
    }
    
    function saveSettings() {
        try {
            var context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            if (context && context.extensionSettings) {
                // Save ledger to extensionSettings
                extensionSettings.ledger = ledger;
                context.extensionSettings.interfacing = extensionSettings;
                context.saveSettingsDebounced();
            }
        } catch(e) {
            console.log('[Interfacing] Could not save settings:', e);
        }
    }
    
    function loadSettings() {
        try {
            var context = typeof SillyTavern !== 'undefined' ? SillyTavern.getContext() : null;
            if (context && context.extensionSettings && context.extensionSettings.interfacing) {
                var saved = context.extensionSettings.interfacing;
                
                // Merge saved settings
                if (saved.fabPosition) extensionSettings.fabPosition = saved.fabPosition;
                if (saved.vitalsPosition) extensionSettings.vitalsPosition = saved.vitalsPosition;
                if (saved.baseHealth) extensionSettings.baseHealth = saved.baseHealth;
                if (saved.baseMorale) extensionSettings.baseMorale = saved.baseMorale;
                
                // Load ledger
                if (saved.ledger) {
                    ledger = saved.ledger;
                    // Ensure arrays exist
                    if (!ledger.tasks) ledger.tasks = { active: [], completed: [] };
                    if (!ledger.tasks.active) ledger.tasks.active = [];
                    if (!ledger.tasks.completed) ledger.tasks.completed = [];
                }
                
                console.log('[Interfacing] Settings loaded');
            }
        } catch(e) {
            console.log('[Interfacing] Could not load settings:', e);
        }
    }
    
    function updateVitalsDisplay() {
        if (!vitalsWidgetElement) return;
        var hp = (vitals.health.current / vitals.health.max) * 100;
        var mp = (vitals.morale.current / vitals.morale.max) * 100;
        var hCrit = vitals.health.current <= vitals.health.max * 0.25;
        var mCrit = vitals.morale.current <= vitals.morale.max * 0.25;
        
        // DE colors: Health #110e05 (dark amber), Morale #0d738a (teal)
        var healthColor = hCrit ? '#ff4444' : '#c4a35a'; // Brighter amber for visibility, red when critical
        var moraleColor = mCrit ? '#ff4444' : '#0d738a'; // DE teal, red when critical
        
        vitalsWidgetElement.innerHTML = 
            '<div style="margin-bottom:6px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:2px;">' +
                    '<span>HEALTH</span><span>' + vitals.health.current + '/' + vitals.health.max + '</span>' +
                '</div>' +
                '<div style="background:#1a1510;border-radius:2px;height:8px;overflow:hidden;">' +
                    '<div style="background:' + healthColor + ';height:100%;width:' + hp + '%;transition:width 0.3s;' + (hCrit ? 'animation:pulse 1s infinite;' : '') + '"></div>' +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:#888;margin-bottom:2px;">' +
                    '<span>MORALE</span><span>' + vitals.morale.current + '/' + vitals.morale.max + '</span>' +
                '</div>' +
                '<div style="background:#0a1a1d;border-radius:2px;height:8px;overflow:hidden;">' +
                    '<div style="background:' + moraleColor + ';height:100%;width:' + mp + '%;transition:width 0.3s;' + (mCrit ? 'animation:pulse 1s infinite;' : '') + '"></div>' +
                '</div>' +
            '</div>';
    }
    
    function createPanel() {
        panelElement = document.createElement('div');
        panelElement.id = 'interfacing-panel';
        panelElement.className = 'interfacing-panel hidden';
        // Inline styles as fallback
        panelElement.style.cssText = 'position:fixed;top:100px;left:60px;width:340px;max-height:70vh;background:#1a1a1f;border:1px solid #3a3a4a;border-radius:8px;z-index:100000;font-family:Segoe UI,system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:none;flex-direction:column;overflow:hidden;';
        
        panelElement.innerHTML = 
            '<div class="interfacing-panel-header">' +
                '<span class="interfacing-panel-icon">🔧</span>' +
                '<span class="interfacing-panel-title">INTERFACING</span>' +
                '<button class="interfacing-panel-close">×</button>' +
            '</div>' +
            '<div class="interfacing-tabs">' +
                '<button class="interfacing-tab active" data-tab="inventory">📦</button>' +
                '<button class="interfacing-tab" data-tab="vitals">💔</button>' +
                '<button class="interfacing-tab" data-tab="ledger">📒</button>' +
            '</div>' +
            '<div class="interfacing-panel-content"></div>';
        
        panelElement.querySelector('.interfacing-panel-close').addEventListener('click', hidePanel);
        panelElement.querySelectorAll('.interfacing-tab').forEach(function(tab) {
            tab.addEventListener('click', function() { switchTab(tab.dataset.tab); });
        });
        
        document.body.appendChild(panelElement);
        renderCurrentTab();
    }
    
    function switchTab(tabId) {
        currentTab = tabId;
        panelElement.querySelectorAll('.interfacing-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        renderCurrentTab();
    }
    
    function renderCurrentTab() {
        if (!panelElement) return;
        var content = panelElement.querySelector('.interfacing-panel-content');
        if (currentTab === 'inventory') {
            content.innerHTML = renderInventoryTab();
            attachInventoryListeners(content);
        } else if (currentTab === 'vitals') {
            content.innerHTML = renderVitalsTab();
            attachVitalsListeners(content);
        } else if (currentTab === 'ledger') {
            content.innerHTML = renderLedgerTab();
            attachLedgerListeners(content);
        }
    }
    
    function renderInventoryTab() {
        var bonuses = getAggregatedBonuses();
        var html = '<div class="inventory-tab">';
        
        html += '<section class="inventory-section"><h3>// EQUIPPED</h3><div class="equipped-grid">';
        html += renderEquippedCategory('clothes', '👔', 'Clothes');
        html += renderEquippedCategory('tools', '🔧', 'Tools');
        html += renderEquippedCategory('held', '✋', 'Held');
        html += '</div></section>';
        
        html += '<section class="inventory-section bonuses-section"><h3>// BONUSES FROM ITEMS</h3>';
        html += '<div class="bonuses-list">' + renderBonuses(bonuses) + '</div></section>';
        
        html += '<section class="inventory-section"><h3>// CONSUMABLES</h3>';
        html += '<div class="consumables-list">' + renderConsumables() + '</div></section>';
        
        html += '<section class="inventory-section">';
        html += '<button class="add-item-btn wide" data-action="browse-presets">📋 Browse Presets</button>';
        html += '</section></div>';
        
        return html;
    }
    
    function renderEquippedCategory(category, icon, label) {
        var items = getEquippedItems().filter(function(i) { return i.category === category; });
        var html = '<div class="equipped-category"><div class="category-header">' +
            '<span class="category-icon">' + icon + '</span><span class="category-label">' + label + '</span></div>' +
            '<div class="equipped-items">';
        
        if (items.length === 0) {
            html += '<div class="empty-slot">Empty</div>';
        } else {
            items.forEach(function(item) {
                var mods = Object.keys(item.modifiers || {}).map(function(k) {
                    return formatModifier(item.modifiers[k]) + ' ' + formatSkillName(k);
                }).join(', ');
                html += '<div class="equipped-item"><div class="item-name">' + item.name + '</div>' +
                    '<div class="item-modifiers">' + mods + '</div>' +
                    '<button class="item-remove" data-action="unequip" data-item-id="' + item.id + '">×</button></div>';
            });
        }
        html += '</div></div>';
        return html;
    }
    
    function renderBonuses(bonuses) {
        var entries = Object.entries(bonuses).sort(function(a, b) { return b[1] - a[1]; });
        if (entries.length === 0) return '<div class="no-bonuses">No equipment bonuses</div>';
        return entries.map(function(e) {
            var cls = e[1] > 0 ? 'bonus-positive' : 'bonus-negative';
            return '<div class="bonus-row ' + cls + '"><span class="bonus-skill">' + formatSkillName(e[0]) + 
                '</span><span class="bonus-value">' + formatModifier(e[1]) + '</span></div>';
        }).join('');
    }
    
    function renderConsumables() {
        if (consumables.length === 0 && activeEffects.length === 0) {
            return '<div class="no-consumables">No consumables</div>';
        }
        var html = '';
        activeEffects.forEach(function(e) {
            html += '<div class="consumable-item active"><span class="consumable-icon">⚡</span>' +
                '<span class="consumable-name">' + e.item.name + '</span>' +
                '<span class="consumable-duration">' + e.messagesRemaining + ' msgs</span></div>';
        });
        consumables.forEach(function(c) {
            html += '<div class="consumable-item"><span class="consumable-icon">💊</span>' +
                '<span class="consumable-name">' + c.item.name + '</span>' +
                '<span class="consumable-quantity">×' + c.quantity + '</span>' +
                '<button class="consumable-use" data-action="use" data-item-id="' + c.item.id + '">Use</button></div>';
        });
        return html;
    }
    
    function renderVitalsTab() {
        var hp = (vitals.health.current / vitals.health.max) * 100;
        var mp = (vitals.morale.current / vitals.morale.max) * 100;
        // Use DE colors
        var healthColor = '#c4a35a';
        var moraleColor = '#0d738a';
        return '<div class="vitals-tab">' +
            '<section class="vitals-section"><h3>// HEALTH</h3>' +
            '<div class="vital-display health"><div class="vital-bar-large" style="background:#1a1510;">' +
            '<div class="vital-fill" style="width:' + hp + '%;background:' + healthColor + ';"></div></div>' +
            '<div class="vital-numbers">' + vitals.health.current + ' / ' + vitals.health.max + '</div></div>' +
            '<p class="vital-description">Physical damage. When this reaches zero, you die.</p>' +
            '<div class="vital-controls"><button data-action="damage-health">−1</button>' +
            '<button data-action="heal-health">+1</button></div></section>' +
            '<section class="vitals-section"><h3>// MORALE</h3>' +
            '<div class="vital-display morale"><div class="vital-bar-large" style="background:#0a1a1d;">' +
            '<div class="vital-fill" style="width:' + mp + '%;background:' + moraleColor + ';"></div></div>' +
            '<div class="vital-numbers">' + vitals.morale.current + ' / ' + vitals.morale.max + '</div></div>' +
            '<p class="vital-description">Psychological damage. When this reaches zero, you give up.</p>' +
            '<div class="vital-controls"><button data-action="damage-morale">−1</button>' +
            '<button data-action="heal-morale">+1</button></div></section></div>';
    }
    
    function renderLedgerTab() {
        var html = '<div class="ledger-tab" style="padding:12px;">';
        
        // Case header
        html += '<div class="ledger-header" style="margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #3a3a4a;">';
        html += '<div style="font-size:10px;color:#666;text-transform:uppercase;">Case File</div>';
        html += '<div style="font-size:14px;color:#c4a35a;font-weight:bold;">' + ledger.officerInitials + ledger.caseNumber.toString().padStart(3, '0') + '</div>';
        html += '</div>';
        
        // Active tasks
        html += '<section class="ledger-section">';
        html += '<h3 style="font-size:11px;color:#888;margin:0 0 8px 0;text-transform:uppercase;">// Active Tasks</h3>';
        
        if (ledger.tasks.active.length === 0) {
            html += '<div style="color:#555;font-style:italic;font-size:12px;">No active tasks</div>';
        } else {
            ledger.tasks.active.forEach(function(task, idx) {
                html += '<div class="ledger-task" style="background:#252530;border-radius:4px;padding:8px;margin-bottom:6px;border-left:3px solid #c4a35a;">';
                html += '<div style="display:flex;justify-content:space-between;align-items:start;">';
                html += '<span style="color:#ddd;font-size:12px;">' + task.text + '</span>';
                html += '<button data-action="complete-task" data-idx="' + idx + '" style="background:#2a4a2a;border:none;color:#6a6;padding:2px 6px;border-radius:3px;cursor:pointer;font-size:10px;">✓</button>';
                html += '</div>';
                if (task.notes) {
                    html += '<div style="color:#888;font-size:10px;margin-top:4px;font-style:italic;">' + task.notes + '</div>';
                }
                html += '</div>';
            });
        }
        html += '</section>';
        
        // Completed tasks (collapsed by default if many)
        html += '<section class="ledger-section" style="margin-top:12px;">';
        html += '<h3 style="font-size:11px;color:#666;margin:0 0 8px 0;text-transform:uppercase;">// Completed (' + ledger.tasks.completed.length + ')</h3>';
        
        if (ledger.tasks.completed.length > 0) {
            var showCount = Math.min(5, ledger.tasks.completed.length);
            ledger.tasks.completed.slice(-showCount).reverse().forEach(function(task) {
                html += '<div style="color:#555;font-size:11px;text-decoration:line-through;margin-bottom:4px;">' + task.text + '</div>';
            });
            if (ledger.tasks.completed.length > 5) {
                html += '<div style="color:#444;font-size:10px;">...and ' + (ledger.tasks.completed.length - 5) + ' more</div>';
            }
        }
        html += '</section>';
        
        // Add task input
        html += '<div class="ledger-add" style="margin-top:12px;padding-top:12px;border-top:1px solid #3a3a4a;">';
        html += '<input type="text" id="ledger-new-task" placeholder="New task..." style="width:100%;background:#252530;border:1px solid #3a3a4a;border-radius:4px;padding:8px;color:#ddd;font-size:12px;box-sizing:border-box;">';
        html += '<button data-action="add-task" style="width:100%;margin-top:6px;background:#3a3a4a;border:none;color:#aaa;padding:8px;border-radius:4px;cursor:pointer;font-size:11px;">+ Add Task</button>';
        html += '</div>';
        
        // Officer settings
        html += '<div class="ledger-settings" style="margin-top:12px;padding-top:12px;border-top:1px solid #3a3a4a;">';
        html += '<div style="font-size:10px;color:#555;margin-bottom:6px;">Officer Initials</div>';
        html += '<input type="text" id="ledger-initials" value="' + ledger.officerInitials + '" maxlength="4" style="width:60px;background:#252530;border:1px solid #3a3a4a;border-radius:4px;padding:4px 8px;color:#c4a35a;font-size:12px;text-transform:uppercase;">';
        html += '</div>';
        
        html += '</div>';
        return html;
    }
    
    function attachLedgerListeners(content) {
        // Add task
        var addBtn = content.querySelector('[data-action="add-task"]');
        var input = content.querySelector('#ledger-new-task');
        
        if (addBtn && input) {
            addBtn.addEventListener('click', function() {
                var text = input.value.trim();
                if (text) {
                    ledger.tasks.active.push({ text: text, addedAt: Date.now() });
                    input.value = '';
                    saveSettings();
                    renderCurrentTab();
                }
            });
            
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addBtn.click();
                }
            });
        }
        
        // Complete task
        content.querySelectorAll('[data-action="complete-task"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.idx);
                var task = ledger.tasks.active.splice(idx, 1)[0];
                if (task) {
                    task.completedAt = Date.now();
                    ledger.tasks.completed.push(task);
                    saveSettings();
                    renderCurrentTab();
                }
            });
        });
        
        // Update initials
        var initialsInput = content.querySelector('#ledger-initials');
        if (initialsInput) {
            initialsInput.addEventListener('change', function() {
                ledger.officerInitials = initialsInput.value.toUpperCase().substring(0, 4) || 'HDB';
                saveSettings();
                renderCurrentTab();
            });
        }
    }
    
    function attachInventoryListeners(content) {
        content.querySelectorAll('[data-action="unequip"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) { unequipItem(e.target.dataset.itemId); });
        });
        content.querySelectorAll('[data-action="use"]').forEach(function(btn) {
            btn.addEventListener('click', function(e) { useConsumable(e.target.dataset.itemId); });
        });
        var pb = content.querySelector('[data-action="browse-presets"]');
        if (pb) pb.addEventListener('click', showPresetsDialog);
    }
    
    function attachVitalsListeners(content) {
        var dh = content.querySelector('[data-action="damage-health"]');
        var hh = content.querySelector('[data-action="heal-health"]');
        var dm = content.querySelector('[data-action="damage-morale"]');
        var hm = content.querySelector('[data-action="heal-morale"]');
        if (dh) dh.addEventListener('click', function() { damageHealth(1); renderCurrentTab(); });
        if (hh) hh.addEventListener('click', function() { healHealth(1); renderCurrentTab(); });
        if (dm) dm.addEventListener('click', function() { damageMorale(1); renderCurrentTab(); });
        if (hm) hm.addEventListener('click', function() { healMorale(1); renderCurrentTab(); });
    }
    
    function showPresetsDialog() {
        var modal = document.createElement('div');
        modal.id = 'interfacing-presets-modal';
        modal.className = 'interfacing-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:200000;';
        
        // Group items by category
        var clothes = [];
        var tools = [];
        var consumables = [];
        
        Object.values(PRESET_ITEMS).forEach(function(item) {
            if (item.category === 'clothes') clothes.push(item);
            else if (item.category === 'tools') tools.push(item);
            else if (item.category === 'consumable') consumables.push(item);
        });
        
        function renderItemCard(item) {
            var mods = Object.entries(item.modifiers || {}).map(function(entry) {
                var k = entry[0], v = entry[1];
                var color = v > 0 ? '#4a9' : '#a54';
                return '<span style="color:' + color + ';">' + formatModifier(v) + ' ' + formatSkillName(k) + '</span>';
            }).join(', ');
            
            var slotLabel = item.slot ? item.slot.toUpperCase() : (item.isConsumable ? 'USE' : '');
            
            return '<div class="preset-card" data-item-id="' + item.id + '">' +
                '<div class="preset-card-header">' +
                    '<span class="preset-icon">' + (item.icon || '📦') + '</span>' +
                    '<span class="preset-name">' + item.name + '</span>' +
                    '<span class="preset-slot">' + slotLabel + '</span>' +
                '</div>' +
                '<div class="preset-mods">' + mods + '</div>' +
                '</div>';
        }
        
        function renderCategory(title, items) {
            if (items.length === 0) return '';
            return '<div class="preset-category-section">' +
                '<h3 class="preset-category-title">' + title + '</h3>' +
                '<div class="preset-cards">' + items.map(renderItemCard).join('') + '</div>' +
                '</div>';
        }
        
        var content = renderCategory('CLOTHES', clothes) +
                      renderCategory('TOOLS', tools) +
                      renderCategory('CONSUMABLES', consumables);
        
        modal.innerHTML = '<div class="interfacing-modal-content" style="width:90%;max-width:500px;max-height:80vh;background:#1a1a1f;border:1px solid #3a3a4a;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;">' +
            '<div class="interfacing-modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#252530;border-bottom:1px solid #3a3a4a;">' +
                '<span style="color:#bfa127;font-weight:bold;font-size:14px;">📦 BROWSE ITEMS</span>' +
                '<button class="interfacing-modal-close" style="background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:0;line-height:1;">×</button>' +
            '</div>' +
            '<div class="interfacing-modal-body" style="padding:12px;overflow-y:auto;flex:1;">' + content + '</div>' +
            '<div id="preset-detail-panel" style="display:none;padding:12px;background:#252530;border-top:1px solid #3a3a4a;max-height:50%;overflow-y:auto;"></div>' +
        '</div>';
        
        // Close button
        modal.querySelector('.interfacing-modal-close').addEventListener('click', function() { 
            modal.remove(); 
        });
        
        // Click outside to close
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
        
        // ESC to close
        function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        }
        document.addEventListener('keydown', escHandler);
        
        // Item card clicks - show detail
        modal.querySelectorAll('.preset-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var itemId = card.dataset.itemId;
                showItemDetail(itemId, modal);
                
                // Highlight selected
                modal.querySelectorAll('.preset-card').forEach(function(c) { c.classList.remove('selected'); });
                card.classList.add('selected');
            });
        });
        
        document.body.appendChild(modal);
    }
    
    function showItemDetail(itemId, modal) {
        var item = PRESET_ITEMS[itemId];
        if (!item) return;
        
        var detailPanel = modal.querySelector('#preset-detail-panel');
        if (!detailPanel) return;
        
        // Find the primary skill (highest positive modifier)
        var primarySkill = null;
        var highestMod = 0;
        Object.entries(item.modifiers || {}).forEach(function(entry) {
            if (entry[1] > highestMod) {
                highestMod = entry[1];
                primarySkill = entry[0];
            }
        });
        
        // Build voice descriptions
        var voiceHtml = '';
        if (item.voiceDescriptions) {
            Object.entries(item.voiceDescriptions).forEach(function(entry) {
                var skillId = entry[0];
                var voice = entry[1];
                var skillName = formatSkillName(skillId).toUpperCase();
                var checkResult = voice.success ? 'Success' : 'Failure';
                var checkColor = voice.success ? '#4a9' : '#a54';
                
                voiceHtml += '<div class="voice-block" style="margin-top:12px;padding:10px;background:#1a1a1f;border-radius:4px;border-left:3px solid ' + checkColor + ';">';
                voiceHtml += '<div style="font-size:10px;margin-bottom:6px;">';
                voiceHtml += '<span style="color:' + checkColor + ';">' + skillName + '</span>';
                voiceHtml += ' <span style="color:#666;">[' + voice.check + ': ' + checkResult + ']</span>';
                voiceHtml += '</div>';
                voiceHtml += '<div style="color:#ccc;font-size:12px;font-style:italic;line-height:1.4;">' + voice.text + '</div>';
                
                if (voice.comment) {
                    voiceHtml += '<div style="color:#888;font-size:11px;margin-top:8px;padding-top:8px;border-top:1px dashed #333;">' + voice.comment + '</div>';
                }
                voiceHtml += '</div>';
            });
        }
        
        // Build modifiers list
        var modsHtml = Object.entries(item.modifiers || {}).map(function(entry) {
            var color = entry[1] > 0 ? '#4a9' : '#a54';
            return '<span style="color:' + color + ';margin-right:8px;">' + formatModifier(entry[1]) + ' ' + formatSkillName(entry[0]) + '</span>';
        }).join('');
        
        // Action button
        var actionText = item.isConsumable ? 'Use' : 'Equip';
        var actionColor = item.isConsumable ? '#6449af' : '#bfa127';
        
        detailPanel.innerHTML = 
            '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">' +
                '<div style="font-size:32px;">' + (item.icon || '📦') + '</div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:16px;font-weight:bold;color:#e8e8e8;">' + item.name + '</div>' +
                    '<div style="font-size:10px;color:#666;text-transform:uppercase;margin-top:2px;">' + (item.slot || item.category) + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="color:#a0a0a0;font-size:12px;line-height:1.5;margin-bottom:12px;">' + (item.description || '') + '</div>' +
            '<div style="margin-bottom:12px;">' + modsHtml + '</div>' +
            voiceHtml +
            '<button class="preset-action-btn" data-item-id="' + itemId + '" style="width:100%;margin-top:12px;padding:10px;background:' + actionColor + ';border:none;color:#000;font-weight:bold;border-radius:4px;cursor:pointer;">' + actionText + '</button>';
        
        // Bind action button
        detailPanel.querySelector('.preset-action-btn').addEventListener('click', function(e) {
            var id = e.target.dataset.itemId;
            var itm = PRESET_ITEMS[id];
            if (itm && itm.isConsumable) {
                useConsumable(id);
            } else {
                equipItem(id);
            }
            modal.remove();
            renderCurrentTab();
            updateVitalsDisplay();
        });
        
        detailPanel.style.display = 'block';
    }
    
    function showPanel() { 
        if (panelElement) { 
            panelElement.classList.remove('hidden'); 
            panelElement.style.display = 'flex';
            isPanelOpen = true; 
            renderCurrentTab(); 
        } 
    }
    function hidePanel() { 
        if (panelElement) { 
            panelElement.classList.add('hidden'); 
            panelElement.style.display = 'none';
            isPanelOpen = false; 
        } 
    }
    function togglePanel() { isPanelOpen ? hidePanel() : showPanel(); }
    
    // ═══════════════════════════════════════════════════════════════
    // ST EXTENSION PANEL (like IE does)
    // ═══════════════════════════════════════════════════════════════
    
    function addExtensionPanel() {
        const container = document.getElementById('extensions_settings');
        if (!container) {
            console.log('[Interfacing] extensions_settings not found');
            return;
        }
        
        const settingsHtml = `
            <div class="inline-drawer" id="interfacing-extension-settings">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🔧 Interfacing</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div style="padding: 10px;">
                        <p style="margin: 0 0 10px; color: #888;">Disco Elysium gameplay systems.</p>
                        <label class="checkbox_label">
                            <input type="checkbox" id="interfacing-ext-enabled" checked />
                            <span>Enable Interfacing</span>
                        </label>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <button id="interfacing-open-panel-btn" class="menu_button" style="width: 100%;">
                            Open Panel
                        </button>
                        <hr style="margin: 10px 0; border-color: #444;">
                        <small style="color: #666;">FAB appears at bottom-right of screen.</small>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', settingsHtml);
        
        // Bind open panel button
        document.getElementById('interfacing-open-panel-btn')?.addEventListener('click', function() {
            showPanel();
        });
        
        console.log('[Interfacing] Extension panel added');
    }
    
    // ═══════════════════════════════════════════════════════════════
    // INIT - Matching IE's pattern exactly
    // ═══════════════════════════════════════════════════════════════
    
    async function init() {
        console.log('[Interfacing] Initializing...');
        
        try {
            // Load CSS explicitly like IE does
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${extensionFolderPath}/styles.css`;
            document.head.appendChild(link);
            console.log('[Interfacing] CSS loaded');
            
            // Load saved settings
            loadSettings();
            
            // Create extension settings in ST's extension panel (like IE)
            addExtensionPanel();
            
            // Create UI elements
            createFAB();
            createVitalsWidget();
            createPanel();
            
            // Try to connect to Inland Empire
            connectToInlandEmpire();
            
            console.log('[Interfacing] Ready!');
            
            if (typeof toastr !== 'undefined') {
                toastr.success('Interfacing loaded!', 'Interfacing', {timeOut: 3000});
            }
        } catch (error) {
            console.error('[Interfacing] Failed to initialize:', error);
            if (typeof toastr !== 'undefined') {
                toastr.error('Init failed: ' + error.message, 'Interfacing');
            }
        }
    }
    
    // Use jQuery ready like IE does
    jQuery(async () => {
        await init();
    });
    
})();
