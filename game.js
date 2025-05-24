// Game canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
canvas.width = 360;
canvas.height = 640;

// Game elements
const startScreen = document.querySelector('.start-screen');
const gameOverScreen = document.querySelector('.game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const highScoreDisplay = document.getElementById('high-score');

// Audio elements
const flapSound = document.getElementById('flap-sound');
const scoreSound = document.getElementById('score-sound');
const hitSound = document.getElementById('hit-sound');
const backgroundMusic = document.getElementById('background-music');

// Game variables
let bird;
let pipes = [];
let particles = [];
let stars = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameActive = false;
let gameSpeed = 1.0; // Very slow speed for super easy gameplay
let gravity = 0.12; // Extremely gentle gravity
let lastPipeTime = 0;
let pipeInterval = 3000; // Very long time between pipes
let lastTime = 0;
let animationId;
let gameStarted = false; // Track if game has been started
let invincible = true; // Make bird invincible for easier gameplay
let normalModeSettings = {
    gravity: 0.25,
    lift: -6.5,
    gameSpeed: 1.5,
    pipeInterval: 2500,
    pipeSpacing: 200
};

// Bird object
class Bird {
    constructor() {
        this.x = canvas.width / 3;
        this.y = canvas.height / 2;
        this.width = 40;
        this.height = 30;
        this.velocity = 0;
        this.lift = -5; // Very gentle lift for easier control
        this.rotation = 0;
        this.colors = {
            body: '#00ffff',
            highlight: '#ffffff',
            shadow: '#0088ff'
        };
        this.trailTimer = 0;
        // Add initial flap to prevent immediate falling
        this.velocity = this.lift / 2;
        
        // Apply normal mode settings if not invincible
        if (!invincible) {
            this.lift = normalModeSettings.lift;
        }
    }

    update() {
        // Apply gravity (use normal mode gravity if not invincible)
        const currentGravity = invincible ? gravity : normalModeSettings.gravity;
        this.velocity += currentGravity;
        this.y += this.velocity;
        
        // Limit maximum falling speed (different limits based on mode)
        const maxFallSpeed = invincible ? 5 : 8;
        if (this.velocity > maxFallSpeed) {
            this.velocity = maxFallSpeed;
        }
        
        // Rotate based on velocity (reduced rotation for less dramatic effect)
        const rotationFactor = invincible ? 0.02 : 0.03;
        const maxRotation = invincible ? Math.PI / 8 : Math.PI / 6;
        this.rotation = Math.min(maxRotation, Math.max(-maxRotation, this.velocity * rotationFactor));
        
        // Floor boundary - bounce in easy mode, game over in normal mode
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - this.height - 50;
            
            if (invincible) {
                this.velocity = -3; // Bounce up gently
                this.flap(); // Auto-flap when hitting the ground
            } else {
                this.velocity = 0;
                if (gameActive) {
                    gameOver();
                }
            }
        }
        
        // Ceiling boundary with bounce effect
        if (this.y < 0) {
            this.y = 0;
            this.velocity = invincible ? 1 : 2; // Gentler bounce in easy mode
        }
        
        // Create trail particles
        this.trailTimer++;
        if (this.trailTimer % 3 === 0 && gameActive) {
            particles.push(new Particle(
                this.x - 5,
                this.y + this.height / 2,
                Math.random() * 3 + 1,
                Math.random() * 3 + 1,
                '#00ffff',
                0.7
            ));
        }
    }

    flap() {
        // Use appropriate lift based on mode
        this.velocity = invincible ? this.lift : normalModeSettings.lift;
        try {
            flapSound.currentTime = 0;
            flapSound.play().catch(e => console.log("Audio couldn't play:", e));
        } catch (e) {
            console.log("Audio error:", e);
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Draw bird body (futuristic design)
        ctx.fillStyle = this.colors.body;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw highlight
        ctx.fillStyle = this.colors.highlight;
        ctx.beginPath();
        ctx.ellipse(-5, -5, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width / 4, -this.height / 6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glowing effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 + 2, this.height / 2 + 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw shield effect if invincible
        if (invincible) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width / 2 + 8, this.height / 2 + 8, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Pipe object
class Pipe {
    constructor() {
        // Use appropriate spacing based on mode
        this.spacing = invincible ? 250 : normalModeSettings.pipeSpacing;
        
        // More balanced pipe positions
        const minTopPosition = invincible ? 100 : 80;
        const minBottomSpace = invincible ? 150 : 120;
        const availableSpace = canvas.height - this.spacing - minTopPosition - minBottomSpace;
        
        this.top = Math.random() * availableSpace + minTopPosition;
        this.bottom = this.top + this.spacing;
        this.x = canvas.width;
        this.width = 60;
        this.scored = false;
        this.color = '#00ffff';
        this.highlight = '#ffffff';
        
        // Ensure minimum top and bottom space
        if (this.top < minTopPosition) this.top = minTopPosition;
        if (this.bottom > canvas.height - minBottomSpace) this.bottom = canvas.height - minBottomSpace;
    }

    update() {
        // Use appropriate speed based on mode
        const speed = invincible ? gameSpeed : normalModeSettings.gameSpeed;
        this.x -= speed;
        
        // Check if bird passed the pipe
        const scoringPoint = invincible ? this.x + this.width / 2 : this.x + this.width;
        if (!this.scored && bird.x > scoringPoint) {
            score++;
            scoreDisplay.textContent = score;
            this.scored = true;
            try {
                scoreSound.currentTime = 0;
                scoreSound.play().catch(e => console.log("Audio couldn't play:", e));
            } catch (e) {
                console.log("Audio error:", e);
            }
            
            // Create score particles
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(
                    bird.x + bird.width,
                    bird.y,
                    Math.random() * 3 - 1.5,
                    Math.random() * 3 - 1.5,
                    '#ffff00',
                    1
                ));
            }
        }
        
        // Check collision with bird - with hitbox based on mode
        // Only check collision if not invincible
        const hitboxPadding = invincible ? 15 : 5;
        if (!invincible && 
            bird.x + bird.width - hitboxPadding > this.x + hitboxPadding && 
            bird.x + hitboxPadding < this.x + this.width - hitboxPadding && 
            (bird.y + hitboxPadding < this.top - hitboxPadding || bird.y + bird.height - hitboxPadding > this.bottom + hitboxPadding)
        ) {
            gameOver();
        }
    }

    draw() {
        // Futuristic pipe design
        // Top pipe
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, 0, this.width, this.top);
        
        // Bottom pipe
        ctx.fillRect(this.x, this.bottom, this.width, canvas.height - this.bottom);
        
        // Pipe edges
        ctx.fillStyle = this.highlight;
        ctx.fillRect(this.x, this.top - 10, this.width, 10);
        ctx.fillRect(this.x, this.bottom, this.width, 10);
        
        // Glowing effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Top pipe outline
        ctx.strokeRect(this.x, 0, this.width, this.top);
        
        // Bottom pipe outline
        ctx.strokeRect(this.x, this.bottom, this.width, canvas.height - this.bottom);
        
        ctx.shadowBlur = 0;
        
        // Digital circuit pattern
        ctx.strokeStyle = '#003366';
        ctx.lineWidth = 1;
        
        for (let i = 5; i < this.width - 5; i += 10) {
            // Top pipe pattern
            ctx.beginPath();
            ctx.moveTo(this.x + i, 10);
            ctx.lineTo(this.x + i, this.top - 15);
            ctx.stroke();
            
            // Bottom pipe pattern
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.bottom + 15);
            ctx.lineTo(this.x + i, canvas.height - 10);
            ctx.stroke();
        }
    }
}

