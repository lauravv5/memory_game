// --- Elementos DOM ---
const backgroundMusic = document.getElementById('background-music');
const gameHeader = document.getElementById('game-header');
const headerTitle = document.getElementById('header-title');
const backButton = document.getElementById('back-button');
const pauseButton = document.getElementById('pause-button'); 

const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');

const gameTimerBar = document.getElementById('game-timer-bar');
const gameTimerProgressBar = document.getElementById('game-timer-progress-bar');
const gameTimerValue = document.getElementById('game-timer-value');

const statusMessage = document.getElementById('status-message');
const menuTitle = document.getElementById('menu-title');
const messageText = document.getElementById('message-text');
const normalModeButton = document.getElementById('normal-mode-button');
const hardModeButton = document.getElementById('hard-mode-button');
const relaxModeButton = document.getElementById('relax-mode-button'); // NUEVO BOTÓN
const startButton = document.getElementById('start-button');
const modeSelectionDiv = document.getElementById('mode-selection');
const highScoreDisplay = document.getElementById('high-score-display'); 

const previewOverlay = document.getElementById('preview-overlay');
const previewCountdown = document.getElementById('preview-countdown');
const previewOkButton = document.getElementById('preview-ok-button');

const pauseMenu = document.getElementById('pause-menu'); 
const resumeButton = document.getElementById('resume-button');
const quitButton = document.getElementById('quit-button');

const usePowerupButton = document.getElementById('use-powerup-button'); // NUEVO BOTÓN

// --- Variables de Estado del Juego ---
const cardIcons = ['🍎', '🍌', '🍇', '🍉', '🍓', '🥝', '🥭', '🍍', '🍒', '🍕', '🚗', '💡', '⏰', '🚀', '🎁', '🎈', '⚙️', '💎', '⚽', '🎧', '🎸', '💻', '📷', '🔑']; 
let cards = [];
let flippedCards = []; 
let score = 0;
let lives = 0;
let matchesFound = 0;
let totalPairs = 0;
let canFlip = true;
let currentLevel = 1;
let currentMode = null; 
let powerUps = 0; // NUEVA VARIABLE PARA POWER-UPS

let gameTimerInterval = null; 
let gameTimeRemaining = 0; 
let previewCountdownTimeout = null; 
let previewOverlayInterval = null; 

const OVERLAY_COUNTDOWN_TIME = 3; 

// --- Configuración de Modos y Niveles ---
const MIN_LIVES_NORMAL = 2;
const MIN_LIVES_DIFICIL = 1;

const GAME_SETTINGS = {
    normal: {
        initialLives: 5, 
        previewTimeBase: 4,     
        previewTimeScale: 0.35,  
        gameTimePerPair: 7,     
        gameTimeScale: 0.3,     
        levels: [
            { level: 1, pairs: 4, size: 4 },  
            { level: 2, pairs: 6, size: 4 },
            { level: 3, pairs: 8, size: 4 },
            { level: 4, pairs: 10, size: 5 }, 
            { level: 5, pairs: 12, size: 5 },
            { level: 6, pairs: 14, size: 6 }, 
            { level: 7, pairs: 16, size: 6 },
            { level: 8, pairs: 18, size: 6 }, 
            { level: 9, pairs: 20, size: 7 }  
        ]
    },
    dificil: {
        initialLives: 3, 
        previewTimeBase: 2,     
        previewTimeScale: 0.2,  
        gameTimePerPair: 5,     
        gameTimeScale: 0.2,     
        levels: [
            { level: 1, pairs: 6, size: 4 },  
            { level: 2, pairs: 8, size: 4 },
            { level: 3, pairs: 10, size: 5 }, 
            { level: 4, pairs: 12, size: 5 },
            { level: 5, pairs: 15, size: 6 }, 
            { level: 6, pairs: 18, size: 6 },
            { level: 7, pairs: 21, size: 7 }, 
            { level: 8, pairs: 24, size: 7 }, 
            { level: 9, pairs: 28, size: 8 }  
        ]
    },
    // NUEVO MODO RELAX
    relax: {
        initialLives: Infinity, 
        previewTimeBase: 5, 
        previewTimeScale: 0, // Sin reducción de tiempo
        gameTimePerPair: Infinity, 
        levels: [ // Se mantiene la misma progresión de Normal
            { level: 1, pairs: 4, size: 4 },  
            { level: 2, pairs: 6, size: 4 },
            { level: 3, pairs: 8, size: 4 },
            { level: 4, pairs: 10, size: 5 }, 
            { level: 5, pairs: 12, size: 5 },
            { level: 6, pairs: 14, size: 6 }, 
            { level: 7, pairs: 16, size: 6 },
            { level: 8, pairs: 18, size: 6 }, 
            { level: 9, pairs: 20, size: 7 }  
        ]
    }
};

