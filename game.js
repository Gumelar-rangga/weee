/* ============================================
   LOVE DEFENDER - Valentine's Day Game
   Game Logic JavaScript
   ============================================ */

// --- KONFIGURASI GAME ---
// --- KONFIGURASI GAME ---
const CONFIG = {
    playerSpeed: 5,
    spawnRate: 1000,        // Semakin kecil, semakin sering spawn
    maxItems: 15,
    winScore: 3,
    difficultyIncrease: 0.95, // Semakin besar dari 1, semakin cepat naikin kesulitan
    
    // 👇 TAMBAHKAN INI:
    baseSpeed: 5,           // Kecepatan dasar (default: 3-5)
    maxSpeed: 10            // Kecepatan maksimal (default: 8-10)
};

// --- VARIABEL GAME ---
let canvas, ctx;
let gameRunning = false;
let score = 0;
let lives = 5;
let playerX = 50;
let items = [];
let particles = [];
let comedyMessages = [];
let lastSpawnTime = 0;
let animationId;
let touchStartX = 0;
let keysPressed = {};
let difficulty = 1;

// --- EMOJI UNTUK GAME ---
const ITEMS = {
    good: ['❤️', '💕', '💗', '💖', '💓', '💑', '🌹', '💐', '🎁', '💌'],
    bad: ['💔', '😈', '💀', '👿', '⏰', '💸', '📱', '🚗', '💼', '💻'],
    special: ['😘', '🥰', '😍', '🤗']
};

// --- PESAN KOMEDI ---
const COMEDY_MESSAGES = [
    "Jangan selingkuh ya! 😤",
    "Makan dulu sayang! 🍽️",
    "Jangan lupa bayar tagihan! 💸",
    "PACAR ORANG GAK BOLEH! 😠",
    "Istriku di rumah! 👀",
    "Makan yang banyak ya! 🍕",
    "Jangan lupa istirahat! 😴",
    "Janji jangan dilanggar! 🤥",
    "Chat yang bales dong! 📱",
    "Deadline mendekat! ⏰",
    "Jangan lupa ultahku! 🎂",
    "Beliin makan malam! 🍜",
    "Jangan main HP melulu! 📵",
    "Rumah tangga butuh uang! 💰",
    "PACAR SAYA INI! 😍"
];

// --- PESAN ROMANTIS (WIN) ---
const WIN_MESSAGES = [
    "Kamu yang terbaik! 💕",
    "Cinta sejati itu kita! ❤️",
    "Forever with you! 💍",
    "Kamu adalah takdirku! ✨",
    "Berdua sampai tua! 👴👵",
    "Cinta kita abadi! 🌟"
];

// --- SURAT UNTUK PACAR ---
const LOVE_LETTER = `
💕 <b>Sayangku yang Tercinta,</b> 💕

Di hari Valentine ini, aku ingin mengingatkanmu 
bahwa kamu adalah keputusan terbaik yang pernah 
aku buat dalam hidupku.

Setiap hari bersamamu adalah hadiah. 
Tawamu membuatku lupa masalah, 
senyummu membuatku semangat,
dan kehadiranmu membuatku lengkap.

Maafkan semua kesalahanku. 
Aku janji akan selalu berusaha menjadi 
yang terbaik untukmu.

Terima kasih telah bertahan denganku, 
mencintaiku apa adanya, dan 
tidak pernah menyerah.

<b>I Love You Forever! 💕</b>

<b>- Pasanganmu ❤️</b>
`;

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    // Setup canvas
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Resize canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Setup controls
    setupControls();
    
    // Setup background hearts
    createBackgroundHearts();
    
    // Update player position
    updatePlayerPosition();
});

// --- RESIZE CANVAS ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updatePlayerPosition();
}

// --- UPDATE PLAYER POSITION ---
function updatePlayerPosition() {
    const player = document.getElementById('player');
    if (player) {
        player.style.left = playerX + '%';
        player.style.transform = 'translateX(-50%)';
    }
}

// --- SETUP CONTROLS ---
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });
    
    // Touch controls
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        
        if (Math.abs(diff) > 10) {
            if (diff > 0) {
                keysPressed['ArrowRight'] = true;
                keysPressed['ArrowLeft'] = false;
            } else {
                keysPressed['ArrowLeft'] = true;
                keysPressed['ArrowRight'] = false;
            }
            touchStartX = touchX;
        }
    });
    
    document.addEventListener('touchend', () => {
        keysPressed['ArrowLeft'] = false;
        keysPressed['ArrowRight'] = false;
    });
}

// --- CREATE BACKGROUND HEARTS ---
function createBackgroundHearts() {
    const container = document.getElementById('gameContainer');
    const heartCount = 15;
    
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div');
        heart.className = 'bg-heart';
        heart.innerHTML = '❤️';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDelay = Math.random() * 8 + 's';
        heart.style.animationDuration = (Math.random() * 5 + 5) + 's';
        container.appendChild(heart);
    }
}

// --- START GAME ---
function startGame() {
    // Reset variables
    score = 0;
    lives = 5;
    items = [];
    particles = [];
    difficulty = 1;
    gameRunning = true;
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    
    // Hide screens
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
    document.getElementById('messageModal').classList.add('hidden');
    
    // Reset player position
    playerX = 50;
    updatePlayerPosition();
    
    // Start game loop
    lastSpawnTime = Date.now();
    gameLoop();
}

// --- RESTART GAME ---
function restartGame() {
    startGame();
}

