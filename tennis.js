/* tennis.js */
class TennisCourt {
    constructor(scene, positionX, width = 40, length = 20) {
        this.scene = scene;
        this.width = width;
        this.length = length;
        this.positionX = positionX;
        this.material = new THREE.MeshPhongMaterial({ color: 0x228b22 });
        this.lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.createCourt();
        this.createNet();
        this.createLines();
    }

    createCourt() {
        const courtGeometry = new THREE.PlaneGeometry(this.width, this.length);
        const court = new THREE.Mesh(courtGeometry, this.material);
        court.rotation.x = -Math.PI / 2;
        court.position.set(this.positionX, 0, 0);
        this.scene.add(court);
    }

    createNet() {
        const netGeometry = new THREE.BoxGeometry(this.width, 1.5, 0.05);
        const netMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
        const net = new THREE.Mesh(netGeometry, netMaterial);
        net.position.set(this.positionX, 0.75, 0);
        this.scene.add(net);
    }

    createLines() {
        const lineWidth = 0.05;

        // Baselines
        this.createLine(this.width, lineWidth, this.positionX, 0.01, this.length / 2);
        this.createLine(this.width, lineWidth, this.positionX, 0.01, -this.length / 2);

        // Sidelines
        this.createLine(lineWidth, this.length, this.positionX - this.width / 2, 0.01, 0);
        this.createLine(lineWidth, this.length, this.positionX + this.width / 2, 0.01, 0);

        // Service lines
        this.createLine(this.width * 0.75, lineWidth, this.positionX, 0.01, this.length / 4);
        this.createLine(this.width * 0.75, lineWidth, this.positionX, 0.01, -this.length / 4);

        // Center line
        this.createLine(lineWidth, this.length / 2, this.positionX, 0.01, 0);

        // Doubles alleys
        this.createLine(lineWidth, this.length, this.positionX - (this.width / 2) + 5, 0.01, 0);
        this.createLine(lineWidth, this.length, this.positionX + (this.width / 2) - 5, 0.01, 0);
    }

