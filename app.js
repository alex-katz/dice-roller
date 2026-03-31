document.addEventListener('DOMContentLoaded', () => {
    const config = window.DICE_CONFIG;
    const controlsContainer = document.getElementById('controls-container');
    const diceBoard = document.getElementById('dice-board');
    const rollBtn = document.getElementById('roll-btn');

    const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
    const sidebar = document.getElementById('sidebar');

    mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
    });

    function checkDifficulty(dieEl, finalFace) {
        const activeBtn = document.querySelector('.diff-btn.active');
        const op = activeBtn ? activeBtn.dataset.op : 'none';
        const target = parseFloat(document.getElementById('diff-target').value);
        
        dieEl.classList.remove('failed');
        
        // Skip if no difficulty, or if the face isn't a number (like Heads/Tails)
        if (op === 'none' || isNaN(target) || isNaN(finalFace)) return;

        const numericFace = parseFloat(finalFace);
        if (op === '>=') {
            if (numericFace < target) dieEl.classList.add('failed');
        } else if (op === '<=') {
            if (numericFace > target) dieEl.classList.add('failed');
        }
    }

    function recheckAllDice() {
        const allDice = document.querySelectorAll('#dice-board .die');
        allDice.forEach(dieEl => {
            if (dieEl.classList.contains('rolling')) return; // Skip dice that are currently rolling
            const valueEl = dieEl.querySelector('.die-value');
            if (valueEl && valueEl.textContent) {
                checkDifficulty(dieEl, valueEl.textContent);
            }
        });
    }

    // Helper function to animate and roll a single die
    function rollSingleDie(dieEl, sides) {
        if (dieEl.classList.contains('rolling')) return; // prevent overlapping rolls

        dieEl.classList.add('rolling');
        dieEl.classList.remove('failed'); // Reset failed state on new roll
        const valueEl = dieEl.querySelector('.die-value');
        
        const rollInterval = setInterval(() => {
            const randomFace = sides[Math.floor(Math.random() * sides.length)];
            valueEl.textContent = randomFace;
        }, 50);

        setTimeout(() => {
            clearInterval(rollInterval);
            dieEl.classList.remove('rolling');
            const finalFace = sides[Math.floor(Math.random() * sides.length)];
            valueEl.textContent = finalFace;
            checkDifficulty(dieEl, finalFace); // Check difficulty when done
        }, 800 + Math.random() * 400);
    }

    // Difficulty UI logic
    const diffBtns = document.querySelectorAll('.diff-btn');
    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            recheckAllDice(); // Re-evaluate board when mode changes
        });
    });

    const diffTarget = document.getElementById('diff-target');
    const diffValDisplay = document.getElementById('diff-val-display');
    diffTarget.addEventListener('input', (e) => {
        diffValDisplay.textContent = e.target.value;
        recheckAllDice(); // Re-evaluate board when value changes
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
                // Get all numeric faces for this die
                const numericSides = sides.filter(s => !isNaN(s)).map(Number);
                
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

    // Populate sidebar controls
    for (const dieType in config) {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'dice-control grayed-out'; // Start grayed out
        controlDiv.dataset.type = dieType;
        controlDiv.dataset.count = 0;
        
        const leftArrow = document.createElement('span');
        leftArrow.className = 'arrow';
        leftArrow.textContent = '-';
        
        // Container for the die image
        const display = document.createElement('div');
        display.className = 'picker-die';
        display.style.backgroundImage = `url('${config[dieType].image}')`;
        
        // Add aura if configured (applied to picker)
        if (config[dieType].aura) {
            display.style.filter = `drop-shadow(0 0 8px ${config[dieType].aura})`;
        }
        
        // Name on top of the die
        const nameEl = document.createElement('span');
        nameEl.className = 'picker-die-name';
        nameEl.textContent = dieType;
        
        // Counter badge in the top right
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
                countBadge.style.display = 'none'; // Hide badge when 0
            } else {
                controlDiv.classList.remove('grayed-out');
                countBadge.style.display = 'flex'; // Show badge
            }
            
            // Add this line to recalculate the max value when a die is added or removed:
            updateDifficultyMax();
        };

        // Initialize state
        updateDisplay(0);

        leftArrow.addEventListener('click', () => {
            let count = parseInt(controlDiv.dataset.count);
            if (count > 0) updateDisplay(count - 1);
        });

        rightArrow.addEventListener('click', () => {
            let count = parseInt(controlDiv.dataset.count);
            updateDisplay(count + 1);
        });

        controlDiv.appendChild(leftArrow);
        controlDiv.appendChild(display);
        controlDiv.appendChild(rightArrow);
        controlsContainer.appendChild(controlDiv);
    }

    rollBtn.addEventListener('click', () => {
        // Clear board
        diceBoard.innerHTML = '';
        const controls = document.querySelectorAll('.dice-control');
        const diceToRoll = [];

        // Collect dice to roll
        controls.forEach(control => {
            const count = parseInt(control.dataset.count) || 0;
            const type = control.dataset.type;
            for (let i = 0; i < count; i++) {
                diceToRoll.push(type);
            }
        });

        if (diceToRoll.length === 0) return;

        // Render dice and start animation
        diceToRoll.forEach(type => {
            const dieData = config[type];
            const sides = dieData.sides;
            const imageUrl = dieData.image;

            const dieEl = document.createElement('div');
            dieEl.className = 'die';
            dieEl.style.backgroundImage = `url('${imageUrl}')`;
            
            // Add strong aura effect if configured (applied to main board)
            if (dieData.aura) {
                // We use two drop-shadows to make the glow thicker and more visible
                dieEl.style.filter = `drop-shadow(0 0 5px ${dieData.aura}) drop-shadow(0 0 15px ${dieData.aura})`;
            }
            
            // Create name mark
            const nameEl = document.createElement('div');
            nameEl.className = 'die-name';
            nameEl.textContent = type;

            // Create value container
            const valueEl = document.createElement('div');
            valueEl.className = 'die-value';

            dieEl.appendChild(nameEl);
            dieEl.appendChild(valueEl);
            diceBoard.appendChild(dieEl);
            
            // Allow individual re-rolls
            dieEl.addEventListener('click', () => {
                rollSingleDie(dieEl, sides);
            });

            // Trigger initial roll
            rollSingleDie(dieEl, sides);
        });
    });
});
