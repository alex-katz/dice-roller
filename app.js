document.addEventListener('DOMContentLoaded', () => {
    let config = {};
    let currentGame = null;
    const controlsContainer = document.getElementById('controls-container');
    const gameSelectBtn = document.getElementById('game-select-btn');
    const currentGameName = document.getElementById('current-game-name');
    const gameModal = document.getElementById('game-modal');
    const gameSearch = document.getElementById('game-search');
    const gameList = document.getElementById('game-list');
    const gameModalCloseX = document.getElementById('game-modal-close-x');
    const diceBoard = document.getElementById('dice-board');
    const primaryZone = document.getElementById('primary-dice-zone');
    const secondaryZone = document.getElementById('secondary-dice-zone');
    const boardDivider = document.getElementById('board-divider');
    const rollBtn = document.getElementById('roll-btn');

    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const sidebar = document.getElementById('sidebar');

    mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
    });

    function recheckAllDice() {
        const allDice = document.querySelectorAll('#dice-board .die');
        allDice.forEach(dieEl => {
            if (dieEl.classList.contains('rolling')) return; 
            
            // Re-evaluating requires re-running the evaluator. 
            // Note: For fully accurate re-evaluation of complex faces, the game evaluator 
            // relies on the DOM classes (.crit, .blank) or the text value.
            const valueEl = dieEl.querySelector('.die-value');
            if (valueEl && valueEl.textContent && currentGame && currentGame.evaluator) {
                // Pass text content as fallback during global rechecks
                currentGame.evaluator(dieEl, valueEl.textContent);
            }
        });
    }

    // Helper function to animate and roll a single die
    function rollSingleDie(dieEl, sides) {
        if (dieEl.classList.contains('rolling')) return; // prevent overlapping rolls

        dieEl.classList.add('rolling');
        dieEl.classList.remove('failed', 'crit', 'blank', 'success'); // Reset states
        const valueEl = dieEl.querySelector('.die-value');
        
        const rollInterval = setInterval(() => {
            const randomFace = sides[Math.floor(Math.random() * sides.length)];
            valueEl.textContent = typeof randomFace === 'object' ? (randomFace.label !== undefined ? randomFace.label : randomFace.value) : randomFace;
        }, 50);

        setTimeout(() => {
            clearInterval(rollInterval);
            dieEl.classList.remove('rolling');
            
            const finalFace = sides[Math.floor(Math.random() * sides.length)];
            const displayVal = typeof finalFace === 'object' ? (finalFace.label !== undefined ? finalFace.label : finalFace.value) : finalFace;
            valueEl.textContent = displayVal;
            
            // Apply visual hooks if the face has a type
            if (typeof finalFace === 'object' && finalFace.type) {
                dieEl.classList.add(finalFace.type);
            }
            
            if (currentGame && currentGame.evaluator) {
                currentGame.evaluator(dieEl, finalFace);
            }
        }, 800 + Math.random() * 400);
    }

    // Difficulty UI logic
    const diffToggleBtn = document.getElementById('diff-toggle-btn');
    const diffControl = document.getElementById('difficulty-control');
    const diffRadios = document.querySelectorAll('input[name="diff-op"]');

    diffToggleBtn.addEventListener('click', () => {
        diffControl.classList.toggle('hidden');
        diffToggleBtn.classList.toggle('active');
        document.body.classList.toggle('diff-active', !diffControl.classList.contains('hidden'));
        recheckAllDice();
    });

    diffRadios.forEach(radio => {
        radio.addEventListener('change', recheckAllDice);
    });

    const diffTarget = document.getElementById('diff-target');
    const diffValDisplay = document.getElementById('diff-val-display');
    diffTarget.addEventListener('input', (e) => {
        diffValDisplay.textContent = e.target.value;
        recheckAllDice(); // Re-evaluate board when value changes
    });

    const warcryTargets = document.querySelectorAll('input[name="warcry-target"]');
    warcryTargets.forEach(radio => {
        radio.addEventListener('change', recheckAllDice);
    });

    // Helper function to update the slider's max value based on selected dice
    function updateDifficultyMax() {
        const controls = document.querySelectorAll('.dice-control');
        let overallMax = 1;
        let hasNumericDice = false;

        controls.forEach(control => {
            const count = parseInt(control.dataset.count) || 0;
            if (count > 0) {
                const type = control.dataset.type;
                const sides = config[type].sides;
                // Get all numeric faces for this die (extracting from object if necessary)
                const numericSides = sides.map(s => typeof s === 'object' ? s.value : s).filter(s => !isNaN(s)).map(Number);
                
                if (numericSides.length > 0) {
                    hasNumericDice = true;
                    const maxSide = Math.max(...numericSides);
                    if (maxSide > overallMax) {
                        overallMax = maxSide;
                    }
                }
            }
        });

        // Default to 100 if no numeric dice are selected yet
        if (!hasNumericDice) overallMax = 100;

        const diffTarget = document.getElementById('diff-target');
        const diffValDisplay = document.getElementById('diff-val-display');

        diffTarget.max = overallMax;
        
        // If the current value is higher than the new max, lower it
        if (parseInt(diffTarget.value) > overallMax) {
            diffTarget.value = overallMax;
            diffValDisplay.textContent = overallMax;
        }
    }

    // Helper function to add a die to the board
    function addDieToBoard(type) {
        const dieData = config[type];
        const sides = dieData.sides;
        const imageUrl = dieData.image;

        const dieWrapper = document.createElement('div');
        dieWrapper.className = 'die-wrapper';

        const dieEl = document.createElement('div');
        dieEl.className = 'die';
        dieEl.dataset.type = type; 
        dieEl.style.backgroundImage = `url('${imageUrl}')`;
        
        if (dieData.aura) {
            dieEl.style.filter = `drop-shadow(0 0 5px ${dieData.aura}) drop-shadow(0 0 15px ${dieData.aura})`;
        }
        
        const nameEl = document.createElement('div');
        nameEl.className = 'die-name';
        nameEl.textContent = type;

        const valueEl = document.createElement('div');
        valueEl.className = 'die-value';

        dieEl.appendChild(nameEl);
        dieEl.appendChild(valueEl);
        dieWrapper.appendChild(dieEl);
        
        if (currentGame.layout === 'default_die' && type === currentGame.defaultDie) {
            primaryZone.appendChild(dieWrapper);
        } else {
            secondaryZone.appendChild(dieWrapper);
        }
        
        dieEl.addEventListener('click', () => {
            rollSingleDie(dieEl, sides);
        });

        rollSingleDie(dieEl, sides);
    }

    // Helper function to remove a die from the board
    function removeDieFromBoard(type) {
        const zone = (currentGame.layout === 'default_die' && type === currentGame.defaultDie) ? primaryZone : secondaryZone;
        const diceList = Array.from(zone.querySelectorAll('.die')).filter(el => el.dataset.type === type);
        if (diceList.length > 0) {
            diceList[diceList.length - 1].closest('.die-wrapper').remove();
        }
    }

    function buildSidebar() {
        controlsContainer.innerHTML = '';
        primaryZone.innerHTML = ''; // Clear zones instead of the parent board
        secondaryZone.innerHTML = ''; 
        
        const standardUI = document.getElementById('standard-diff-ui');
        const warcryUI = document.getElementById('warcry-diff-ui');

        const diffToggleBtn = document.getElementById('diff-toggle-btn');
        const rollTotalContainer = document.getElementById('roll-total-container');
        
        // Reset visibility
        if (diffToggleBtn) diffToggleBtn.style.display = 'flex';
        if (rollTotalContainer) rollTotalContainer.style.display = currentGame.showTotal ? 'block' : 'none';
        if (standardUI) standardUI.style.display = 'none';
        if (warcryUI) warcryUI.style.display = 'none';
        boardDivider.style.display = currentGame.layout === 'default_die' ? 'block' : 'none';

        // Toggle difficulty UI depending on game config
        if (currentGame.difficultyUI === 'warcry') {
            if (warcryUI) warcryUI.style.display = 'flex';
        } else if (currentGame.difficultyUI === 'none') {
            if (diffToggleBtn) diffToggleBtn.style.display = 'none';
        } else {
            if (standardUI) standardUI.style.display = 'flex';
            if (currentGame.difficultyUI === 'target_only') {
                document.querySelector('.diff-switch').style.display = 'none';
                document.querySelector('.diff-text').style.display = 'none';
            } else {
                document.querySelector('.diff-switch').style.display = 'flex';
                document.querySelector('.diff-text').style.display = 'inline';
            }
        }

        // Sync the bonus controls visibility state
        document.body.classList.toggle('diff-active', !diffControl.classList.contains('hidden'));

        const renderDieControl = (dieType) => {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'dice-control grayed-out'; 
            controlDiv.dataset.type = dieType;
            controlDiv.dataset.count = 0;
            
            const leftArrow = document.createElement('span');
            leftArrow.className = 'arrow';
            leftArrow.textContent = '-';
            
            const display = document.createElement('div');
            display.className = 'picker-die';
            display.style.backgroundImage = `url('${config[dieType].image}')`;
            
            if (config[dieType].aura) {
                display.style.filter = `drop-shadow(0 0 8px ${config[dieType].aura})`;
            }
            
            const nameEl = document.createElement('span');
            nameEl.className = 'picker-die-name';
            nameEl.textContent = dieType;
            
            const countBadge = document.createElement('div');
            countBadge.className = 'picker-die-count';
            countBadge.textContent = '0';
            
            display.appendChild(nameEl);
            display.appendChild(countBadge);
            
            const rightArrow = document.createElement('span');
            rightArrow.className = 'arrow';
            rightArrow.textContent = '+';
            
            const updateDisplay = (count) => {
                controlDiv.dataset.count = count;
                countBadge.textContent = count;
                if (count === 0) {
                    controlDiv.classList.add('grayed-out');
                    countBadge.style.display = 'none';
                } else {
                    controlDiv.classList.remove('grayed-out');
                    countBadge.style.display = 'flex';
                }
                updateDifficultyMax();
            };

            controlDiv.updateDisplay = updateDisplay; 

            let pressTimer;
            let isLongPress = false;
            let ignoreMouse = false;
            
            const startPress = (e) => {
                if (e.type === 'touchstart') ignoreMouse = true;
                if (e.type === 'mousedown' && ignoreMouse) return; // Block ghost clicks

                isLongPress = false;
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    if (typeof setDieCountTo === 'function') {
                        setDieCountTo(dieType, 0); // Reset to 0 on long press
                    }
                }, 400); // 400ms hold
            };
            
            const endPress = (e) => {
                if (e.type === 'mouseup' && ignoreMouse) {
                    setTimeout(() => ignoreMouse = false, 500); // Clear ghost block
                    return;
                }

                clearTimeout(pressTimer);
                if (!isLongPress) {
                    // Prevent double-firing
                    if (display.dataset.modalOpened) return;
                    display.dataset.modalOpened = 'true';
                    setTimeout(() => display.dataset.modalOpened = '', 300);
                    
                    if (typeof openModal === 'function') {
                        openModal(dieType, parseInt(controlDiv.dataset.count));
                    }
                }
                
                // Reset the flag slightly after the interaction ends
                setTimeout(() => isLongPress = false, 50);

                if (e.type === 'touchend') {
                    setTimeout(() => ignoreMouse = false, 500);
                }
            };
            
            const cancelPress = (e) => {
                if (e.type === 'mouseleave' && ignoreMouse) return;
                clearTimeout(pressTimer);
                if (e.type === 'touchcancel') {
                    setTimeout(() => ignoreMouse = false, 500);
                }
            };

            display.addEventListener('mousedown', startPress);
            display.addEventListener('touchstart', startPress, { passive: true });
            display.addEventListener('mouseup', endPress);
            display.addEventListener('touchend', endPress);
            display.addEventListener('mouseleave', cancelPress);
            display.addEventListener('touchcancel', cancelPress);
            display.addEventListener('contextmenu', e => e.preventDefault()); 

            // Spawn first die if default_die layout
            let startCount = 0;
            if (currentGame.layout === 'default_die' && dieType === currentGame.defaultDie) {
                startCount = 1;
            }
            updateDisplay(startCount);
            if (startCount > 0) addDieToBoard(dieType);

            leftArrow.addEventListener('click', () => {
                let count = parseInt(controlDiv.dataset.count);
                // Lock the last default die in default_die layout
                if (currentGame.layout === 'default_die' && dieType === currentGame.defaultDie && count <= 1) return;
                
                if (count > 0) {
                    updateDisplay(count - 1);
                    removeDieFromBoard(dieType); 
                }
            });

            rightArrow.addEventListener('click', () => {
                let count = parseInt(controlDiv.dataset.count);
                updateDisplay(count + 1);
                addDieToBoard(dieType); 
            });

            controlDiv.appendChild(leftArrow);
            controlDiv.appendChild(display);
            controlDiv.appendChild(rightArrow);
            controlsContainer.appendChild(controlDiv);
        };

        if (currentGame.layout === 'default_die') {
            // Create global bonus controller
            const bonusCtrl = document.createElement('div');
            bonusCtrl.className = 'die-bonus-ctrl global-bonus-ctrl';
            
            const btnPlus = document.createElement('button');
            btnPlus.textContent = '+';
            const valDisplay = document.createElement('span');
            valDisplay.id = 'global-bonus-val';
            valDisplay.textContent = '+0';
            valDisplay.dataset.bonus = '0';
            const btnMinus = document.createElement('button');
            btnMinus.textContent = '-';
            
            const updateBonus = (delta) => {
                let current = parseInt(valDisplay.dataset.bonus) || 0;
                current += delta;
                valDisplay.dataset.bonus = current;
                valDisplay.textContent = current >= 0 ? `+${current}` : current;
                recheckAllDice();
            };
            
            btnPlus.addEventListener('click', (e) => { e.stopPropagation(); updateBonus(1); });
            btnMinus.addEventListener('click', (e) => { e.stopPropagation(); updateBonus(-1); });
            
            bonusCtrl.appendChild(btnPlus);
            bonusCtrl.appendChild(valDisplay);
            bonusCtrl.appendChild(btnMinus);
            
            primaryZone.appendChild(bonusCtrl);

            if (config[currentGame.defaultDie]) renderDieControl(currentGame.defaultDie);
            const hr = document.createElement('hr');
            hr.className = 'sidebar-divider';
            controlsContainer.appendChild(hr);
            for (const dieType in config) {
                if (dieType !== currentGame.defaultDie) renderDieControl(dieType);
            }
        } else {
            // Render straight to sidebar
            for (const dieType in config) {
                renderDieControl(dieType);
            }
        }
    }

    function selectGame(gameId) {
        currentGame = window.GAMES_CONFIG[gameId];
        config = currentGame.dice;
        currentGameName.textContent = currentGame.name;
        buildSidebar();
        gameModal.classList.remove('active');
    }

    function populateGameList(filter = '') {
        gameList.innerHTML = '';
        const lowerFilter = filter.toLowerCase();
        for (const gameId in window.GAMES_CONFIG) {
            const gameConfig = window.GAMES_CONFIG[gameId];
            if (gameConfig.name.toLowerCase().includes(lowerFilter)) {
                const item = document.createElement('div');
                item.className = 'game-list-item';
                item.textContent = gameConfig.name;
                item.addEventListener('click', () => selectGame(gameId));
                gameList.appendChild(item);
            }
        }
    }

    gameSelectBtn.addEventListener('click', () => {
        gameSearch.value = '';
        populateGameList();
        gameModal.classList.add('active');
        setTimeout(() => gameSearch.focus(), 100);
    });

    gameSearch.addEventListener('input', (e) => {
        populateGameList(e.target.value);
    });

    gameModalCloseX.addEventListener('click', () => {
        gameModal.classList.remove('active');
    });

    // Initialize first game
    const firstGameId = Object.keys(window.GAMES_CONFIG)[0];
    if (firstGameId) {
        selectGame(firstGameId);
    }

    rollBtn.addEventListener('click', () => {
        // Re-roll all dice currently on the board
        const allDice = document.querySelectorAll('#dice-board .die');
        allDice.forEach(dieEl => {
            dieEl.dataset.isBaseRoll = 'true'; // Mark as a base roll die
            const type = dieEl.dataset.type;
            const sides = config[type].sides;
            rollSingleDie(dieEl, sides);
        });
        
        // Close chooser box on mobile if it is open
        sidebar.classList.remove('expanded');
    });

    // Modal logic for quick mass-addition and resets
    const modalOverlay = document.getElementById('die-modal');
    const modalDieName = document.getElementById('modal-die-name');
    const modalDieCount = document.getElementById('modal-die-count');
    const modalDieSlider = document.getElementById('modal-die-slider');
    const modalCloseX = document.getElementById('modal-close-x');
    
    let currentModalDieType = null;

    window.openModal = function(type, currentCount) {
        currentModalDieType = type;
        modalDieName.textContent = `Set Amount: ${type}`;
        modalDieSlider.value = currentCount;
        modalDieCount.textContent = currentCount;
        modalOverlay.classList.add('active');
    };

    function closeModal() {
        modalOverlay.classList.remove('active');
        currentModalDieType = null;
    }

    window.setDieCountTo = function(type, newCount) {
        const controlDiv = document.querySelector(`.dice-control[data-type="${type}"]`);
        if (!controlDiv || !controlDiv.updateDisplay) return;

        const currentCount = parseInt(controlDiv.dataset.count);
        const diff = newCount - currentCount;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) addDieToBoard(type);
        } else if (diff < 0) {
            for (let i = 0; i < -diff; i++) removeDieFromBoard(type);
        }
        controlDiv.updateDisplay(newCount);
    };

    modalCloseX.addEventListener('click', closeModal);

    modalDieSlider.addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        modalDieCount.textContent = newCount;
        if (currentModalDieType) {
            setDieCountTo(currentModalDieType, newCount);
        }
    });
});
