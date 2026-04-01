window.GAMES_CONFIG = {
    'standard': {
        name: 'Standard',
        dice: {
            'd4': { sides: [1, 2, 3, 4], image: 'images/d4.png' },
            'd6': { sides: [1, 2, 3, 4, 5, 6], image: 'images/d6.png' },
            'd8': { sides: [1, 2, 3, 4, 5, 6, 7, 8], image: 'images/d8.png' },
            'd10': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], image: 'images/d10.png' },
            'd10 luck': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], image: 'images/d10.png', aura: '#ffd700' },
            'd12': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], image: 'images/d12.png' },
            'd20': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], image: 'images/d20.png' },
            'coin': { sides: ['Heads', 'Tails'], image: 'images/d2.png' }
        },
        difficultyUI: 'target_and_mode',
        layout: 'standard',
        evaluator: function(dieEl, finalFace) {
            dieEl.classList.remove('failed');
            
            const diffControl = document.getElementById('difficulty-control');
            if (diffControl.classList.contains('hidden') || isNaN(finalFace)) return;

            const opRadio = document.querySelector('input[name="diff-op"]:checked');
            const target = parseFloat(document.getElementById('diff-target').value);
            if (!opRadio || isNaN(target)) return;

            const op = opRadio.value;
            const numericFace = parseFloat(finalFace);
            
            if (op === '>=') {
                if (numericFace < target) dieEl.classList.add('failed');
            } else if (op === '<=') {
                if (numericFace > target) dieEl.classList.add('failed');
            }
        }
    },
    'warcry': {
        name: 'Warcry',
        dice: {
            'd6': { 
                sides: [1, 2, 3, 4, 5, { value: 6, label: '6', type: 'crit' }], 
                image: 'images/d6.png' 
            },
            'd66': { 
                sides: [
                    11, 12, 13, 14, 15, 16,
                    21, 22, 23, 24, 25, 26,
                    31, 32, 33, 34, 35, 36,
                    41, 42, 43, 44, 45, 46,
                    51, 52, 53, 54, 55, 56,
                    61, 62, 63, 64, 65, 66
                ], 
                image: 'images/d6.png', 
                aura: '#ff4444' 
            }
        },
        difficultyUI: 'warcry',
        layout: 'standard',
        evaluator: function(dieEl, finalFace) {
            dieEl.classList.remove('failed');
            
            const diffControl = document.getElementById('difficulty-control');
            if (diffControl.classList.contains('hidden')) return;

            // d66 is a table roll and doesn't fail based on the target
            if (dieEl.dataset.type === 'd66') return;

            const warcryTargetEl = document.querySelector('input[name="warcry-target"]:checked');
            if (!warcryTargetEl) return;
            const target = parseFloat(warcryTargetEl.value);
            if (isNaN(target)) return;

            const numericFace = typeof finalFace === 'object' ? finalFace.value : parseFloat(finalFace);
            if (isNaN(numericFace)) return;
            
            if (numericFace < target) {
                dieEl.classList.add('failed');
            }
        }
    },
    'fallout': {
        name: 'Fallout',
        dice: {
            'd10': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], image: 'images/d10.png' },
            'd10 luck': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], image: 'images/d10.png', aura: '#ffd700' }
        },
        difficultyUI: 'target_only',
        layout: 'standard',
        evaluator: function(dieEl, finalFace) {
            dieEl.classList.remove('failed');
            
            const diffControl = document.getElementById('difficulty-control');
            if (diffControl.classList.contains('hidden') || isNaN(finalFace)) return;

            const target = parseFloat(document.getElementById('diff-target').value);
            if (isNaN(target)) return;

            const numericFace = parseFloat(finalFace);
            
            // Fallout is strictly "roll under or equal to target"
            if (numericFace > target) {
                dieEl.classList.add('failed');
            }
        }
    },
    'oathsworn': {
        name: 'Oathsworn',
        dice: {
            'White': { sides: [{value:0, label:'', type:'blank'}, {value:0, label:'', type:'blank'}, 1, 1, 2, {value:2, label:'{2}'}], image: 'images/d6.png', aura: '#ffffff' },
            'Yellow': { sides: [{value:0, label:'', type:'blank'}, {value:0, label:'', type:'blank'}, 1, 2, 3, {value:3, label:'{3}'}], image: 'images/d6.png', aura: '#ffd700' },
            'Red': { sides: [{value:0, label:'', type:'blank'}, {value:0, label:'', type:'blank'}, 2, 3, 3, {value:4, label:'{4}'}], image: 'images/d6.png', aura: '#ff4444' },
            'Black': { sides: [{value:0, label:'', type:'blank'}, {value:0, label:'', type:'blank'}, 3, 3, 4, {value:5, label:'{5}'}], image: 'images/d6.png', aura: '#444444' }
        },
        difficultyUI: 'none',
        layout: 'standard',
        showTotal: true,
        evaluator: function(dieEl, finalFace) {
            const allDice = document.querySelectorAll('#dice-board .die');
            let blankCount = 0;
            let total = 0;
            let isRolling = false;
            
            allDice.forEach(d => {
                if (d.classList.contains('rolling')) {
                    isRolling = true;
                    return; // Skip dice that haven't settled yet
                }
                
                // Only count blanks for dice that were part of the main "Roll" button press
                if (d.dataset.isBaseRoll === 'true' && d.classList.contains('blank')) {
                    blankCount++;
                }
                
                const valEl = d.querySelector('.die-value');
                if (valEl && valEl.textContent) {
                    // Extract number from labels like '{2}' or '3'
                    const numMatch = valEl.textContent.match(/\d+/);
                    if (numMatch) total += parseInt(numMatch[0]);
                }
            });
            
            const totalValEl = document.getElementById('roll-total-value');
            if (totalValEl) {
                totalValEl.textContent = isRolling ? '...' : (blankCount >= 2 ? `${total} (Failed)` : total);
            }
            
            if (blankCount >= 2) {
                allDice.forEach(d => d.classList.add('failed'));
            } else {
                allDice.forEach(d => d.classList.remove('failed'));
            }
        }
    },
    'dnd': {
        name: 'Dungeons & Dragons',
        dice: {
            'd20': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], image: 'images/d20.png' },
            'd4': { sides: [1, 2, 3, 4], image: 'images/d4.png' },
            'd6': { sides: [1, 2, 3, 4, 5, 6], image: 'images/d6.png' },
            'd8': { sides: [1, 2, 3, 4, 5, 6, 7, 8], image: 'images/d8.png' },
            'd10': { sides: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], image: 'images/d10.png' },
            'd12': { sides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], image: 'images/d12.png' }
        },
        difficultyUI: 'target_only',
        layout: 'default_die',
        defaultDie: 'd20',
        showTotal: true, // Enable the total UI container
        evaluator: function(dieEl, finalFace) {
            // 1. Evaluate difficulty & crits ONLY for d20s
            if (dieEl.dataset.type === 'd20') {
                dieEl.classList.remove('failed', 'success');
                const diffControl = document.getElementById('difficulty-control');
                
                if (!diffControl.classList.contains('hidden')) {
                    const targetVal = parseFloat(document.getElementById('diff-target').value);
                    const globalBonusEl = document.getElementById('global-bonus-val'); // Updated ID
                    const bonusVal = globalBonusEl ? (parseFloat(globalBonusEl.dataset.bonus) || 0) : 0;
                    const numericFace = typeof finalFace === 'object' ? finalFace.value : parseFloat(finalFace);
                    
                    if (!isNaN(numericFace) && !isNaN(targetVal)) {
                        if (numericFace === 20) {
                            dieEl.classList.add('success');
                        } else if (numericFace === 1) {
                            dieEl.classList.add('failed');
                        } else {
                            if ((numericFace + bonusVal) < targetVal) {
                                dieEl.classList.add('failed');
                            }
                        }
                    }
                }
            }

            // 2. Calculate the total value for all non-d20 dice
            const allDice = document.querySelectorAll('#dice-board .die');
            let total = 0;
            let isRolling = false;
            let nonD20Count = 0;
            
            allDice.forEach(d => {
                if (d.dataset.type !== 'd20') {
                    nonD20Count++;
                    if (d.classList.contains('rolling')) {
                        isRolling = true;
                    } else {
                        const valEl = d.querySelector('.die-value');
                        if (valEl && valEl.textContent) {
                            const val = parseInt(valEl.textContent);
                            if (!isNaN(val)) total += val;
                        }
                    }
                }
            });
            
            const totalValEl = document.getElementById('roll-total-value');
            const totalContainer = document.getElementById('roll-total-container');
            
            if (totalValEl && totalContainer) {
                // Always keep the total visible to prevent layout jumping
                totalContainer.style.display = 'block'; 
                totalValEl.textContent = isRolling ? '...' : total;
            }
        }
    }
};
