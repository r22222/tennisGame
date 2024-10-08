/* tennis.js */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-container").appendChild(renderer.domElement);

// Camera position
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Create courts
const courtMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 }); // Green court
for (let i = -25; i <= 25; i += 25) {
    const courtGeometry = new THREE.PlaneGeometry(20, 10);
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2;
    court.position.set(i, 0, 0);
    scene.add(court);

    // Create net
    const netGeometry = new THREE.BoxGeometry(0.2, 1.5, 10);
    const netMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // White net
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.set(i, 0.75, 0);
    scene.add(net);

    // Create court lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lineWidth = 0.05;

    // Baselines
    const baselineGeometry = new THREE.PlaneGeometry(20, lineWidth);
    const baselineFront = new THREE.Mesh(baselineGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    baselineFront.rotation.x = -Math.PI / 2;
    baselineFront.position.set(i, 0.01, 5);
    scene.add(baselineFront);
    const baselineBack = baselineFront.clone();
    baselineBack.position.set(i, 0.01, -5);
    scene.add(baselineBack);

    // Sidelines
    const sidelineGeometry = new THREE.PlaneGeometry(lineWidth, 10);
    const sidelineLeft = new THREE.Mesh(sidelineGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    sidelineLeft.rotation.x = -Math.PI / 2;
    sidelineLeft.position.set(i - 10, 0.01, 0);
    scene.add(sidelineLeft);
    const sidelineRight = sidelineLeft.clone();
    sidelineRight.position.set(i + 10, 0.01, 0);
    scene.add(sidelineRight);

    // Service lines
    const serviceLineGeometry = new THREE.PlaneGeometry(20, lineWidth);
    const serviceLineFront = new THREE.Mesh(serviceLineGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    serviceLineFront.rotation.x = -Math.PI / 2;
    serviceLineFront.position.set(i, 0.01, 2.5);
    scene.add(serviceLineFront);
    const serviceLineBack = serviceLineFront.clone();
    serviceLineBack.position.set(i, 0.01, -2.5);
    scene.add(serviceLineBack);

    // Center line
    const centerLineGeometry = new THREE.PlaneGeometry(lineWidth, 5);
    const centerLine = new THREE.Mesh(centerLineGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(i, 0.01, 0);
    scene.add(centerLine);
}

// Create players and opponents
const playerGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff }); // Blue player
const players = [];
for (let i = -25; i <= 25; i += 25) {
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(i, 0.75, -3);
    scene.add(player);
    players.push(player);
}
const mainPlayer = players[1]; // Controlled by user

const opponentMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red opponent
const opponents = [];
for (let i = -25; i <= 25; i += 25) {
    const opponent = new THREE.Mesh(playerGeometry, opponentMaterial);
    opponent.position.set(i, 0.75, 3);
    scene.add(opponent);
    opponents.push(opponent);
}

// Create pros (static position)
const proMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow pro
const pros = [];
for (let i = -25; i <= 25; i += 25) {
    const pro = new THREE.Mesh(playerGeometry, proMaterial);
    pro.position.set(i, 0.75, 5);
    scene.add(pro);
    pros.push(pro);
}

// Create ball
const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // White ball
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0.2, 0);
scene.add(ball);

// Physics for ball
const gravity = -0.00098;
let ballVelocity = new THREE.Vector3(0.05, 0, -0.05);
let ballSpin = new THREE.Vector3(0.001, 0, 0.001);

// Game state
let gameStarted = false;
let playerScore = 0;
let opponentScore = 0;
let currentCourt = 1;

// Display score and timer
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '40px';
timerElement.style.left = '10px';
timerElement.style.color = 'white';
document.body.appendChild(timerElement);

let startTime = Date.now();

// Press any key to start
window.addEventListener('keydown', (event) => {
    if (!gameStarted) {
        gameStarted = true;
        moveBall();
        moveOpponents();
        document.getElementById("game-container").focus();
        startTime = Date.now();
    } else {
        // Handle player movement
        switch (event.key) {
            case 'ArrowLeft':
                mainPlayer.position.x -= 0.5;
                break;
            case 'ArrowRight':
                mainPlayer.position.x += 0.5;
                break;
            case 'ArrowUp':
                mainPlayer.position.z -= 0.5;
                break;
            case 'ArrowDown':
                mainPlayer.position.z += 0.5;
                break;
        }
    }
});

// Simulate ball movement
function moveBall() {
    if (!gameStarted) return;

    ballVelocity.y += gravity;
    ball.position.add(ballVelocity);
    ball.position.add(ballSpin);

    // Ball collision with ground
    if (ball.position.y <= 0.2) {
        ball.position.y = 0.2;
        ballVelocity.y *= -0.6; // Bounce with some energy loss
    }

    // Ball collision with net
    if (Math.abs(ball.position.x % 25) < 0.1 && Math.abs(ball.position.z) < 0.5 && ball.position.y < 1.5) {
        ballVelocity.z *= -0.8;
    }

    // Ball collision with players
    players.forEach(player => {
        if (ball.position.distanceTo(player.position) < 0.7) {
            ballVelocity.z *= -1;
            ballVelocity.x += (Math.random() - 0.5) * 0.1;
            ballSpin.x += (Math.random() - 0.5) * 0.01;
        }
    });

    // Ball collision with opponents
    opponents.forEach(opponent => {
        if (ball.position.distanceTo(opponent.position) < 0.7) {
            ballVelocity.z *= -1;
            ballVelocity.x += (Math.random() - 0.5) * 0.1;
            ballSpin.x += (Math.random() - 0.5) * 0.01;
        }
    });

    // Check if player or opponent wins the point
    if (ball.position.z < -5.25) {
        opponentScore++;
        rotatePlayers();
        resetBall();
    } else if (ball.position.z > 5.25) {
        playerScore++;
        rotatePlayers();
        resetBall();
    }

    scoreElement.innerHTML = `Player Score: ${playerScore} | Opponent Score: ${opponentScore}`;
    timerElement.innerHTML = `Time: ${Math.floor((Date.now() - startTime) / 1000)}s`;

    requestAnimationFrame(moveBall);
}

function resetBall() {
    ball.position.set(currentCourt * 25, 0.2, 0);
    ballVelocity.set((Math.random() - 0.5) * 0.1, 0.05, (Math.random() > 0.5 ? -0.05 : 0.05));
    ballSpin.set((Math.random() - 0.5) * 0.01, 0, (Math.random() - 0.5) * 0.01);
}

// Rotate players
function rotatePlayers() {
    if (playerScore % 2 === 0) {
        currentCourt = (currentCourt + 1) % 3;
        mainPlayer.position.set(currentCourt * 25, 0.75, -3);
    }
}

// Opponent movement
function moveOpponents() {
    if (!gameStarted) return;
    opponents.forEach((opponent, index) => {
        opponent.position.x = Math.sin(Date.now() * 0.001 + index) * 3;
    });
    requestAnimationFrame(moveOpponents);
}

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
