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

    // Initialize game
    initGame();

    // Event listeners
    rollButton.addEventListener('click', rollDice);
    bankButton.addEventListener('click', bankPoints);
    resetButton.addEventListener('click', initGame);
    
    diceElements.forEach((dice, index) => {
        dice.addEventListener('click', () => selectDice(index));
    });

    // Game functions
    function initGame() {
        // Prompt for player names
        const player1Input = prompt("Enter name for Player 1:", "Player 1");
        const player2Input = prompt("Enter name for Player 2:", "Player 2");
        
        // Update player names (use default if nothing entered)
        gameState.player1Name = player1Input || "Player 1";
        gameState.player2Name = player2Input || "Player 2";
          // Reset game state
        gameState.player1Score = 0;
        gameState.player2Score = 0;
        gameState.currentPlayer = 1;
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
        displayMessage(`New game started! ${gameState.player1Name}'s turn. Roll the dice to begin.`);
        
        // Update player display names
        document.getElementById('player1').textContent = gameState.player1Name;
        document.getElementById('player2').textContent = gameState.player2Name;
        
        // Enable roll button, disable bank button
        rollButton.disabled = false;
        bankButton.disabled = true;
        rollButton.classList.add('highlighted'); // Add highlight to roll button
        
        // Reset dice appearance
        diceElements.forEach(dice => {
            dice.classList.remove('selected', 'disabled', 'dice-rolling');
            dice.classList.add('unrolled'); // Add unrolled class to show dice aren't clickable yet
        });
        
        // Remove winner animation if present
        player1Element.classList.remove('winner');
        player2Element.classList.remove('winner');
        
        // Reset player active state
        player1Element.classList.add('active');
        player2Element.classList.remove('active');
    }    function rollDice() {
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
            
            // Reset dice appearance
            diceElements.forEach(dice => {
                dice.classList.remove('selected', 'disabled', 'dice-rolling', 'dice-farkle', 'unrolled');
            });
        } else {
            // Normal roll (not hot dice) - add selected dice score to turn score
            if (gameState.selectedDiceScore > 0) {
                gameState.turnScore += gameState.selectedDiceScore;
                gameState.selectedDiceScore = 0;
                
                // Clear selected dice and update their appearance
                gameState.selectedDice.forEach(index => {
                    diceElements[index].classList.remove('selected');
                    diceElements[index].classList.add('disabled');
                });
                
                // Keep the selected dice array separate from the available dice
                // Don't clear it here since we need to know which dice were previously selected
            }
        }
          // Add rolling animation
        gameState.availableDice.forEach(index => {
            diceElements[index].classList.add('dice-rolling');
            diceElements[index].classList.remove('unrolled'); // Remove unrolled class when rolling
        });
        
        // Set hasRolled flag to true when player rolls
        gameState.hasRolled = true;
        
        // Wait for animation to complete before updating dice values
        setTimeout(() => {
            // Roll available dice
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
                displayMessage("Select scoring dice.");
                gameState.canRoll = false; // Disable rolling until dice are selected
            }
            
            updateUI();
        }, 500); // Wait for animation to complete
    }    function selectDice(index) {
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
        
        // Check for special combinations when all available dice are the original 6
        // This should only happen on the first roll of a turn, not after a hot dice roll
        // Add check for gameState.turnScore === 0 to ensure this is the first roll of the turn
        if (gameState.availableDice.length === 6 && gameState.selectedDice.length === 0 && gameState.turnScore === 0) {
            // Check for straight
            if ([1, 2, 3, 4, 5, 6].every(val => availableValues.includes(val))) {
                // Select all dice
                gameState.availableDice.forEach(i => {
                    selectSingleDie(i);
                });
                displayMessage("Straight! 3000 points!");
                return;
            }
            
            // Check for three pairs
            const pairCount = Object.values(valueCounts).filter(count => count === 2).length;
            if (pairCount === 3) {
                // Select all dice
                gameState.availableDice.forEach(i => {
                    selectSingleDie(i);
                });
                displayMessage("Three pairs! 1500 points!");
                return;
            }
        }          // Check if this die is a scoring die
        if (diceValue === 1 || diceValue === 5) {
            // Single 1 or 5
            selectSingleDie(index);
            displayMessage(diceValue === 1 ? "Selected 1 (100 points)" : "Selected 5 (50 points)");
        } else {
            // Check for scoring combinations with this value
            // Only look at currently available dice for this check
            const sameValueAvailable = gameState.availableDice.filter(i => 
                gameState.diceValues[i] === diceValue);
            
            // Count already selected dice of this value
            const sameValueSelected = gameState.selectedDice.filter(i => 
                gameState.diceValues[i] === diceValue);
                
            // Check if we have three or more of the same value (including this die)
            // We need at least 3 total dice of this value to make a valid selection
            const totalSameValue = sameValueAvailable.length + sameValueSelected.length;
            
            if (totalSameValue >= 3) {
                // Only select the single die the player clicked on, not all of the same value
                selectSingleDie(index);
                
                // Count how many of this value are now selected
                const selectedCount = gameState.selectedDice.filter(i => gameState.diceValues[i] === diceValue).length;
                
                // If we have 3 or more of the same value selected now, show the appropriate message
                if (selectedCount >= 3) {
                    const baseScore = diceValue === 1 ? 1000 : diceValue * 100;
                    const multiplier = Math.pow(2, selectedCount - 3);
                    displayMessage(`${selectedCount} ${diceValue}'s! ${baseScore * multiplier} points!`);
                } else {
                    displayMessage(`Selected a ${diceValue}. Need ${3 - selectedCount} more for three-of-a-kind!`);
                }
            } else {
                displayMessage(`That die doesn't score on its own. Select valid scoring dice.`);
                return;
            }
        }
        
        // After selection, check if any more scoring combinations are available
        if (!checkForScoringDice()) {
            displayMessage("No more scoring dice available. Roll again or bank your points.");
        }
        
        // Check if all dice are selected (hot dice)
        if (gameState.availableDice.length === 0) {
            displayMessage("Hot dice! All dice scored. Roll again to roll all 6 dice!");
            rollButton.classList.add('highlighted');
        }
        
        // Enable buttons based on selection
        if (gameState.selectedDiceScore > 0) {
            bankButton.disabled = false;
            rollButton.disabled = false;
            gameState.canRoll = true;
        }
        
        updateUI();
    }function selectSingleDie(index) {
        // Add to selected dice
        gameState.selectedDice.push(index);
        
        // Remove from available dice
        const availableIndex = gameState.availableDice.indexOf(index);
        if (availableIndex !== -1) {
            gameState.availableDice.splice(availableIndex, 1);
        }
        
        // Update UI
        diceElements[index].classList.add('selected');
        
        // Recalculate score for ALL currently selected dice
        // This completely replaces the previous selectedDiceScore value
        calculateSelectedScore();
    }function calculateSelectedScore() {
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
        } 
        // Check for three pairs
        else if (selectedValues.length === 6 && 
                Object.values(valueCounts).every(count => count === 2)) {
            score = 1500;
        } 
        // Process each value separately
        else {
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
        }
        
        // Simply set the selectedDiceScore to the current selection's score
        // This replaces (not adds to) any previous selectedDiceScore
        gameState.selectedDiceScore = score;
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
        
        // Special combinations for all available dice (only check if all 6 dice are available)
        if (availableValues.length === 6) {
            // Check for straight (1-2-3-4-5-6)
            if ([1, 2, 3, 4, 5, 6].every(val => availableValues.includes(val))) {
                return true;
            }
            
            // Check for three pairs
            const pairCount = Object.values(valueCounts).filter(count => count === 2).length;
            if (pairCount === 3) {
                return true;
            }
        }
        
        // Check for individual 1's and 5's (these always score)
        if (availableValues.includes(1) || availableValues.includes(5)) {
            return true;
        }
        
        // Check for three or more of a kind
        for (const value in valueCounts) {
            const count = valueCounts[value];
            if (count >= 3) {
                return true;
            }
        }
        
        return false;
    }function bankPoints() {
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
            
            // Check for win
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
            
            // Check for win
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
    }    function switchPlayer() {
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        gameState.selectedDice = [];
        gameState.availableDice = [0, 1, 2, 3, 4, 5];
        gameState.canRoll = true;
        gameState.hasRolled = false; // Reset hasRolled flag when switching players
        
        // Important: Ensure all score variables are reset when switching players
        gameState.turnScore = 0;
        gameState.selectedDiceScore = 0;
        
        // Update UI for player change
        player1Element.classList.toggle('active');
        player2Element.classList.toggle('active');
        currentPlayerElement.textContent = gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name;
        
        // Reset dice appearance
        diceElements.forEach(dice => {
            dice.classList.remove('selected', 'disabled');
            dice.classList.add('unrolled'); // Add unrolled class when switching players
        });
        
        displayMessage(`${gameState.currentPlayer === 1 ? gameState.player1Name : gameState.player2Name}'s turn. Roll the dice to begin.`);
        
        // Enable roll button, disable bank button
        rollButton.disabled = false;
        bankButton.disabled = true;
        
        // Add highlight to roll button
        rollButton.classList.add('highlighted');
    }

    function endGame(winner) {
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
    }    function updateUI() {
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
    }function displayMessage(message, isFarkle = false, isHotDice = false) {
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
});