// --- GAME LOOP ---
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle player movement
    handlePlayerMovement();
    
    // Spawn items
    spawnItems();
    
    // Update and draw items
    updateItems();
    
    // Update and draw particles
    updateParticles();
    
    // Check win condition
    if (score >= CONFIG.winScore) {
        winGame();
        return;
    }
    
    // Continue loop
    animationId = requestAnimationFrame(gameLoop);
}

// --- HANDLE PLAYER MOVEMENT ---
function handlePlayerMovement() {
    const speed = CONFIG.playerSpeed;
    
    if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) {
        playerX = Math.max(5, playerX - speed * 0.5);
    }
    if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) {
        playerX = Math.min(95, playerX + speed * 0.5);
    }
    
    updatePlayerPosition();
}

// --- SPAWN ITEMS ---
function spawnItems() {
    const now = Date.now();
    const spawnInterval = CONFIG.spawnRate / difficulty;
    
    if (now - lastSpawnTime > spawnInterval && items.length < CONFIG.maxItems) {
        createItem();
        lastSpawnTime = now;
        
        // Increase difficulty
        difficulty = Math.min(difficulty * CONFIG.difficultyIncrease, 3);
    }
}

// --- CREATE ITEM ---
function createItem() {
    const isGood = Math.random() > 0.35;
    const type = isGood ? 'good' : 'bad';
    const emojiList = ITEMS[type];
    const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
    
    const item = {
        x: Math.random() * (canvas.width - 60) + 30,
        y: -50,
        emoji: emoji,
        type: type,
        speed: (Math.random() * 3 + 2) * difficulty,
        size: 40,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    
    items.push(item);
}

// --- UPDATE ITEMS ---
function updateItems() {
    const player = document.getElementById('player');
    const playerRect = player.getBoundingClientRect();
    
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        
        // Move item
        item.y += item.speed;
        item.rotation += item.rotationSpeed;
        
        // Draw item
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.font = item.size + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();
        
        // Check collision with player
        if (checkCollision(item, playerRect)) {
            if (item.type === 'good') {
                collectItem(item, true);
            } else {
                collectItem(item, false);
            }
            items.splice(i, 1);
            continue;
        }
        
        // Remove if off screen
        if (item.y > canvas.height + 50) {
            items.splice(i, 1);
        }
    }
}

// --- CHECK COLLISION ---
function checkCollision(item, playerRect) {
    const itemCenterX = item.x;
    const itemCenterY = item.y;
    
    return (
        itemCenterX > playerRect.left &&
        itemCenterX < playerRect.right &&
        itemCenterY > playerRect.top &&
        itemCenterY < playerRect.bottom
    );
}

// --- COLLECT ITEM ---
function collectItem(item, isGood) {
    if (isGood) {
        score++;
        document.getElementById('score').textContent = score;
        createParticles(item.x, item.y, '#ff6b6b');
        showComedyMessage("+1 Cinta! 💕");
    } else {
        lives--;
        document.getElementById('lives').textContent = lives;
        createParticles(item.x, item.y, '#666');
        shakeScreen();
        showComedyMessage(getRandomComedyMessage());
        
        if (lives <= 0) {
            gameOver();
            return;
        }
    }
}

// --- GET RANDOM COMEDY MESSAGE ---
function getRandomComedyMessage() {
    return COMEDY_MESSAGES[Math.floor(Math.random() * COMEDY_MESSAGES.length)];
}

// --- SHOW COMEDY MESSAGE ---
function showComedyMessage(message) {
    const popup = document.createElement('div');
    popup.className = 'comedy-popup';
    popup.textContent = message;
    popup.style.left = (Math.random() * 60 + 20) + '%';
    popup.style.top = '30%';
    document.getElementById('gameContainer').appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// --- CREATE PARTICLES ---
function createParticles(x, y, color) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = (Math.random() * 10 + 5) + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = color;
        document.getElementById('gameContainer').appendChild(particle);
        
        // Animate particle
        const angle = (Math.PI * 2 / particleCount) * i;
        const velocity = Math.random() * 50 + 30;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => particle.remove();
    }
}

// --- UPDATE PARTICLES ---
function updateParticles() {
    // Particles are handled by CSS animations
}

// --- SHAKE SCREEN ---
function shakeScreen() {
    const container = document.getElementById('gameContainer');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}

// --- GAME OVER ---
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Show game over screen
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    
    // Set rating based on score
    let rating = '';
    if (score >= 45) {
        rating = "Pacarmu pasti bangga! 🌟";
    } else if (score >= 30) {
        rating = "Lumayan lah! 😊";
    } else if (score >= 15) {
        rating = "Perlu latihan lagi... 😅";
    } else {
        rating = "Pacarmu pasti kecewa... 💔";
    }
    document.getElementById('rating').textContent = rating;
}

// --- WIN GAME ---
function winGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Show win screen
    document.getElementById('winScreen').classList.remove('hidden');
    
    // Show random win message
    const winMessage = WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
    document.getElementById('winMessage').textContent = winMessage;
    
    // Create celebration particles
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            createParticles(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                ['#ff6b6b', '#ff8fa3', '#ffc2d1', '#ffe5ec'][Math.floor(Math.random() * 4)]
            );
        }, i * 50);
    }
}

// --- SHOW LOVE MESSAGE ---
function showLoveMessage() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('messageModal').classList.remove('hidden');
    document.getElementById('loveLetter').innerHTML = LOVE_LETTER;
}

// --- CLOSE MESSAGE ---
function closeMessage() {
    document.getElementById('messageModal').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
}