// --- Funciones de Utilidad ---

function updatePowerupDisplay() {
    usePowerupButton.textContent = `💡 Pista (${powerUps})`;
    usePowerupButton.disabled = powerUps <= 0 || !canFlip || currentMode === 'relax'; 
    usePowerupButton.classList.toggle('hidden', currentMode === 'relax'); // Ocultar en modo relax
}

function getHighScore() {
    return parseInt(localStorage.getItem('memoryHighScore') || 0);
}

function saveHighScore() {
    const currentHighScore = getHighScore();
    if (score > currentHighScore) {
        localStorage.setItem('memoryHighScore', score);
        return true;
    }
    return false;
}

function playMusic() {
    try {
        backgroundMusic.volume = 0.5; 
        backgroundMusic.play();
    } catch (e) {
        console.warn("Música no pudo iniciar.");
    }
}

function pauseMusic() {
    backgroundMusic.pause();
}

// --- Funciones de Juego ---

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateGameInfo() {
    livesDisplay.innerHTML = `❤️ Vidas: <b>${currentMode === 'relax' ? '∞' : lives}</b>`; // Vidas infinitas en relax
    scoreDisplay.innerHTML = `⭐ Puntuación: <b>${score}</b>`;
}

function updateHeader(title, isGameActive = false) {
    headerTitle.textContent = title;
    
    if (isGameActive) {
        pauseButton.classList.remove('hidden');
        backButton.classList.add('hidden');
    } else {
        pauseButton.classList.add('hidden');
        backButton.classList.toggle('hidden', currentMode === null);
    }
}

