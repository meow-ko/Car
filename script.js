document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const playerCar = document.getElementById('playerCar');
    const obstaclesContainer = document.getElementById('obstacles');
    const gameArea = document.querySelector('.game-area');
    const gameOverScreen = document.getElementById('gameOver');
    const restartButton = document.getElementById('restartGame');
    const scoreDisplay = document.getElementById('score');
    const levelDisplay = document.getElementById('level');
    const livesDisplay = document.getElementById('lives');
    const finalScoreDisplay = document.getElementById('finalScore');
    const highScoreDisplay = document.getElementById('highScore');
    const roadLines = document.getElementById('roadLines');
    const crashSound = document.getElementById('crashSound');
    const engineSound = document.getElementById('engineSound');
    const scoreSound = document.getElementById('scoreSound');
    
    // Game variables
    let score = 0;
    let level = 1;
    let lives = 3;
    let gameSpeed = 5;
    let gameIsOver = false;
    let animationId;
    let obstacleInterval;
    let roadLineInterval;
    let highScore = localStorage.getItem('highScore') || 0;
    
    // Set car color from localStorage
    const savedColor = localStorage.getItem('carColor') || '#ff0000';
    renderPixelCar(playerCar, savedColor);
    
    // Player position
    let playerX = gameArea.offsetWidth / 2 - 16;
    playerCar.style.left = playerX + 'px';
    
    // Keyboard controls
    const keys = {
        ArrowLeft: false,
        ArrowRight: false
    };
    
    document.addEventListener('keydown', function(e) {
        if (e.key in keys) {
            keys[e.key] = true;
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });
    
    // Render pixel car
    function renderPixelCar(element, color) {
        element.innerHTML = '';
        
        // Create car body
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 4; x++) {
                const pixel = document.createElement('div');
                pixel.className = 'pixel';
                pixel.style.left = (x * 8) + 'px';
                pixel.style.top = (y * 8) + 'px';
                
                // Base car color
                pixel.style.backgroundColor = color;
                
                // Windows
                if ((y === 2 || y === 3) && (x === 1 || x === 2)) {
                    pixel.style.backgroundColor = '#333';
                }
                
                // Headlights
                if (y === 1 && (x === 0 || x === 3)) {
                    pixel.style.backgroundColor = '#ff0';
                }
                
                element.appendChild(pixel);
            }
        }
    }
    
    // Create road lines
    function createRoadLines() {
        roadLines.innerHTML = '';
        const lineSpacing = 60;
        const lineCount = Math.ceil(gameArea.offsetHeight / lineSpacing) + 2;
        
        for (let i = 0; i < lineCount; i++) {
            const line = document.createElement('div');
            line.className = 'road-line';
            line.style.top = (i * lineSpacing) + 'px';
            
            // Create three box segments (□ □ □)
            for (let j = 0; j < 3; j++) {
                const segment = document.createElement('div');
                segment.className = 'road-line-segment';
                segment.style.left = (j * 16) + 'px';
                line.appendChild(segment);
            }
            
            roadLines.appendChild(line);
        }
    }
    
    // Move road lines
    function moveRoadLines() {
        const lines = document.querySelectorAll('.road-line');
        const lineHeight = 8;
        const lineSpacing = 60;
        
        lines.forEach(line => {
            const currentTop = parseInt(line.style.top) || 0;
            const newTop = currentTop + gameSpeed;
            
            if (newTop > gameArea.offsetHeight + lineHeight) {
                line.style.top = -lineSpacing + 'px';
            } else {
                line.style.top = newTop + 'px';
            }
        });
    }
    
    // Game loop
    function gameLoop() {
        if (gameIsOver) return;
        
        // Move player
        if (keys.ArrowLeft && playerX > 20) {
            playerX -= 5;
        }
        if (keys.ArrowRight && playerX < gameArea.offsetWidth - 52) {
            playerX += 5;
        }
        playerCar.style.left = playerX + 'px';
        
        // Move obstacles and check collisions
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obstacle => {
            const obstacleTop = parseInt(obstacle.style.top) || 0;
            const newTop = obstacleTop + gameSpeed;
            obstacle.style.top = newTop + 'px';
            
            // Check if obstacle passed
            if (newTop > gameArea.offsetHeight) {
                obstacle.remove();
                increaseScore(10);
            }
            
            // Check collision
            if (checkCollision(playerCar, obstacle)) {
                handleCollision();
                obstacle.remove();
            }
        });
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    // Create obstacles
    function createObstacle() {
        if (gameIsOver) return;
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        const randomX = Math.floor(Math.random() * (gameArea.offsetWidth - 72)) + 20;
        const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
        
        obstacle.style.left = randomX + 'px';
        obstacle.style.top = '-64px';
        
        renderPixelCar(obstacle, randomColor);
        obstaclesContainer.appendChild(obstacle);
    }
    
    // Check collision between two elements
    function checkCollision(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();
        
        return !(
            rect1.right < rect2.left || 
            rect1.left > rect2.right || 
            rect1.bottom < rect2.top || 
            rect1.top > rect2.bottom
        );
    }
    
    // Handle collision
    function handleCollision() {
        crashSound.currentTime = 0;
        crashSound.play();
        
        playerCar.style.animation = 'crash 0.5s';
        setTimeout(() => {
            playerCar.style.animation = '';
        }, 500);
        
        lives--;
        livesDisplay.textContent = lives;
        
        if (lives <= 0) {
            endGame();
        } else {
            playerCar.style.opacity = '0.5';
            setTimeout(() => {
                playerCar.style.opacity = '1';
            }, 200);
        }
    }
    
    // Increase score
    function increaseScore(points) {
        score += points;
        scoreDisplay.textContent = score;
        
        if (score % 100 === 0) {
            scoreSound.currentTime = 0;
            scoreSound.play();
        }
        
        if (score >= level * 100) {
            level++;
            levelDisplay.textContent = level;
            gameSpeed += 1;
            clearInterval(obstacleInterval);
            obstacleInterval = setInterval(createObstacle, 2000 / level);
            engineSound.playbackRate = 1 + (level * 0.1);
        }
    }
    
    // End game
    function endGame() {
        gameIsOver = true;
        cancelAnimationFrame(animationId);
        clearInterval(obstacleInterval);
        clearInterval(roadLineInterval);
        
        engineSound.pause();
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }
        
        finalScoreDisplay.textContent = score;
        highScoreDisplay.textContent = highScore;
        gameOverScreen.style.display = 'block';
    }
    
    // Restart game
    function restartGame() {
        window.location.href = 'index.html';
    }
    
    // Event listeners
    restartButton.addEventListener('click', restartGame);
    
    // Start the game
    startGame();
    
    // Start game function
    function startGame() {
        createRoadLines();
        roadLineInterval = setInterval(moveRoadLines, 20);
        obstacleInterval = setInterval(createObstacle, 2000);
        gameLoop();
        engineSound.volume = 0.3;
        engineSound.play();
    }
});