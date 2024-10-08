/* tennis.js */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-container").appendChild(renderer.domElement);

camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Add lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5).normalize();
scene.add(light);

// Create the court
const courtGeometry = new THREE.PlaneGeometry(20, 10);
const courtMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 }); // Green court
const court = new THREE.Mesh(courtGeometry, courtMaterial);
court.rotation.x = -Math.PI / 2; // Lay it flat
scene.add(court);

// Create player
const playerGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff }); // Blue player
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.75, -3);
scene.add(player);

// Create opponent
const opponentGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
const opponentMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red opponent
const opponent = new THREE.Mesh(opponentGeometry, opponentMaterial);
opponent.position.set(0, 0.75, 3);
scene.add(opponent);

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
