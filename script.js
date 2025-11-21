// --- Variables Globales del Juego ---
const cardIcons = ['🍎', '🍌', '🍇', '🍉', '🍓', '🥝', '🥭', '🍍', '🍒', '🍕', '🚗', '💡', '⏰', '🚀', '🎁', '🎈', '⚙️', '💎']; // Suficientes iconos para los niveles más difíciles

const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score-display');
const livesDisplay = document.getElementById('lives-display');
const statusMessage = document.getElementById('status-message');
const messageText = document.getElementById('message-text');

// Nuevos botones y elementos del menú
const normalModeButton = document.getElementById('normal-mode-button');
const hardModeButton = document.getElementById('hard-mode-button');
const startButton = document.getElementById('start-button');
const modeSelectionDiv = document.getElementById('mode-selection');

// --- Variables de Estado del Juego ---
let cards = [];
let flippedCards = []; 
let score = 0;
let lives = 0;
let matchesFound = 0;
let totalPairs = 0;
let canFlip = true;
let currentLevel = 1;
let currentMode = null; // 'normal' o 'dificil'

// --- Configuración de Modos y Niveles (¡El Corazón de la Dificultad!) ---

const GAME_SETTINGS = {
    normal: {
        initialLives: 4, // Más vidas para el modo Normal
        levels: [
            { level: 1, pairs: 4, size: 4 }, // 8 cartas (3x3 o 4x2)
            { level: 2, pairs: 6, size: 4 }, // 12 cartas (4x3)
            { level: 3, pairs: 8, size: 4 }, // 16 cartas (4x4)
            { level: 4, pairs: 10, size: 5 },// 20 cartas (5x4)
            { level: 5, pairs: 12, size: 6 } // 24 cartas (6x4)
        ]
    },
    dificil: {
        initialLives: 3, // Menos vidas para el modo Difícil
        levels: [
            { level: 1, pairs: 6, size: 4 }, // 12 cartas (4x3)
            { level: 2, pairs: 8, size: 4 }, // 16 cartas (4x4)
            { level: 3, pairs: 12, size: 5 },// 24 cartas (6x4)
            { level: 4, pairs: 15, size: 6 },// 30 cartas (6x5)
            { level: 5, pairs: 18, size: 6 } // 36 cartas (6x6)
        ]
    }
};

// --- Funciones de Utilidad ---

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateGameInfo() {
    scoreDisplay.textContent = `⭐ Puntuación: ${score}`;
    livesDisplay.textContent = `❤️ Vidas: ${lives} | Nivel: ${currentLevel}`;
}

// --- Lógica del Tablero y Cartas ---

function generateBoard(pairsCount, boardSize) {
    gameBoard.innerHTML = '';
    
    // 1. Crear el array de cartas (duplicar iconos)
    const pairsToUse = cardIcons.slice(0, pairsCount);
    let gameCards = pairsToUse.flatMap(icon => [icon, icon]);
    shuffle(gameCards);
    
    totalPairs = pairsCount;
    
    // 2. Determinar la cuadrícula
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    // Ajustar el tamaño de la carta para tableros grandes (mejorar la estética)
    if (boardSize >= 6) {
         document.documentElement.style.setProperty('--card-size', '80px');
    } else {
         document.documentElement.style.setProperty('--card-size', '100px');
    }

    // 3. Crear elementos DOM
    cards = gameCards.map((icon, index) => {
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
    const isFlipped = card.classList.contains('flipped');
    const isMatched = card.classList.contains('matched');
    
    if (!canFlip || isFlipped || isMatched || flippedCards.length >= 2) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        canFlip = false; 
        setTimeout(checkMatch, 1000); 
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.icon === card2.dataset.icon) {
        // --- COINCIDENCIA ENCONTRADA ---
        card1.classList.add('matched');
        card2.classList.add('matched');
        score += 100 + (currentLevel * 10); // Más puntos por nivel
        matchesFound++;
        
        if (matchesFound === totalPairs) {
            // Pasó el nivel
            setTimeout(() => endGame(true), 500); 
        }
    } else {
        // --- NO COINCIDENCIA (¡Costo de Vida!) ---
        lives--;
        
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');

        if (lives === 0) {
            // Game Over
            setTimeout(() => endGame(false), 500);
        }
    }

    flippedCards = [];
    canFlip = true;
    updateGameInfo();
}

// --- Lógica de Niveles y Menús ---

function loadLevel() {
    // 1. Obtener la configuración del nivel actual
    const modeConfig = GAME_SETTINGS[currentMode];
    const levelConfig = modeConfig.levels[currentLevel - 1]; // -1 porque el array es base 0
    
    if (!levelConfig) {
        // Si no hay más niveles, el jugador ha ganado el modo
        endGame('MODE_COMPLETE');
        return;
    }

    // 2. Resetear variables para el nuevo nivel
    matchesFound = 0;
    canFlip = true;
    flippedCards = [];

    // Las vidas solo se inician al principio, no en cada nivel
    if (currentLevel === 1) {
        lives = modeConfig.initialLives;
    }

    // 3. Generar el tablero
    generateBoard(levelConfig.pairs, levelConfig.size);
    updateGameInfo();
    statusMessage.classList.add('hidden');
}

function endGame(status) {
    canFlip = false;
    modeSelectionDiv.classList.add('hidden'); // Ocultar botones de modo
    startButton.classList.remove('hidden'); // Mostrar botón de continuar
    
    let message = '';
    
    if (status === true) {
        // Nivel Completado
        currentLevel++;
        message = `¡NIVEL ${currentLevel - 1} COMPLETADO! 🎉<br>Puntuación: ${score}`;
        startButton.textContent = `Iniciar Nivel ${currentLevel}`;
        
    } else if (status === 'MODE_COMPLETE') {
        // Modo Completo (Ganó el juego)
        message = `¡MODO ${currentMode.toUpperCase()} COMPLETADO! 🏆<br>Eres un maestro de la memoria. Puntuación Final: ${score}`;
        startButton.textContent = 'Elegir Modo Nuevo';
        currentMode = null; // Reinicia el modo
        
    } else {
        // Game Over (Perdió las vidas)
        message = `¡GAME OVER! 😭<br>Modo: ${currentMode.toUpperCase()}. Puntuación Final: ${score}`;
        startButton.textContent = 'Volver al Menú Principal';
        currentMode = null; // Reinicia el modo
    }
    
    messageText.innerHTML = message;
    statusMessage.classList.remove('hidden');
}

// Muestra la pantalla inicial de selección de modo
function showModeSelection() {
    currentLevel = 1;
    score = 0;
    
    messageText.innerHTML = 'Selecciona un modo de juego para comenzar.';
    modeSelectionDiv.classList.remove('hidden');
    startButton.classList.add('hidden');
    statusMessage.classList.remove('hidden');
    gameBoard.innerHTML = ''; // Limpia el tablero
    updateGameInfo(); // Muestra 0 vidas / Nivel 1
}


// --- Event Handlers (Manejo de Clics) ---

normalModeButton.addEventListener('click', () => {
    currentMode = 'normal';
    currentLevel = 1;
    loadLevel();
});

hardModeButton.addEventListener('click', () => {
    currentMode = 'dificil';
    currentLevel = 1;
    loadLevel();
});

startButton.addEventListener('click', () => {
    if (!currentMode) {
        // Si currentMode es nulo, estamos volviendo al menú principal
        showModeSelection();
    } else {
        // Si currentMode existe, significa que es para cargar el siguiente nivel
        loadLevel();
    }
});

// Inicializa el juego mostrando la pantalla de selección de modo
window.onload = showModeSelection;