    createLine(width, length, posX, posY, posZ) {
        const lineGeometry = new THREE.PlaneGeometry(width, length);
        const line = new THREE.Mesh(lineGeometry, this.lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set(posX, posY, posZ);
        this.scene.add(line);
    }
}

class Player {
    constructor(scene, color, xPos, zPos, controlledByUser = false) {
        this.scene = scene;
        this.controlledByUser = controlledByUser;
        const geometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        const material = new THREE.MeshPhongMaterial({ color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(xPos, 0.75, zPos);
        this.scene.add(this.mesh);
    }

    move(dx, dz) {
        this.mesh.position.x += dx;
        this.mesh.position.z += dz;
    }

    resetPosition(x, z) {
        this.mesh.position.set(x, 0.75, z);
    }
}

class Ball {
    constructor(scene) {
        const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(ballGeometry, ballMaterial);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.scene = scene;
        this.scene.add(this.mesh);
        this.netHitCooldown = false; // Prevent multiple net hits in quick succession
    }

    resetPosition(player) {
        this.mesh.position.set(player.mesh.position.x, player.mesh.position.y + 1.0, player.mesh.position.z - 1);
        this.velocity.set(0, 0, 0);
        this.netHitCooldown = false; // Reset net cooldown on ball reset
        console.log("Ball reset: Position:", this.mesh.position);
    }

    move(gravity, bounceFactor, groundFriction, courtLength, courtWidth, handleBallOut) {
        // Apply gravity to the ball's vertical velocity
        this.velocity.y += gravity;
        this.mesh.position.add(this.velocity);

        // Log the ball's position and velocity at every step
        console.log(`Position: (${this.mesh.position.x}, ${this.mesh.position.y}, ${this.mesh.position.z})`);
        console.log(`Velocity: (${this.velocity.x}, ${this.velocity.y}, ${this.velocity.z})`);

        // Bounce off the ground if the ball hits it
        if (this.mesh.position.y <= 0.2) {
            console.log("Ball hit the ground!");

            // Check if the ball bounced out of bounds
            if (this.isBallOutOfBounds(courtLength, courtWidth)) {
                console.log("Ball bounced out of bounds. Ending point.");
                handleBallOut();
            } else {
                // Bounce the ball if it is in bounds
                if (Math.abs(this.velocity.y) > 0.1) {
                    this.velocity.y = -this.velocity.y * bounceFactor; // Invert and reduce velocity on bounce
                    console.log(`Bouncing with velocity: ${this.velocity.y}`);
                } else {
                    // Hard stop if velocity is too low to bounce
                    this.velocity.set(0, 0, 0); // Stop all motion (x, y, z)
                    console.log("Stopping all motion, ball settled");
                    this.mesh.position.set(this.mesh.position.x, 0.2, this.mesh.position.z); // Fix the ball on the ground
                }
            }

            // Apply friction to horizontal movement
            this.velocity.x *= groundFriction; 
            this.velocity.z *= groundFriction;
        }

        // Handle net collision only if the ball is low enough and within net z-boundaries
        if (!this.netHitCooldown && this.mesh.position.z >= -0.05 && this.mesh.position.z <= 0.05) {
            if (this.mesh.position.y <= 1.5) { // Net height
                console.log("Ball hit the net! Reflecting.");
                this.velocity.z = -this.velocity.z * 0.5; // Reflect z-velocity when hitting the net
                this.velocity.x *= 0.9; // Slightly reduce x-velocity for energy loss
                this.netHitCooldown = true; // Cooldown to prevent continuous net collisions
                setTimeout(() => {
                    this.netHitCooldown = false; // Reset cooldown after 500ms
                }, 500);
            }
        }

        // Ensure gravity keeps pulling the ball down after crossing the net
        if (this.mesh.position.y > 1.5 && this.mesh.position.z > 0) {
            console.log("Applying gravity to pull ball down.");
            this.velocity.y += gravity; // Keep applying gravity after clearing the net
        }
    }

    // New function to check if the ball bounced out of bounds
    isBallOutOfBounds(courtLength, courtWidth) {
        // Check if the ball's x or z position is outside the court after it has hit the ground
        return (
            this.mesh.position.z <= -courtLength / 2 || this.mesh.position.z >= courtLength / 2 ||
            this.mesh.position.x <= -courtWidth / 2 || this.mesh.position.x >= courtWidth / 2
        );
    }

    hit(direction, speed) {
        this.velocity.copy(direction).multiplyScalar(speed);
        console.log(`Ball hit! Velocity set to: (${this.velocity.x}, ${this.velocity.y}, ${this.velocity.z})`);
    }
}

class TennisGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("game-container").appendChild(this.renderer.domElement);

        // Set up camera
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // Add lighting
        this.addLighting();

        // Create courts
        this.courts = [];
        for (let i = -50; i <= 50; i += 50) {
            this.courts.push(new TennisCourt(this.scene, i));
        }

        // Create players and ball
        this.initializePlayersAndBall();

        // Global game variables
        this.isBallInMotion = false;
        this.gravity = -0.005;
        this.bounceFactor = 1.5;
        this.groundFriction = 0.995;
        this.opponentSpeed = 1.1;
        this.playerSpeed = 1.1;

        // Add UI elements
        this.createUI();

        // Add event listeners for player control
        this.addEventListeners();

        // Start animation loop
        this.animate();
    }

    addLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
    }

    initializePlayersAndBall() {
        this.player = new Player(this.scene, 0x0000ff, -4, -2, true);
        this.opponent1 = new Player(this.scene, 0xff0000, -5, 9);
        this.opponent2 = new Player(this.scene, 0xff0000, 5, 9);
        this.pro = new Player(this.scene, 0xffff00, 4, -2);
        this.ball = new Ball(this.scene);
        this.ball.mesh.position.set(-4, 0.2, -2);
    }

    createUI() {
        const startButton = document.createElement("button");
        startButton.innerHTML = "Start";
        startButton.onclick = () => this.countDownAndServe();
        startButton.style.position = "absolute";
        startButton.style.top = "20%";
        startButton.style.left = "50%";
        startButton.style.transform = "translate(-50%, -50%)";
        document.body.appendChild(startButton);

        const countdownDiv = document.createElement("div");
        countdownDiv.style.position = "absolute";
        countdownDiv.style.width = "100%";
        countdownDiv.style.textAlign = "center";
        countdownDiv.style.top = "40%";
        countdownDiv.style.fontSize = "36px";
        countdownDiv.style.color = "white";
        this.countdownDiv = countdownDiv;
        document.body.appendChild(this.countdownDiv);
    }

