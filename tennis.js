/* tennis.js */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-container").appendChild(renderer.domElement);

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Create the court
const courtGeometry = new THREE.PlaneGeometry(20, 10);
const courtMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 }); // Green court
const court = new THREE.Mesh(courtGeometry, courtMaterial);
court.rotation.x = -Math.PI / 2;
scene.add(court);

// Create boundaries
const boundaryGeometry = new THREE.BoxGeometry(20.5, 1, 0.5);
const boundaryMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const backBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
backBoundary.position.set(0, 0.5, -5.25);
scene.add(backBoundary);
const frontBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
frontBoundary.position.set(0, 0.5, 5.25);
scene.add(frontBoundary);

// Create player
const playerGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff }); // Blue player
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.75, -3);
scene.add(player);

// Create opponents
const opponentGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
const opponentMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red opponent
const opponent1 = new THREE.Mesh(opponentGeometry, opponentMaterial);
opponent1.position.set(0, 0.75, 3);
scene.add(opponent1);

// Create ball
const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 }); // Yellow ball
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0.2, 0);
scene.add(ball);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Handle player movement
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
            player.position.x -= 0.1;
            break;
        case 'ArrowRight':
            player.position.x += 0.1;
            break;
        case 'ArrowUp':
            player.position.z -= 0.1;
            break;
        case 'ArrowDown':
            player.position.z += 0.1;
            break;
    }
});

// Simulate ball movement
let ballDirection = new THREE.Vector3(0.05, 0, -0.05);
function moveBall() {
    ball.position.add(ballDirection);

    // Ball collision with boundaries
    if (ball.position.z <= -5 || ball.position.z >= 5) {
        ballDirection.z *= -1;
    }
    if (ball.position.x <= -10 || ball.position.x >= 10) {
        ballDirection.x *= -1;
    }

    // Ball collision with player or opponent
    if (ball.position.distanceTo(player.position) < 0.5) {
        ballDirection.z *= -1;
    }
    if (ball.position.distanceTo(opponent1.position) < 0.5) {
        ballDirection.z *= -1;
    }

    requestAnimationFrame(moveBall);
}
moveBall();

// Opponent movement
function moveOpponent() {
    opponent1.position.x = Math.sin(Date.now() * 0.001) * 3;
    requestAnimationFrame(moveOpponent);
}
moveOpponent();