// Particle effects
class Particle {
    constructor(x, y, dx, dy, color, alpha) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.alpha = alpha;
        this.life = 30;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.life--;
        this.alpha -= 0.02;
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Background star
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speed = Math.random() * 0.3 + 0.1; // Slower stars
        this.brightness = Math.random();
        this.color = `rgba(255, 255, 255, ${this.brightness})`;
    }

    update() {
        this.x -= this.speed;
        if (this.x < 0) {
            this.x = canvas.width;
            this.y = Math.random() * canvas.height;
        }
        
        // Twinkle effect
        this.brightness = 0.3 + Math.abs(Math.sin(Date.now() * 0.001 * this.speed) * 0.7);
        this.color = `rgba(255, 255, 255, ${this.brightness})`;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create stars for background
function createStars() {
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }
}

// Draw background
function drawBackground() {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000033');
    gradient.addColorStop(1, '#000066');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
        star.update();
        star.draw();
    });
    
    // Draw ground
    ctx.fillStyle = '#003366';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    // Ground details
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 50);
    ctx.lineTo(canvas.width, canvas.height - 50);
    ctx.stroke();
    
    // Grid lines on ground
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - 50);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
}

// Game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw bird
    bird.update();
    bird.draw();
    
    // Update and draw pipes
    pipes.forEach((pipe, index) => {
        pipe.update();
        pipe.draw();
        
        // Remove pipes that are off screen
        if (pipe.x + pipe.width < 0) {
            pipes.splice(index, 1);
        }
    });
    
    // Create new pipes only after game has started
    const currentPipeInterval = invincible ? pipeInterval : normalModeSettings.pipeInterval;
    if (gameActive && timestamp - lastPipeTime > currentPipeInterval) {
        pipes.push(new Pipe());
        lastPipeTime = timestamp;
        
        // Very gentle difficulty increase
        if (invincible) {
            if (score > 10 && score <= 30) {
                gameSpeed = Math.min(1.0 + (score - 10) * 0.02, 1.4);
                pipeInterval = Math.max(3000 - (score - 10) * 20, 2200);
            }
        } else {
            // Normal mode difficulty progression
            if (score > 5 && score <= 20) {
                normalModeSettings.gameSpeed = Math.min(1.5 + (score - 5) * 0.03, 2.0);
                normalModeSettings.pipeInterval = Math.max(2500 - (score - 5) * 30, 1800);
            }
        }
    }
    
    // Update and draw particles
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        
        // Remove dead particles
        if (particle.life <= 0 || particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Draw mode indicator
    if (invincible) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.font = '16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('EASY MODE: ON', canvas.width / 2, 30);
    } else {
        ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
        ctx.font = '16px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('NORMAL MODE', canvas.width / 2, 30);
    }
    
    // Continue game loop if game is active
    if (gameActive) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Start game