    addEventListeners() {
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.player.move(0, -this.playerSpeed);
                    break;
                case 'ArrowDown':
                    this.player.move(0, this.playerSpeed);
                    break;
                case 'ArrowLeft':
                    this.player.move(-this.playerSpeed, 0);
                    break;
                case 'ArrowRight':
                    this.player.move(this.playerSpeed, 0);
                    break;
                case ' ':
                    if (!this.isBallInMotion) {
                        const direction = new THREE.Vector3(0, 0.1, -1).normalize();
                        this.ball.hit(direction, 0.4); // Adjust ball serve speed here
                        this.isBallInMotion = true;
                    }
                    break;
            }
        });
    }

    countDownAndServe() {
        let countdown = 3;
        this.countdownDiv.innerHTML = countdown;
    
        const interval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.countdownDiv.innerHTML = countdown;
            } else {
                this.countdownDiv.innerHTML = "Go!";
                clearInterval(interval);
                setTimeout(() => {
                    if (!this.isBallInMotion) {
                        this.ball.resetPosition(this.pro);
    
                        const randomX = (Math.random() - 0.5) * 0.5; // Horizontal randomness
                        const serveVelocity = new THREE.Vector3(randomX, 0.5, 1).normalize(); // Increase the y-component
                        this.ball.hit(serveVelocity, 0.2); // Serve speed with more height to clear net
                        this.isBallInMotion = true;
                    }
                }, 1000);
            }
        }, 1000);
    }

    // New method to predict ball's future position to help opponent anticipate movement
    anticipateBallPosition() {
        const timeToReach = Math.abs((this.opponent1.mesh.position.z - this.ball.mesh.position.z) / this.ball.velocity.z);
        const futureX = this.ball.mesh.position.x + this.ball.velocity.x * timeToReach;
        return futureX;
    }

    moveOpponent() {
    if (this.isBallInMotion) {
        [this.opponent1, this.opponent2].forEach((opponent, index) => {
            const leftBoundary = index === 0 ? -10 : 0;
            const rightBoundary = index === 0 ? 0 : 10;
            const centralPositionX = index === 0 ? -5 : 5;  // Set the opponent's central position (starting X position)
            const centralPositionZ = 8; // Set the opponent's central Z position

            // Check if the opponent has hit the ball already (limit to one hit per turn)
            if (!opponent.hasHitBall) {
                const predictedX = this.anticipateBallPosition();
                const predictedZ = this.ball.mesh.position.z;

                const distanceToBall = this.ball.mesh.position.distanceTo(opponent.mesh.position);
                const speedMultiplier = distanceToBall > 5 ? 1.5 : 1;  // Move faster if further from the ball

                // Move left or right to follow the ball on the x-axis
                if (predictedX < opponent.mesh.position.x && opponent.mesh.position.x > leftBoundary) {
                    opponent.move(-this.opponentSpeed * speedMultiplier, 0);
                } else if (predictedX > opponent.mesh.position.x && opponent.mesh.position.x < rightBoundary) {
                    opponent.move(this.opponentSpeed * speedMultiplier, 0);
                }

                // Move forwards or backwards to follow the ball on the z-axis
                if (predictedZ < opponent.mesh.position.z) {
                    opponent.move(0, -this.opponentSpeed * speedMultiplier);
                } else if (predictedZ > opponent.mesh.position.z) {
                    opponent.move(0, this.opponentSpeed * speedMultiplier);
                }

                // Check if opponent is close enough to hit the ball
                if (this.detectCollision(this.ball, opponent)) {
                    const randomX = (Math.random() - 0.5) * 0.5;
                    const returnVelocity = new THREE.Vector3(randomX, 0.3, -1).normalize();
                    this.ball.hit(returnVelocity, 0.3);
                    console.log("Opponent hit the ball!");

                    // Mark that the opponent has hit the ball, preventing further hits until the next turn
                    opponent.hasHitBall = true;
                }
            } else {
                // Move the opponent back to their starting central position after hitting the ball
                const moveBackSpeed = 0.02; // Speed for moving back to the central position
                const deltaX = centralPositionX - opponent.mesh.position.x;
                const deltaZ = centralPositionZ - opponent.mesh.position.z;

                // Move back towards the central position (x-axis)
                if (Math.abs(deltaX) > 0.1) {
                    opponent.move(Math.sign(deltaX) * moveBackSpeed, 0);
                }

                // Move back towards the central position (z-axis)
                if (Math.abs(deltaZ) > 0.1) {
                    opponent.move(0, Math.sign(deltaZ) * moveBackSpeed);
                }
            }
        });
    }
}

    detectCollision(object1, object2, threshold = 0.7) { // Increased threshold for better hitting accuracy
        const distance = object1.mesh.position.distanceTo(object2.mesh.position);
        return distance < threshold;
    }

    handleBallOut() {
        this.isBallInMotion = false;
        setTimeout(() => {
            this.countDownAndServe();
        }, 2000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.isBallInMotion) {
            this.ball.move(this.gravity, this.bounceFactor, this.groundFriction, this.courts[0].length, this.courts[0].width, this.handleBallOut.bind(this));
            this.moveOpponent();
        }
        this.renderer.render(this.scene, this.camera);
    }
}

const game = new TennisGame();