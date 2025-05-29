document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        player1Score: 0,
        player2Score: 0,
        currentPlayer: 1,
        player1Name: "Player 1",
        player2Name: "Player 2",
        turnScore: 0,
        selectedDiceScore: 0,
        diceValues: [1, 2, 3, 4, 5, 6],
        selectedDice: [],
        availableDice: [0, 1, 2, 3, 4, 5], // Indices of available dice
        canRoll: true,
        hasRolled: false, // Flag to track if current player has rolled dice in this turn
        targetScore: 5000,
        gameOver: false
    };
    
    // Modal Elements
    const setupModal = document.getElementById('setup-modal');
    const coinTossModal = document.getElementById('coin-toss-modal');
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    const targetScoreInput = document.getElementById('target-score');
    const startGameButton = document.getElementById('start-game');
    const continueGameButton = document.getElementById('continue-game');
    const coinResult = document.getElementById('coin-result');

    // DOM elements
    const diceElements = document.querySelectorAll('.dice');
    const player1Element = document.getElementById('player1');
    const player2Element = document.getElementById('player2');
    const score1Element = document.getElementById('score1');
    const score2Element = document.getElementById('score2');
    const currentPlayerElement = document.getElementById('current-player');
    const turnScoreElement = document.getElementById('turn-score');
    const selectedScoreElement = document.getElementById('selected-score');
    const rollButton = document.getElementById('roll-btn');
    const bankButton = document.getElementById('bank-btn');
    const resetButton = document.getElementById('reset-btn');
    const gameMessagesElement = document.getElementById('game-messages');
    
    // Initialize game by showing the setup modal
    showSetupModal();

    // Event listeners
    rollButton.addEventListener('click', rollDice);
    bankButton.addEventListener('click', bankPoints);
    resetButton.addEventListener('click', showSetupModal);
    startGameButton.addEventListener('click', startGameFromModal);
    continueGameButton.addEventListener('click', startGameAfterCoinToss);
    
    diceElements.forEach((dice, index) => {
        dice.addEventListener('click', () => selectDice(index));
    });

    // Game functions
    function showSetupModal() {
        // Show the setup modal
        setupModal.style.display = 'flex';
        coinTossModal.style.display = 'none';
        
        // Set default values
        player1NameInput.value = gameState.player1Name;
        player2NameInput.value = gameState.player2Name;
        targetScoreInput.value = gameState.targetScore;
    }      function startGameFromModal() {
        // Get values from modal
        const player1Input = player1NameInput.value;
        const player2Input = player2NameInput.value;
        const targetScore = parseInt(targetScoreInput.value);
        
        // Update player names (use default if nothing entered)
        gameState.player1Name = player1Input || "Player 1";
        gameState.player2Name = player2Input || "Player 2";
        
        // Update target score (minimum 1000)
        gameState.targetScore = targetScore >= 1000 ? targetScore : 5000;
        
        // Update the target score in the rules
        document.getElementById('rules-target-score').textContent = gameState.targetScore.toLocaleString();
        
        // Update coin sides with player initials
        const coinHeads = document.querySelector('.coin-heads');
        const coinTails = document.querySelector('.coin-tails');
        
        // Get player initials (first letter of name)
        const player1Initial = gameState.player1Name.charAt(0);
        const player2Initial = gameState.player2Name.charAt(0);
        
        coinHeads.textContent = player1Initial;
        coinTails.textContent = player2Initial;
        
        // Hide setup modal and show coin toss modal
        setupModal.style.display = 'none';
        coinTossModal.style.display = 'flex';
        
        // Start coin toss animation
        performCoinToss();
    }
      function initGame() {
        // Reset game state
        gameState.player1Score = 0;
        gameState.player2Score = 0;
        // Note: currentPlayer is already set by the coin toss
        gameState.turnScore = 0;
        gameState.selectedDiceScore = 0;
        
        // Initialize dice values to zeros instead of 1-6, they'll get real values on first roll
        gameState.diceValues = [0, 0, 0, 0, 0, 0];
        gameState.selectedDice = [];
        gameState.availableDice = [0, 1, 2, 3, 4, 5];
        gameState.canRoll = true;
        gameState.hasRolled = false;
        gameState.gameOver = false;

        // Update UI
        updateUI();
        const currentPlayerName = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
        displayMessage(`New game started! ${currentPlayerName}'s turn. Roll the dice to begin.`);
        
        // Update player display names
        document.getElementById('player1').textContent = gameState.player1Name;
        document.getElementById('player2').textContent = gameState.player2Name;
        
        // Enable roll button, disable bank button
        rollButton.disabled = false;
        bankButton.disabled = true;
        rollButton.classList.add('highlighted'); // Add highlight to roll button
          // Reset dice appearance
        diceElements.forEach(dice => {
            dice.classList.remove('selected', 'disabled', 'dice-rolling', 'scoring-dice');
            dice.classList.add('unrolled'); // Add unrolled class to show dice aren't clickable yet
        });
        
        // Remove winner animation if present
        player1Element.classList.remove('winner');
        player2Element.classList.remove('winner');
        
        // Set active player based on coin toss result
        if (gameState.currentPlayer === 1) {
            player1Element.classList.add('active');
            player2Element.classList.remove('active');
        } else {
            player1Element.classList.remove('active');
            player2Element.classList.add('active');
        }
        
        // Update the current player display
        currentPlayerElement.textContent = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
    }
    
    function rollDice() {
        if (!gameState.canRoll || gameState.gameOver) return;
        
        // Remove roll button highlight when rolling
        rollButton.classList.remove('highlighted');
        
        // Clear any remaining state from previous games that might cause issues
        if (!gameState.hasRolled) {
            gameState.selectedDice = [];
            gameState.selectedDiceScore = 0;
        }
          // If all dice have been selected (hot dice scenario), reset available dice
        if (gameState.availableDice.length === 0) {
            // Display hot dice message
            displayMessage("Hot dice! All dice scored. Rolling all dice again.", false, true);
            
            // Reset for a new roll with all dice
            gameState.availableDice = [0, 1, 2, 3, 4, 5];
            
            // Add any selected dice score to the turn score before rolling again
            if (gameState.selectedDiceScore > 0) {
                gameState.turnScore += gameState.selectedDiceScore;
                gameState.selectedDiceScore = 0;
            }
            
            // Clear selected dice array
            gameState.selectedDice = [];
            
            // Reset dice appearance and prepare them for the new roll
            diceElements.forEach(dice => {
                dice.classList.remove('selected', 'disabled', 'dice-rolling', 'dice-farkle', 
                                     'unrolled', 'scoring-dice');
            });
        }else {
            // Normal roll (not hot dice) - add selected dice score to turn score
            if (gameState.selectedDiceScore > 0) {
                gameState.turnScore += gameState.selectedDiceScore;
                gameState.selectedDiceScore = 0;
                
                // Clear selected dice and update their appearance
                gameState.selectedDice.forEach(index => {
                    diceElements[index].classList.remove('selected');
                    diceElements[index].classList.add('disabled');
                });
                
                // Clear the selected dice array after adding the score to turn score
                // This fixes the bug where dice are counted multiple times
                gameState.selectedDice = [];
            }
        }
          // Add rolling animation
        gameState.availableDice.forEach(index => {
            diceElements[index].classList.add('dice-rolling');
            diceElements[index].classList.remove('unrolled', 'scoring-dice'); // Remove classes when rolling
        });
        
        // Set hasRolled flag to true when player rolls
        gameState.hasRolled = true;
        
        // Wait for animation to complete before updating dice values
        setTimeout(() => {            // Roll available dice
            let hasScoring = false;
            gameState.availableDice.forEach(index => {
                gameState.diceValues[index] = Math.floor(Math.random() * 6) + 1;
                diceElements[index].dataset.value = gameState.diceValues[index];
                diceElements[index].classList.remove('selected', 'dice-rolling');
            });
            
            // Check if the roll has any scoring dice
            hasScoring = checkForScoringDice();
            
            if (!hasScoring) {
                // Farkle! Add visual feedback
                displayMessage(`FARKLE! ${gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name} lost their turn score!`, true);
                gameState.turnScore = 0;
                gameState.selectedDiceScore = 0;
                
                // Add fading effect to all dice
                diceElements.forEach(dice => {
                    dice.classList.add('dice-farkle');
                });
                
                // Disable buttons during the Farkle animation
                rollButton.disabled = true;
                bankButton.disabled = true;
                
                // Wait for the animation before switching players
                setTimeout(() => {
                    // Remove the farkle effect
                    diceElements.forEach(dice => {
                        dice.classList.remove('dice-farkle');
                    });
                    switchPlayer();
                }, 2000); // Wait 2 seconds before switching players
            } else {
                displayMessage("Select scoring dice. Scoring dice are highlighted with a green border and dot.");
                gameState.canRoll = false; // Disable rolling until dice are selected
            }
            
            updateUI();
        }, 500); // Wait for animation to complete
    }
      function selectDice(index) {
        // If game is over or dice is already selected or disabled, do nothing
        if (gameState.gameOver || 
            !gameState.availableDice.includes(index) ||
            !gameState.hasRolled) { // Prevent selecting dice if player hasn't rolled yet
            
            // Show message if player tries to select dice without rolling first
            if (!gameState.hasRolled) {
                displayMessage("You must roll the dice first!");
                // Make roll button pulse to draw attention
                rollButton.classList.add('highlighted');
            } else if (gameState.selectedDice.includes(index)) {
                // Allow deselection of a previously selected die
                deselectDie(index);
                return;
            }
            return;
        }
        
        const diceValue = gameState.diceValues[index];
        const availableValues = gameState.availableDice.map(i => gameState.diceValues[i]);
        
        // Count occurrences of each value
        const valueCounts = {};
        availableValues.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
            // Check for special combinations when all available dice are 6
        // Remove the turnScore === 0 condition to properly handle hot dice scenarios
        if (gameState.availableDice.length === 6 && gameState.selectedDice.length === 0) {
            // Check for straight
            if ([1, 2, 3, 4, 5, 6].every(val => availableValues.includes(val))) {
                // For a straight, we only select the die that was clicked, but still give full points
                selectSingleDie(index);
                displayMessage("You found a straight! Click each die to select all 6 for 3000 points!");
                return;
            }
            
            // Check for three pairs
            const pairCount = Object.values(valueCounts).filter(count => count === 2).length;
            if (pairCount === 3) {
                // For three pairs, we only select the die that was clicked
                selectSingleDie(index);
                displayMessage("You found three pairs! Click each die to select all 6 for 1500 points!");
                return;
            }
        }
        
        // Special case for a roll with three pairs - allow selecting all dice of the pairs
        // This enables selecting more dice even after the initial detection
        if (gameState.turnScore === 0) {
            const allDice = [...gameState.availableDice, ...gameState.selectedDice];
            if (allDice.length === 6) {
                // Get all dice values
                const allValues = allDice.map(i => gameState.diceValues[i]);
                // Count occurrences
                const allValueCounts = {};
                allValues.forEach(value => {
                    allValueCounts[value] = (allValueCounts[value] || 0) + 1;                
                });
                
                // Check for three pairs again
                const totalPairCount = Object.values(allValueCounts).filter(count => count === 2).length;
                if (totalPairCount === 3) {
                    // In three pairs scenario, allow selection of any dice
                    // This allows selecting 3's and 6's, not just 1's and 5's
                    selectSingleDie(index);
                    
                    // If all 6 dice are now selected, display the three pairs message
                    if (gameState.selectedDice.length === 6) {
                        displayMessage("Hot dice! All three pairs selected for 1500 points! Roll again or bank your points.", false, true);
                        // Enable roll and bank buttons since all dice have been selected (hot dice)
                        rollButton.disabled = false;
                        bankButton.disabled = false;
                        gameState.canRoll = true;
                        rollButton.classList.add('highlighted');
                    } else {
                        const clickedValue = gameState.diceValues[index];
                        displayMessage(`Selected a ${clickedValue} from three pairs. Keep selecting to get 1500 points!`);
                    }
                    return;
                }
            }
        }
          // Check if this die is highlighted as a scoring die (which will include three pairs)
        if (diceElements[index].classList.contains('scoring-dice')) {
            // Before selecting, explicitly check for three pairs scenario again
            const allDice = [...gameState.availableDice, ...gameState.selectedDice];
            const allValues = allDice.map(i => gameState.diceValues[i]);
            const allValueCounts = {};
            allValues.forEach(value => {
                allValueCounts[value] = (allValueCounts[value] || 0) + 1;
            });
            
            // Check if we're in a three pairs scenario
            const isThreePairs = gameState.turnScore === 0 && 
                                allDice.length === 6 && 
                                Object.keys(allValueCounts).length === 3 && 
                                Object.values(allValueCounts).every(count => count === 2);
            
            // Always select the die
            selectSingleDie(index);
            
            // Special messaging for three pairs scenario
            if (isThreePairs) {
                displayMessage(`Selected a ${diceValue} from three pairs. Keep selecting to get 1500 points!`);
                
                // If all 6 dice are now selected, display the three pairs message
                if (gameState.selectedDice.length === 6) {
                    displayMessage("Hot dice! All three pairs selected for 1500 points! Roll again or bank your points.", false, true);
                    // Enable roll and bank buttons since all dice have been selected (hot dice)
                    rollButton.disabled = false;
                    bankButton.disabled = false;
                    gameState.canRoll = true;
                    rollButton.classList.add('highlighted');
                }
                return;
            }
            
            // For traditional scoring dice like 1 or 5
            if (diceValue === 1 || diceValue === 5) {
                displayMessage(diceValue === 1 ? "Selected 1 (100 points)" : "Selected 5 (50 points)");
            } else {                // For other dice, check if they're part of three or more of a kind
                const sameValueAvailable = gameState.availableDice.filter(i => 
                    gameState.diceValues[i] === diceValue);
                
                const sameValueSelected = gameState.selectedDice.filter(i => 
                    gameState.diceValues[i] === diceValue);
                    
                const totalSameValue = sameValueAvailable.length + sameValueSelected.length;
                
                const selectedCount = gameState.selectedDice.filter(i => gameState.diceValues[i] === diceValue).length;
                
                if (totalSameValue >= 3) {
                    if (selectedCount >= 3) {
                        const baseScore = diceValue === 1 ? 1000 : diceValue * 100;
                        const multiplier = Math.pow(2, selectedCount - 3);
                        displayMessage(`${selectedCount} ${diceValue}'s! ${baseScore * multiplier} points!`);
                    } else {
                        displayMessage(`Selected a ${diceValue}. Need ${3 - selectedCount} more for three-of-a-kind!`);
                        
                        // Re-highlight other available dice with the same value
                        // This ensures the rest of the three-of-a-kind remains highlighted
                        checkForScoringDice();
                    }
                } else {
                    // This is a scoring die but not part of a traditional scoring combination
                    // Likely part of a straight
                    displayMessage(`Selected a ${diceValue}. Continue selecting scoring dice.`);
                }
            }
        } else {
            displayMessage(`That die doesn't score on its own. Select valid scoring dice.`);
            return;
        }
        
        // After selection, check if any more scoring combinations are available
        if (!checkForScoringDice()) {
            displayMessage("No more scoring dice available. Roll again or bank your points.");
        }
          // Check if all dice are selected (hot dice)
        if (gameState.availableDice.length === 0) {
            displayMessage("Hot dice! All dice scored. Roll again to roll all 6 dice!", false, true);
            rollButton.classList.add('highlighted');
        }
        
        // Enable buttons based on selection
        if (gameState.selectedDiceScore > 0) {
            bankButton.disabled = false;
            rollButton.disabled = false;
            gameState.canRoll = true;
        }
        
        updateUI();
    }
      function selectSingleDie(index) {
        // Store the dice value before removing it from available dice
        const selectedDiceValue = gameState.diceValues[index];
        
        // Add to selected dice
        gameState.selectedDice.push(index);
        
        // Remove from available dice
        const availableIndex = gameState.availableDice.indexOf(index);
        if (availableIndex !== -1) {
            gameState.availableDice.splice(availableIndex, 1);
        }
        
        // Update UI
        diceElements[index].classList.add('selected');
        diceElements[index].classList.remove('scoring-dice'); // Remove scoring highlight when selected
        
        // Check if we have a three-of-a-kind scenario with the selected dice value
        const totalSameValueDice = gameState.availableDice.filter(i => 
            gameState.diceValues[i] === selectedDiceValue).length + 
            gameState.selectedDice.filter(i => 
                gameState.diceValues[i] === selectedDiceValue).length;
        
        // Recalculate score for ALL currently selected dice
        // This completely replaces the previous selectedDiceScore value
        calculateSelectedScore();
        
        // If this is part of a three-of-a-kind, make sure the remaining dice are still highlighted
        if (totalSameValueDice >= 3) {
            checkForScoringDice();
        }
    }    function calculateSelectedScore() {
        // Calculate score only for the currently selected dice (not already banked dice)
        let score = 0;
        const selectedValues = gameState.selectedDice.map(i => gameState.diceValues[i]);
        
        // Count occurrences of each value
        const valueCounts = {};
        selectedValues.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        // Check for straight (1-2-3-4-5-6)
        if (selectedValues.length === 6 && 
            [1, 2, 3, 4, 5, 6].every(val => selectedValues.includes(val))) {
            score = 3000;
            displayMessage("Straight! 3000 points!", false, true);
            // Enable buttons for hot dice (all dice selected)
            if (gameState.availableDice.length === 0) {
                rollButton.disabled = false;
                bankButton.disabled = false;
                gameState.canRoll = true;
                rollButton.classList.add('highlighted');
            }
        } 
        // Check for three pairs - if we have 6 dice and exactly 3 different values, each appearing exactly twice
        else if (selectedValues.length === 6 && 
                Object.keys(valueCounts).length === 3 &&
                Object.values(valueCounts).every(count => count === 2)) {
            score = 1500;
            displayMessage("Three pairs! 1500 points!", false, true);
            // Enable buttons for hot dice (all dice selected)
            if (gameState.availableDice.length === 0) {
                rollButton.disabled = false;
                bankButton.disabled = false;
                gameState.canRoll = true;
                rollButton.classList.add('highlighted');
            }
        }
        // Check for partially completed three pairs - relaxed condition to work for both first roll and hot dice
        else if (selectedValues.length < 6 && 
                selectedValues.length % 2 === 0 && 
                Object.values(valueCounts).every(count => count === 2)) {
            // If we're building up to three pairs, score the individual dice normally
            // but also set a special flag or message to indicate we're building three pairs
            let pairsFound = Object.keys(valueCounts).length;
            
            // For now, score as individual dice (1s and 5s)
            score = calculateIndividualDiceScore(selectedValues, valueCounts);
            
            if (pairsFound > 1) {
                // This is clearly building toward three pairs
                // In this case, we want all dice to be selectable
                // The logic to enable all dice selection is in checkForScoringDice
            }
        }
        // Process each value separately for normal scoring combinations
        else {
            score = calculateIndividualDiceScore(selectedValues, valueCounts);
        }
        
        // Simply set the selectedDiceScore to the current selection's score
        // This replaces (not adds to) any previous selectedDiceScore
        gameState.selectedDiceScore = score;
    }
    
    // Helper function to calculate the score of individual dice
    function calculateIndividualDiceScore(selectedValues, valueCounts) {
        let score = 0;
        
        // Check for three or more of a kind first
        for (const value in valueCounts) {
            const count = valueCounts[value];
            const numValue = parseInt(value);
            
            if (count >= 3) {
                // Three or more of a kind
                if (numValue === 1) {
                    score += 1000 * Math.pow(2, count - 3);
                } else {
                    score += numValue * 100 * Math.pow(2, count - 3);
                }
            } else {
                // Individual 1s and 5s
                if (numValue === 1) {
                    score += count * 100;
                } else if (numValue === 5) {
                    score += count * 50;
                }
            }
        }
        
        return score;
    }    function checkForScoringDice() {
        const availableValues = gameState.availableDice.map(i => gameState.diceValues[i]);
        
        // If no dice are available, then there are no scoring dice
        if (availableValues.length === 0) {
            return false;
        }
        
        // Count occurrences of each value
        const valueCounts = {};
        availableValues.forEach(value => {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        
        // Consider selected dice for three-of-a-kind detection
        // We need to see if any dice values are part of an incomplete three-of-a-kind
        const combinedValues = {}; 
        // Copy the values from available dice
        for (const value in valueCounts) {
            combinedValues[value] = valueCounts[value];
        }
        // Add counts from selected dice
        gameState.selectedDice.forEach(index => {
            const val = gameState.diceValues[index];
            combinedValues[val] = (combinedValues[val] || 0) + 1;
        });
        
        // Keep track of which dice indices are scoring
        const scoringDiceIndices = [];
        
        // Special case handling for straight and three pairs when some dice are already selected
        // This is used both for initial roll and hot dice scenarios
        // Get all dice values (available + selected)
        const allDice = [...gameState.availableDice, ...gameState.selectedDice];
        
        // Only check for special combinations if we have all 6 dice total
        if (allDice.length === 6) {
            const allValues = allDice.map(i => gameState.diceValues[i]);
            const allValueCounts = {};
            allValues.forEach(value => {
                allValueCounts[value] = (allValueCounts[value] || 0) + 1;                
            });
            
            // Check for three pairs (3 unique values, each appearing exactly twice)
            if (Object.keys(allValueCounts).length === 3 && 
                Object.values(allValueCounts).every(count => count === 2)) {
                
                // In three pairs case, mark ALL available dice as scoring
                gameState.availableDice.forEach(index => {
                    scoringDiceIndices.push(index);
                });
                
                highlightScoringDice(scoringDiceIndices);
                return true;
            }
            
            // Check for a straight (1-2-3-4-5-6) 
            if ([1, 2, 3, 4, 5, 6].every(val => allValues.includes(val))) {
                // Mark all available dice as scoring
                gameState.availableDice.forEach(index => {
                    scoringDiceIndices.push(index);
                });
                
                highlightScoringDice(scoringDiceIndices);
                return true;
            }
        }
        
        // Special combinations for all available dice (only check if all 6 dice are available)
        // This is the initial roll case with no selected dice yet
        if (availableValues.length === 6) {
            // Check for straight (1-2-3-4-5-6)
            if ([1, 2, 3, 4, 5, 6].every(val => availableValues.includes(val))) {
                // All dice are scoring in a straight
                gameState.availableDice.forEach(index => {
                    scoringDiceIndices.push(index);
                });
                highlightScoringDice(scoringDiceIndices);
                return true;
            }
            
            // Check for three pairs - ensure we have exactly 3 different values, each appearing exactly twice
            if (Object.keys(valueCounts).length === 3 && 
                Object.values(valueCounts).every(count => count === 2)) {
                // All dice are scoring in three pairs
                gameState.availableDice.forEach(index => {
                    scoringDiceIndices.push(index);
                });
                highlightScoringDice(scoringDiceIndices);
                return true;
            }
        }
        
        let hasScoring = false;
        
        // Check for individual 1's and 5's (these always score)
        gameState.availableDice.forEach(index => {
            const value = gameState.diceValues[index];
            if (value === 1 || value === 5) {
                scoringDiceIndices.push(index);
                hasScoring = true;
            }
        });        // First check for three-of-a-kind with both available AND selected dice
        for (const value in combinedValues) {
            const totalCount = combinedValues[value];
            const numValue = parseInt(value);
            
            // If we have at least 3 dice with this value (some may be selected already)
            if (totalCount >= 3) {
                // Find all AVAILABLE dice with this value and mark them as scoring
                gameState.availableDice.forEach(index => {
                    if (gameState.diceValues[index] === numValue) {
                        if (!scoringDiceIndices.includes(index)) {
                            scoringDiceIndices.push(index);
                        }
                    }
                });
                hasScoring = true;
                
                console.log(`Found ${totalCount} total dice with value ${numValue} (including selected) - marking available ones as scoring`);
            }
        }
        
        // Now check for three or more of a kind in just available dice
        for (const value in valueCounts) {
            const count = valueCounts[value];
            const numValue = parseInt(value);
            if (count >= 3) {
                // Find all dice with this value and add them to scoring indices
                gameState.availableDice.forEach(index => {
                    if (gameState.diceValues[index] === numValue) {
                        if (!scoringDiceIndices.includes(index)) {
                            scoringDiceIndices.push(index);
                        }
                    }
                });
                hasScoring = true;
                
                console.log(`Found ${count} available dice with value ${numValue} - marked as scoring`);
            }
        }
        
        // Highlight the scoring dice
        highlightScoringDice(scoringDiceIndices);
        
        return hasScoring;
    }
    
    // Helper function to highlight scoring dice
    function highlightScoringDice(scoringIndices) {
        // First, remove scoring-dice class from all dice
        diceElements.forEach(dice => {
            dice.classList.remove('scoring-dice');
        });
        
        // Then, add scoring-dice class to scoring dice
        scoringIndices.forEach(index => {
            diceElements[index].classList.add('scoring-dice');
        });
    }
      function bankPoints() {
        if (gameState.gameOver) return;
        
        // Calculate total points to bank: turn score (accumulated from previous rolls) + current selected dice score
        const totalScore = gameState.turnScore + gameState.selectedDiceScore;
        
        // Add total score to current player's total
        if (gameState.currentPlayer === 1) {
            gameState.player1Score += totalScore;
            
            // Add score update animation
            score1Element.classList.add('score-update');
            setTimeout(() => {
                score1Element.classList.remove('score-update');
            }, 800);
            
            // Check for win based on target score
            if (gameState.player1Score >= gameState.targetScore) {
                endGame(1);
                return;
            }
        } else {
            gameState.player2Score += totalScore;
            
            // Add score update animation
            score2Element.classList.add('score-update');
            setTimeout(() => {
                score2Element.classList.remove('score-update');
            }, 800);
            
            // Check for win based on target score
            if (gameState.player2Score >= gameState.targetScore) {
                endGame(2);
                return;
            }
        }
        
        // Reset turn score and switch player
        gameState.turnScore = 0;
        gameState.selectedDiceScore = 0;
        switchPlayer();
        
        // Update UI
        updateUI();
        
        // Disable bank button
        bankButton.disabled = true;
    }
    
    function switchPlayer() {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        gameState.selectedDice = [];
        gameState.availableDice = [0, 1, 2, 3, 4, 5];
        gameState.canRoll = true;
        gameState.hasRolled = false; // Reset hasRolled flag when switching players
        
        // Reset dice values to ensure no old values remain when starting a new player's turn
        gameState.diceValues = [0, 0, 0, 0, 0, 0];
        
        // Important: Ensure all score variables are reset when switching players
        gameState.turnScore = 0;
        gameState.selectedDiceScore = 0;
        
        // Update UI for player change
        player1Element.classList.toggle('active');
        player2Element.classList.toggle('active');
        currentPlayerElement.textContent = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
          // Reset dice appearance
        diceElements.forEach(dice => {
            dice.classList.remove('selected', 'disabled', 'dice-farkle', 'scoring-dice');
            dice.classList.add('unrolled'); // Add unrolled class when switching players
            dice.removeAttribute('data-value'); // Remove value attribute to reset dice appearance
        });
        
        displayMessage(`${gameState.currentPlayer === 1 ? gameState.player1Name : gameState.currentPlayer === 2 ? gameState.player2Name : ''}'s turn. Roll the dice to begin.`);
        
        // Enable roll button, disable bank button
        rollButton.disabled = false;
        bankButton.disabled = true;
        
        // Add highlight to roll button
        rollButton.classList.add('highlighted');
    }    function endGame(winner) {
        gameState.gameOver = true;
        const winnerName = winner === 1 ? gameState.player1Name : gameState.player2Name;
        const winnerScore = winner === 1 ? gameState.player1Score : gameState.player2Score;
        displayMessage(`${winnerName} wins with a score of ${winnerScore}!`);
        
        // Add winner animation
        if (winner === 1) {
            player1Element.classList.add('winner');
        } else {
            player2Element.classList.add('winner');
        }
        
        // Disable game buttons
        rollButton.disabled = true;
        bankButton.disabled = true;
        
        // Enable reset button to start a new game
        resetButton.disabled = false;
    }
    
    function updateUI() {
        // Update scores
        score1Element.textContent = gameState.player1Score;
        score2Element.textContent = gameState.player2Score;
        
        // Update turn and selected scores
        // turnScoreElement shows the total potential score (banked + selected)
        turnScoreElement.textContent = gameState.turnScore + gameState.selectedDiceScore;
        // selectedScoreElement shows only the current selection's potential value
        selectedScoreElement.textContent = gameState.selectedDiceScore;
        
        // Update dice display
        diceElements.forEach((dice, index) => {
            // Only set data-value if the dice have been rolled (otherwise leave blank)
            if (gameState.hasRolled || gameState.diceValues[index] > 0) {
                dice.dataset.value = gameState.diceValues[index];
            } else {
                // Remove data-value attribute for unrolled dice at game start
                dice.removeAttribute('data-value');
            }
            
            if (gameState.selectedDice.includes(index)) {
                dice.classList.add('selected');
                dice.classList.remove('disabled');
            } else if (!gameState.availableDice.includes(index)) {
                dice.classList.add('disabled');
                dice.classList.remove('selected');
            } else {
                dice.classList.remove('selected', 'disabled');
            }
        });
    }
    
    function displayMessage(message, isFarkle = false, isHotDice = false) {
        gameMessagesElement.textContent = message;
        
        // Remove any existing animation classes
        gameMessagesElement.classList.remove('farkle-msg', 'hot-dice-msg');
        
        // Add animation class if it's a Farkle message
        if (isFarkle) {
            gameMessagesElement.classList.add('farkle-msg');
        }
        
        // Add animation class if it's a hot dice message
        if (isHotDice) {
            gameMessagesElement.classList.add('hot-dice-msg');
        }
    }
    
    function deselectDie(index) {
        // Remove from selected dice
        const selectedIndex = gameState.selectedDice.indexOf(index);
        if (selectedIndex !== -1) {
            gameState.selectedDice.splice(selectedIndex, 1);
        }
        
        // Add back to available dice
        if (!gameState.availableDice.includes(index)) {
            gameState.availableDice.push(index);
        }
        
        // Update UI
        diceElements[index].classList.remove('selected');
        
        // Recalculate score
        calculateSelectedScore();
        
        // Re-check for scoring dice to highlight any that should be highlighted
        checkForScoringDice();
        
        // Check if we still have a valid selection
        if (gameState.selectedDiceScore === 0 && gameState.selectedDice.length > 0) {
            // We have an invalid selection, force deselection of all dice
            gameState.selectedDice.forEach(i => {
                diceElements[i].classList.remove('selected');
                if (!gameState.availableDice.includes(i)) {
                    gameState.availableDice.push(i);
                }
            });
            gameState.selectedDice = [];
            displayMessage("Deselected dice. Select valid scoring dice.");
        } else if (gameState.selectedDice.length === 0) {
            // No dice selected
            displayMessage("Select scoring dice.");
            gameState.canRoll = false;
            rollButton.disabled = true;
            bankButton.disabled = true;
        } else {
            displayMessage(`Dice deselected. Current selection: ${gameState.selectedDiceScore} points.`);
        }
        
        // Update buttons based on current selection
        if (gameState.selectedDiceScore > 0) {
            bankButton.disabled = false;
            rollButton.disabled = false;
            gameState.canRoll = true;
        } else {
            bankButton.disabled = true;
        }
        
        updateUI();
    }
    
    function startGameAfterCoinToss() {
        // Hide the coin toss modal
        coinTossModal.style.display = 'none';
        
        // Initialize the game
        initGame();
        
        // Display message for the player who won the toss
        const startingPlayer = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
        displayMessage(`${startingPlayer} won the toss and will start the game!`);
        
        // Enable roll button for the starting player
        rollButton.disabled = false;
        bankButton.disabled = true;
        rollButton.classList.add('highlighted');
    }
    
    function tossCoin() {
        // Simulate a coin toss (50% chance for heads or tails)
        return Math.random() < 0.5 ? 'heads' : 'tails';
    }
    
    function performCoinToss() {
        const coin = document.querySelector('.coin');
        const coinResultElement = document.getElementById('coin-result');
        const continueGameButton = document.getElementById('continue-game');
        
        // Reset coin and result
        coin.style.animation = 'none';
        coinResultElement.textContent = '';
        coinResultElement.classList.remove('visible');
        continueGameButton.style.display = 'none';
        
        // Force reflow to reset animation
        void coin.offsetWidth;
        
        // Start coin flip animation
        coin.style.animation = 'coin-flip 2s ease-in-out';
        
        // Randomly decide the winner
        const isPlayer1First = Math.random() >= 0.5;
        gameState.currentPlayer = isPlayer1First ? 1 : 2;
        
        // Wait for animation to complete
        setTimeout(() => {
            // Apply final transform to show the correct side facing up
            if (isPlayer1First) {
                coin.style.transform = 'rotateY(0deg)'; // Heads up (Player 1)
            } else {
                coin.style.transform = 'rotateY(180deg)'; // Tails up (Player 2)
            }
            
            // Display the result
            const winnerName = isPlayer1First ? gameState.player1Name : gameState.player2Name;
            coinResultElement.textContent = `${winnerName} goes first!`;
            coinResultElement.classList.add('visible');
            
            // Show continue button
            setTimeout(() => {
                continueGameButton.style.display = 'block';
            }, 1000);
            
        }, 2000); // Match the animation duration
    }
});