function startGame() {
    // Reset game state
    bird = new Bird();
    pipes = [];
    particles = [];
    score = 0;
    scoreDisplay.textContent = score;
    gameActive = true;
    gameStarted = true;
    
    // Reset game settings based on mode
    if (invincible) {
        gameSpeed = 1.0;
        gravity = 0.12;
        pipeInterval = 3000;
        lastPipeTime = performance.now() + 2000; // Longer delay for first pipe in easy mode
    } else {
        gameSpeed = normalModeSettings.gameSpeed;
        gravity = normalModeSettings.gravity;
        pipeInterval = normalModeSettings.pipeInterval;
        lastPipeTime = performance.now() + 1500; // Shorter delay for first pipe in normal mode
    }
    
    // Hide start screen
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Start background music
    try {
        backgroundMusic.play().catch(e => console.log("Audio couldn't autoplay:", e));
    } catch (e) {
        console.log("Audio error:", e);
    }
    
    // Start game loop
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
    
    // Add initial flap to get the bird moving
    setTimeout(() => {
        if (gameActive) bird.flap();
    }, 100);
    
    // Auto-flap only in easy mode
    if (invincible) {
        autoFlapInterval = setInterval(() => {
            if (gameActive && bird.velocity > 1) {
                bird.flap();
            }
        }, 1500);
    }
}

// Game over
function gameOver() {
    if (!gameActive) return; // Prevent multiple game over calls
    
    gameActive = false;
    clearInterval(autoFlapInterval);
    
    try {
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.log("Audio couldn't play:", e));
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    } catch (e) {
        console.log("Audio error:", e);
    }
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
            bird.x,
            bird.y,
            Math.random() * 6 - 3,
            Math.random() * 6 - 3,
            '#ff0000',
            1
        ));
    }
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    
    // Show game over screen after a short delay
    setTimeout(() => {
        finalScoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
        gameOverScreen.classList.remove('hidden');
    }, 1000);
    
    // Cancel animation frame
    cancelAnimationFrame(animationId);
}

// Toggle invincibility
function toggleInvincibility() {
    invincible = !invincible;
    const difficultyButton = document.getElementById('difficulty-button');
    if (difficultyButton) {
        difficultyButton.textContent = invincible ? 'NORMAL MODE' : 'EASY MODE';
    }
    
    // If game is active, update bird's lift value
    if (bird) {
        bird.lift = invincible ? -5 : normalModeSettings.lift;
    }
    
    // Update game parameters immediately if game is active
    if (gameActive) {
        // Clear auto-flap interval if switching to normal mode
        if (!invincible && autoFlapInterval) {
            clearInterval(autoFlapInterval);
            autoFlapInterval = null;
        }
        
        // Start auto-flap if switching to easy mode
        if (invincible && !autoFlapInterval) {
            autoFlapInterval = setInterval(() => {
                if (gameActive && bird.velocity > 1) {
                    bird.flap();
                }
            }, 1500);
        }
    }
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Add difficulty toggle button
const difficultyButton = document.createElement('button');
difficultyButton.id = 'difficulty-button';
difficultyButton.textContent = 'NORMAL MODE';
difficultyButton.classList.add('difficulty-button');
difficultyButton.addEventListener('click', toggleInvincibility);
document.querySelector('.start-screen').appendChild(difficultyButton);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        if (!gameActive && gameStarted) {
            startGame();
        } else if (gameActive) {
            bird.flap();
        } else if (!gameActive && !gameStarted) {
            startGame();
        }
    }
});

// Touch controls for both mobile and desktop
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (gameActive) {
        bird.flap();
    } else if (!gameActive) {
        startGame();
    }
}, { passive: false });

// Click controls (for desktop)
canvas.addEventListener('click', (e) => {
    if (gameActive) {
        bird.flap();
    } else if (!gameActive && gameStarted) {
        startGame();
    }
});

// Initialize game
let autoFlapInterval;
createStars();
highScoreDisplay.textContent = highScore;

// Create initial bird for display
bird = new Bird();
bird.velocity = 0; // No initial velocity for display bird

// Draw initial background
drawBackground();
bird.draw();