function generateBoard(pairsCount, boardSize) {
    gameBoard.innerHTML = '';
    
    const pairsToUse = cardIcons.slice(0, pairsCount);
    let gameCards = pairsToUse.flatMap(icon => [icon, icon]);
    shuffle(gameCards);
    
    totalPairs = pairsCount;
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    
    let sizeValue;
    if (boardSize >= 8) { sizeValue = '55px'; } 
    else if (boardSize >= 7) { sizeValue = '65px'; } 
    else if (boardSize >= 6) { sizeValue = '75px'; } 
    else if (boardSize >= 5) { sizeValue = '80px'; }
    else { sizeValue = '100px'; }
    document.documentElement.style.setProperty('--card-size', sizeValue);

    cards = gameCards.map((icon) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.icon = icon;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-back">?</div>
                <div class="card-face">${icon}</div>
            </div>
        `;
        
        card.addEventListener('click', () => flipCard(card));
        gameBoard.appendChild(card);
        return card;
    });
}

function flipCard(card) {
    const cardInner = card.querySelector('.card-inner');
    const isFlipped = card.classList.contains('flipped');
    const isMatched = card.classList.contains('matched');
    
    if (!canFlip || isFlipped || isMatched || flippedCards.length >= 2) return;

    card.classList.add('flipped');
    flippedCards.push(card);
    updatePowerupDisplay(); // Actualizar el estado del botón Power-up

    if (flippedCards.length === 2) {
        canFlip = false; 
        setTimeout(checkMatch, 900); 
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.icon === card2.dataset.icon) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        score += 100 + (currentLevel * 50); 
        matchesFound++;
        
        if (matchesFound === totalPairs) {
            clearInterval(gameTimerInterval);
            setTimeout(() => endGame(true), 500); 
        }
    } else {
        // En modo Relax no se pierden vidas
        if (currentMode !== 'relax') {
            lives--;
            
            const card1Inner = card1.querySelector('.card-inner');
            const card2Inner = card2.querySelector('.card-inner');
            card1Inner.classList.add('mismatch-shake');
            card2Inner.classList.add('mismatch-shake');
            
            setTimeout(() => {
                card1Inner.classList.remove('mismatch-shake');
                card2Inner.classList.remove('mismatch-shake');
            }, 300); 
            
            if (lives === 0) {
                clearInterval(gameTimerInterval);
                setTimeout(() => endGame(false), 800);
            }
        }
        
        // Se voltean al terminar
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
        }, currentMode === 'relax' ? 500 : 300); 
    }

    flippedCards = [];
    canFlip = true;
    updateGameInfo();
    updatePowerupDisplay();
}

// NUEVA FUNCIÓN DE POWER-UP
function usePowerup() {
    if (powerUps > 0 && canFlip && currentMode !== 'relax' && flippedCards.length === 0) {
        // 1. Encontrar una pareja no emparejada
        const unmatchedCards = cards.filter(card => !card.classList.contains('matched'));
        if (unmatchedCards.length < 2) return; // No hay suficientes cartas para revelar

        const iconToReveal = unmatchedCards[0].dataset.icon;
        const pair = unmatchedCards.filter(card => card.dataset.icon === iconToReveal).slice(0, 2);

        if (pair.length === 2) {
            canFlip = false;
            powerUps--;
            score += 250; // Pequeño bonus por usar la pista

            // 2. Revelar y marcar como emparejadas
            pair[0].classList.add('flipped', 'matched');
            pair[1].classList.add('flipped', 'matched');

            matchesFound++;
            
            // 3. Actualizar displays
            updateGameInfo();
            updatePowerupDisplay();
            
            // 4. Revisar si el nivel terminó
            if (matchesFound === totalPairs) {
                clearInterval(gameTimerInterval);
                setTimeout(() => endGame(true), 500); 
            }
            
            canFlip = true;
        }
    }
}


// --- Mecánica de Previsualización ---

function startPreviewOverlay(visualTime) {
    let countdown = OVERLAY_COUNTDOWN_TIME;
    previewCountdown.textContent = countdown;
    previewOverlay.classList.remove('hidden');

    cards.forEach(card => card.classList.add('flipped'));
    previewOkButton.classList.add('hidden'); 
    
    previewOverlayInterval = setInterval(() => {
        countdown--;
        previewCountdown.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(previewOverlayInterval);
            previewOverlay.classList.add('hidden');
            startCardVisualisationTimer(visualTime);
        }
    }, 1000);
}

function startCardVisualisationTimer(time) {
    canFlip = false; 
    
    // En modo Relax, no hay tiempo de visualización forzada, se mantiene visible hasta el primer flip
    if (currentMode === 'relax') {
        canFlip = true;
        startGameTimer(); // Llama para ocultar el timer bar
        return;
    }

    previewCountdownTimeout = setTimeout(() => {
        hideAllCards();
        startGameTimer(); 
        canFlip = true;
    }, time * 1000);
}

function hideAllCards() {
    cards.forEach(card => {
        if (!card.classList.contains('matched')) {
            card.classList.remove('flipped');
        }
    });
}

// --- Temporizador de Juego ---

function startGameTimer() {
    clearInterval(gameTimerInterval);
    
    // Si es modo Relax, simplemente ocultamos la barra de tiempo y salimos
    if (currentMode === 'relax') {
        gameTimerBar.classList.add('hidden');
        return;
    }

    // Lógica normal de temporizador
    gameTimerBar.classList.remove('hidden');
    
    const modeConfig = GAME_SETTINGS[currentMode];
    const levelConfig = modeConfig.levels[currentLevel - 1];
    
    let timePerPair = modeConfig.gameTimePerPair;
    if (currentLevel > 3) timePerPair -= modeConfig.gameTimeScale;
    if (currentLevel > 6) timePerPair -= modeConfig.gameTimeScale;
    
    timePerPair = Math.max(timePerPair, 3); 

    const initialTime = levelConfig.pairs * timePerPair;
    gameTimeRemaining = initialTime;

    gameTimerProgressBar.style.width = '100%';
    gameTimerProgressBar.classList.remove('warning');
    gameTimerValue.textContent = `${gameTimeRemaining} / ${initialTime}`;

    gameTimerInterval = setInterval(() => {
        gameTimeRemaining--;
        const progressPercentage = (gameTimeRemaining / initialTime) * 100;
        gameTimerProgressBar.style.width = `${progressPercentage}%`;
        gameTimerValue.textContent = `${gameTimeRemaining} / ${initialTime}`;

        if (gameTimeRemaining <= initialTime / 4 && gameTimeRemaining > 0) {
            gameTimerProgressBar.classList.add('warning');
        } else {
            gameTimerProgressBar.classList.remove('warning');
        }

        if (gameTimeRemaining <= 0) {
            clearInterval(gameTimerInterval);
            endGame('TIME_OUT');
        }
    }, 1000);
}

// --- Menú de Pausa ---

function togglePause(isPaused) {
    if (isPaused) {
        clearInterval(gameTimerInterval);
        clearTimeout(previewCountdownTimeout);
        clearInterval(previewOverlayInterval);
        canFlip = false;
        pauseMusic();
        pauseMenu.classList.remove('hidden');
        pauseButton.classList.add('hidden');
        updateHeader('Juego Pausado', false);
    } else {
        if (!previewOverlay.classList.contains('hidden')) {
             loadLevel(); 
             return;
        }

        startGameTimer(); 
        canFlip = true;
        playMusic();
        pauseMenu.classList.add('hidden');
        pauseButton.classList.remove('hidden');
        updateHeader(`Nivel ${currentLevel} - ${currentMode === 'relax' ? 'Relax' : (currentMode === 'normal' ? 'Normal' : 'Difícil')}`, true);
        updatePowerupDisplay();
    }
}


// --- Lógica de Niveles y Menús ---

function loadLevel() {
    const modeConfig = GAME_SETTINGS[currentMode];
    const levelConfig = modeConfig.levels[currentLevel - 1]; 
    
    if (!levelConfig) {
        endGame('MODE_COMPLETE');
        return;
    }
    
    clearInterval(gameTimerInterval);
    clearTimeout(previewCountdownTimeout);
    clearInterval(previewOverlayInterval);

    matchesFound = 0;
    canFlip = false; 
    flippedCards = [];

    // Lógica de Vidas
    const minLives = currentMode === 'normal' ? MIN_LIVES_NORMAL : MIN_LIVES_DIFICIL;
    
    if (currentMode === 'relax') {
        lives = Infinity; // En modo relax
    } else if (currentLevel === 1) {
        lives = modeConfig.initialLives;
    } else {
        const initialModeLives = modeConfig.initialLives;
        const livesLostByLevel = currentLevel - 1;
        lives = Math.max(minLives, initialModeLives - livesLostByLevel);
    }
    
    // Lógica de Power-ups (solo en modos con tiempo)
    if (currentMode !== 'relax' && currentLevel % 3 === 0 && currentLevel > 0) {
        powerUps++; // Ganas 1 power-up cada 3 niveles
    }

    generateBoard(levelConfig.pairs, levelConfig.size);
    updateGameInfo();
    updatePowerupDisplay();
    statusMessage.classList.add('hidden');
    gameTimerBar.classList.add('hidden');

    const headerText = `Nivel ${currentLevel} - ${currentMode === 'relax' ? 'Relax' : (currentMode === 'normal' ? 'Normal' : 'Difícil')}`;
    updateHeader(headerText, true);
    
    // Calcular tiempo de VISUALIZACIÓN
    let calculatedVisualTime = modeConfig.previewTimeBase - (currentLevel - 1) * modeConfig.previewTimeScale;
    calculatedVisualTime = Math.max(0.5, calculatedVisualTime);
    
    playMusic();
    startPreviewOverlay(calculatedVisualTime);
}

function endGame(status) {
    canFlip = false;
    clearInterval(gameTimerInterval);
    clearTimeout(previewCountdownTimeout);
    clearInterval(previewOverlayInterval);
    pauseMusic(); 

    const isNewRecord = saveHighScore(); 
    // Limpiar Power-ups si el modo terminó o se hizo Game Over
    if (status === 'MODE_COMPLETE' || status === false || status === 'TIME_OUT') {
         powerUps = 0;
    }

    modeSelectionDiv.classList.add('hidden');
    startButton.classList.remove('hidden');
    gameTimerBar.classList.add('hidden');
    pauseButton.classList.add('hidden');
    usePowerupButton.classList.add('hidden'); // Ocultar el botón

    let message = '';
    let buttonText = '';
    
    if (status === true || status === 'MODE_COMPLETE') {
        if (status === 'MODE_COMPLETE') {
            message = `🏆 ¡MODO ${currentMode.toUpperCase()} TERMINADO! 🏆<br>Puntuación Final: **${score}**`;
            buttonText = 'Elegir Modo Nuevo';
            currentMode = null; 
        } else {
            currentLevel++;
            message = `🎉 ¡NIVEL ${currentLevel - 1} COMPLETADO! 🎉<br>Puntuación Total: **${score}**`;
            buttonText = `Iniciar Nivel ${currentLevel}`;
        }
        menuTitle.textContent = '¡Felicidades!';
        
    } else {
        const statusText = status === 'TIME_OUT' ? '⏰ ¡SE ACABÓ EL TIEMPO!' : '💀 ¡GAME OVER!';
        message = `${statusText}<br>Modo: ${currentMode.toUpperCase()}. Puntuación Final: **${score}**`;
        buttonText = 'Volver al Menú Principal';
        currentMode = null; 
        menuTitle.textContent = '¡Oops!';
    }
    
    if (isNewRecord) {
        message += `<br><span style="color: var(--secondary-color);">¡NUEVO RÉCORD! 🥳</span>`;
    }

    messageText.innerHTML = message;
    startButton.textContent = buttonText;
    statusMessage.classList.remove('hidden');
    updateHeader('Game Over', false); 
}

// Muestra la pantalla inicial de selección de modo
function showModeSelection() {
    currentMode = null; 
    currentLevel = 1;
    score = 0;
    powerUps = 0;
    
    const highScore = getHighScore();
    highScoreDisplay.textContent = `🏆 Récord: ${highScore}`;
    highScoreDisplay.classList.remove('hidden');

    menuTitle.textContent = '✨ Pro Memory Match ✨';
    messageText.innerHTML = 'Selecciona un modo de juego para comenzar.';
    modeSelectionDiv.classList.remove('hidden');
    startButton.classList.add('hidden');
    statusMessage.classList.remove('hidden');
    pauseMenu.classList.add('hidden'); 
    gameBoard.innerHTML = ''; 
    updateGameInfo(); 
    updatePowerupDisplay();
    usePowerupButton.classList.add('hidden');
    
    document.documentElement.style.setProperty('--card-size', '100px');
    gameBoard.style.gridTemplateColumns = `repeat(4, 1fr)`;
    updateHeader('Seleccionar modo', false);
    
    pauseMusic();
}


// --- Event Listeners ---
normalModeButton.addEventListener('click', () => {
    currentMode = 'normal';
    currentLevel = 1;
    playMusic();
    loadLevel();
});

hardModeButton.addEventListener('click', () => {
    currentMode = 'dificil';
    currentLevel = 1;
    playMusic();
    loadLevel();
});

// NUEVO EVENT LISTENER PARA MODO RELAX
relaxModeButton.addEventListener('click', () => {
    currentMode = 'relax';
    currentLevel = 1;
    playMusic();
    loadLevel();
});

startButton.addEventListener('click', () => {
    if (!currentMode) {
        showModeSelection();
    } else {
        loadLevel();
    }
});

pauseButton.addEventListener('click', () => {
    togglePause(true);
});

resumeButton.addEventListener('click', () => {
    togglePause(false);
});

quitButton.addEventListener('click', () => {
    showModeSelection();
});

backButton.addEventListener('click', showModeSelection);

previewOkButton.addEventListener('click', () => {
    clearInterval(previewOverlayInterval);
    previewOverlay.classList.add('hidden');
    
    const modeConfig = GAME_SETTINGS[currentMode];
    let calculatedVisualTime = modeConfig.previewTimeBase - (currentLevel - 1) * modeConfig.previewTimeScale;
    calculatedVisualTime = Math.max(0.5, calculatedVisualTime);

    startCardVisualisationTimer(calculatedVisualTime);
});

// NUEVO EVENT LISTENER PARA POWER-UP
usePowerupButton.addEventListener('click', usePowerup);


// Inicializa el juego mostrando la pantalla de selección de modo
window.onload = showModeSelection;