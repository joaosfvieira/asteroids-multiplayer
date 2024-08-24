import StartScene from './start-scene.js'

import ConnectScene from './connect-scene.js';
import GameOverScene from './game-over-scene.js';
import SignUpScene from './signup-scene.js';
import LoginScene from './login-scene.js';

import { Client } from './client-socket.js';
import LobbyScene from './lobby-scene.js';

var receivedPlayers;

function createPlayer(playerData) {
    var player = {};
  
    player.id = playerData.id;
    player.x = playerData.x;
    player.y = playerData.y;
  
    return player;
}

class MainScene extends Phaser.Scene
{
    constructor() {
        super('MainScene');
    }

    preload ()
    {
        this.load.image('spaceship', 'assets/sprites/ship.png');
        this.load.image('asteroid', 'assets/sprites/asteroid.png');
        this.load.image('bullet', 'assets/sprites/bullet.png');
        this.load.image('flame', 'assets/sprites/flame.png');
        this.load.image('mediumAsteroid1', 'assets/sprites/mediumAsteroid1.png');
        this.load.image('mediumAsteroid2', 'assets/sprites/mediumAsteroid2.png');
        this.load.image('smallAsteroid1', 'assets/sprites/smallAsteroid1.png');
        this.load.image('smallAsteroid2', 'assets/sprites/smallAsteroid2.png');
        this.load.image('particle', 'assets/sprites/bullet.png');

        this.load.image('spaceship2', 'assets/sprites/ship.png');

        this.load.audio('thruster', 'assets/music/thrust.wav');
        this.load.audio('bulletFired', 'assets/music/fire.wav');
        this.load.audio('hitLarge', 'assets/music/hitLarge.wav');
        this.load.audio('hitMedium', 'assets/music/hitMedium.wav');
        this.load.audio('hitSmall', 'assets/music/hitSmall.wav');
    }

    
    create ()
    {
        this.game.focusLossPrevent = true;

        Client.askNewPlayer(400, 300);

        Client.socket.on('allplayers',function(data){
            for(var i = 0; i < data.length; i++){
                let player = createPlayer(data[i]);
                
                if((data[i].id != Client.id) && (!Client.players.find(player => player.id === data[i].id) )) {
                    Client.players.push(player);
                    console.log('player added: ' + player.id);
    
                    receivedPlayers = true;
                }                
                
            }
        });

        let thisScene = this;
        let shotId;
        
        Client.socket.on('shot-fired-broadcast', (data) => {
            shotsFired(thisScene, data);
        });

        this.cameras.main.fadeIn(1000, 0, 0, 0)

        this.score = 0;
        this.scoreTextStyle = {
            fontFamily: 'AsteroidsFont',
            fontSize: '24px',
            color: '#ffffff'
        };

        this.particles = this.add.particles('particle');
        this.explosionBody = null;

        this.lives = 3;
        this.lifeShips = this.add.group();
        this.updateLivesDisplay = updateLivesDisplay.bind(this);
        this.updateLivesDisplay();

        this.thrusterSound = this.sound.add('thruster');
        this.bulletFiredSound = this.sound.add('bulletFired');
        this.hitLargeSound = this.sound.add('hitLarge');
        this.hitMediumSound = this.sound.add('hitMedium');
        this.hitSmallSound = this.sound.add('hitSmall');

        this.ship = this.matter.add.image(0, 0, 'spaceship');
        this.ship.setMass(80);
        this.ship.setFrictionAir(0.005);
        this.ship.setAngle(-90);
        this.ship.setCollisionCategory(1);
        this.ship.id = Client.id;

        this.ships = this.add.group();

        this.flame = this.add.image(0, 0, 'flame');
        this.flame.setVisible(false);

        this.asteroids = this.add.group();

        let asteroidsArray = Client.asteroids;
        
        for (let i = 0; i < asteroidsArray.length; i++) {
            const x = asteroidsArray[i].pos_x;
            const y = asteroidsArray[i].pos_y;

            const velocityX = asteroidsArray[i].vel_x;
            const velocityY = asteroidsArray[i].vel_y;

            const asteroid = this.matter.add.image(x, y, 'asteroid');

            asteroid.setMass(15);
            asteroid.setFrictionAir(0);
            asteroid.setVelocity(velocityX, velocityY);
            asteroid.setCollisionCategory(2);
            asteroid.setCollidesWith([1]);
            asteroid.asteroidSize = 'large';

            this.asteroids.add(asteroid);
        }

        this.cursors = this.input.keyboard.createCursorKeys();
        this.bullets = this.add.group();

        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.matter.world.on('collisionstart', (event, bodyA, bodyB) => {
            onBulletAsteroidCollision(this, bodyA, bodyB);
        });

        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            game.renderer.resize(width, height);
            this.matter.world.setBounds(0, 0, width, height);
            resize.call(this, width, height);
        });

        this.resetShip = () => {
            this.ship.setPosition(-1000, -1000);
            this.ship.setVisible(false);
            this.placeShipWhenSafe();
        };

        this.placeShipWhenSafe = () => {
            const centerX = innerWidth / 2;
            const centerY = innerHeight / 2;

            let isSafeToPlace = true;

            this.asteroids.getChildren().forEach((asteroid) => {
                const distance = Phaser.Math.Distance.Between(asteroid.x, asteroid.y, centerX, centerY);
                if (distance < 150) {
                    isSafeToPlace = false;
                }
            });

            if (isSafeToPlace) {
                this.ship.setPosition(centerX, centerY);
                this.ship.setVisible(true);
            } else {
                setTimeout(() => {
                    this.placeShipWhenSafe();
                }, 100); // Check again in 500ms
            }
        };

        this.resetShip();
        
    }

    update() 
    {
        updateScore(this, 0);

        // If game-over change to its scene
        
        if(this.lives <= 0) {
            this.scene.start('GameOverScene');
        }
        

        if (!isGameOver) {
            // listen for ships movement and store them in Client.players array
            Client.socket.on('move-player-broadcast', function(data) {
                const movedShip = {
                    x: data.x,
                    y: data.y,
                    id: data.id,
                    rotation: data.rotation
                }

                for(let i=0; i< Client.players.length; i++) {
                    if(Client.players[i].id === movedShip.id) {
                        Client.players[i].x = movedShip.x;
                        Client.players[i].y = movedShip.y;
                        Client.players[i].rotation = movedShip.rotation;
                    }
                }
            });

            // Update location of other ships 
            try {
                this.ships.getChildren().forEach(ship => {
                    for(let i = 0; i < Client.players.length; i++) {
                        if(ship.id === Client.players[i].id) {
                            ship.setPosition(Client.players[i].x, Client.players[i].y);
                            ship.setRotation(Client.players[i].rotation);
                        }
                    }
                });
            } catch (error) {}
            
            // Create new players that connected to the match
            if(receivedPlayers) {
                for (let i = 0; i < Client.players.length; i++) {

                    const x = Client.players[i].x;
                    const y = Client.players[i].y;
                    const id = Client.players[i].id;

                    if(!this.ships.getChildren().find(ship => ship.id === id)) {
                        const newShip = this.matter.add.image(x, y, 'spaceship');
                        newShip.setMass(80);
                        newShip.setFrictionAir(0.005);
                        newShip.setAngle(-90);
                        newShip.setCollisionCategory(1);
    
                        newShip.id = id;
        
                        console.log('New Ship added: ' + newShip.id);
                        this.ships.add(newShip)
                    }  
                }
                receivedPlayers = false;
            }
            

            if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
                fireBullet(this);

                const shotData = {
                    playerId: Client.id,
                    x: this.ship.x + Math.cos(this.ship.rotation) * 30,
                    y: this.ship.y + Math.sin(this.ship.rotation) * 30,
                    direction: this.ship.rotation,
                    velocity_x: this.ship.body.velocity.y + Math.sin(this.ship.rotation) * 5,
                    velocity_y: this.ship.body.velocity.x + Math.cos(this.ship.rotation) * 5
                  };
                Client.shotFired(shotData);
            }

            

            this.bullets.getChildren().forEach(bullet => {
                if (bullet.active) {
                    wrapMatterSprite(bullet, window.innerWidth, window.innerHeight);
                }
            });
            const rotationSpeed = 0.05;
            
            if (this.ship.active) {
                const currentPosition = this.ship.body.position;
                
                // If the player moves his ship, broadcast the information to other clients
                Client.sendMovement(Client.id, this.ship.x, this.ship.y, this.ship.rotation);

                wrapMatterSprite(this.ship, window.innerWidth, window.innerHeight);
                if (this.cursors.left.isDown) {
                    this.ship.setAngularVelocity(-rotationSpeed);
                } else if (this.cursors.right.isDown) {
                    this.ship.setAngularVelocity(rotationSpeed);
                } else {
                    this.ship.setAngularVelocity(0);
                }

                if (this.cursors.up.isDown) {
                    this.ship.thrust(0.01);
                    if (!this.thrusterSound.isPlaying) {
                        this.thrusterSound.play({ loop: true });
                    }
                } else {
                    this.thrusterSound.stop();
                }


                const isThrusting = this.cursors.up.isDown;

                if (this.explosionBody) {
                    this.particles.emitters.list[0].setPosition(this.explosionBody.position.x, this.explosionBody.position.y);
                }

                if (isThrusting) {
                    this.flame.setPosition(
                        this.ship.x - Math.cos(this.ship.rotation) * (this.ship.width * 0.5 + this.flame.width * 0.5 - 5),
                        this.ship.y - Math.sin(this.ship.rotation) * (this.ship.height * 0.5 + this.flame.height * 0.5)
                    );
                    this.flame.setRotation(this.ship.rotation);
                    this.flame.setVisible(true);
                } else {
                    this.flame.setVisible(false);
                }
            }
        }

        this.asteroids.getChildren().forEach(asteroid => wrapMatterSprite(asteroid, window.innerWidth, window.innerHeight));
    }
}

const Matter = Phaser.Physics.Matter.Matter;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [StartScene, SignUpScene, LoginScene, LobbyScene, MainScene, GameOverScene],
    autoCenter: true,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: false
        }
    },
    audio: {
        disableWebAudio: false,
        muteOnFocusLoss: false
    },
    dom: {
        createContainer: true // This enables the use of DOM elements in your scenes
    },
    parent: document.getElementById('game')
};

var game = new Phaser.Game(config);

const ASTEROID_VELOCITIES = {
    large: { min: .5, max: 1 },
    medium: { min: 1, max: 1.5 },
    small: { min: 1.5, max: 2 }
};

let isGameOver = false;

function resize(width, height) {
    if (width === undefined) {
        width = this.sys.game.config.width;
    }
    if (height === undefined) {
        height = this.sys.game.config.height;
    }
    this.cameras.resize(width, height);

}

function updateScore(scene, points) {
    scene.score += points;
    if (scene.scoreText) {
        scene.scoreText.destroy();
    }
    scene.scoreText = scene.add.text(100, 50, scene.score, scene.scoreTextStyle);
}

function updateLivesDisplay() {
    this.lifeShips.clear(true, true);
    const initialX = 100;
    const initialY = 100;
    const padding = -20;

    for (let i = 0; i < this.lives; i++) {
        const ship = this.add.image(initialX + (i * (40 + padding)), initialY, 'spaceship');
        ship.setScale(0.5);
        ship.angle = -90;
        this.lifeShips.add(ship);
    }
};

function wrapMatterSprite(sprite, width, height) {
    const body = sprite.body;
    const newPosition = { x: body.position.x, y: body.position.y };

    if (body.position.x < 0) {
        newPosition.x = width;
    } else if (body.position.x > width) {
        newPosition.x = 0;
    }

    if (body.position.y < 0) {
        newPosition.y = height;
    } else if (body.position.y > height) {
        newPosition.y = 0;
    }

    Matter.Body.setPosition(body, newPosition);
}

function fireBullet(scene) {
    scene.bulletFiredSound.play();

    const bullet = scene.matter.add.image(
        scene.ship.x + Math.cos(scene.ship.rotation) * 30,
        scene.ship.y + Math.sin(scene.ship.rotation) * 30,
        'bullet'
    );
    bullet.setMass(1);
    bullet.setFrictionAir(0);
    bullet.setVelocity(
        scene.ship.body.velocity.x + Math.cos(scene.ship.rotation) * 5,
        scene.ship.body.velocity.y + Math.sin(scene.ship.rotation) * 5
    );
    bullet.setCollisionCategory(3);
    bullet.setCollidesWith([2]);

    scene.time.delayedCall(1000, () => {
        bullet.destroy();
    });

    scene.bullets.add(bullet);
}

function shotsFired(scene, shipData) {
    try {
        scene.bulletFiredSound.play();

        const bullet = scene.matter.add.image(shipData.x, shipData.y, 'bullet');
        bullet.setMass(1);
        bullet.setFrictionAir(0);
        bullet.setVelocity(shipData.velocity_x,shipData.velocity_y);
        bullet.setCollisionCategory(3);
        bullet.setCollidesWith([2]);

        scene.time.delayedCall(1000, () => {
            bullet.destroy();
        });

        scene.bullets.add(bullet);
    } catch (error) {}
    
}

function onBulletAsteroidCollision(scene, bodyA, bodyB) {
    let asteroidBody;
    let bulletBody;
    let playerBody;

    if (
        bodyA.gameObject &&
        (bodyA.gameObject.texture.key === 'asteroid' ||
            bodyA.gameObject.texture.key === 'mediumAsteroid1' ||
            bodyA.gameObject.texture.key === 'mediumAsteroid2' ||
            bodyA.gameObject.texture.key === 'smallAsteroid1' ||
            bodyA.gameObject.texture.key === 'smallAsteroid2')
    ) {
        asteroidBody = bodyA;
    } else if (
        bodyB.gameObject &&
        (bodyB.gameObject.texture.key === 'asteroid' ||
            bodyB.gameObject.texture.key === 'mediumAsteroid1' ||
            bodyB.gameObject.texture.key === 'mediumAsteroid2' ||
            bodyB.gameObject.texture.key === 'smallAsteroid1' ||
            bodyB.gameObject.texture.key === 'smallAsteroid2')
    ) {
        asteroidBody = bodyB;
    }

    if (bodyA.gameObject && bodyA.gameObject.texture.key === 'bullet') {
        bulletBody = bodyA;
    } else if (bodyB.gameObject && bodyB.gameObject.texture.key === 'bullet') {
        bulletBody = bodyB;
    }

    if (bodyA.gameObject && bodyA.gameObject === scene.ship) {
        playerBody = bodyA;
    } else if (bodyB.gameObject && bodyB.gameObject === scene.ship) {
        playerBody = bodyB;
    }

    if (asteroidBody && playerBody) {
        scene.lives -= 1;
        scene.updateLivesDisplay();
        scene.hitLargeSound.play();

        const asteroidX = asteroidBody.gameObject.x;
        const asteroidY = asteroidBody.gameObject.y;
        const asteroidSize = asteroidBody.gameObject.asteroidSize;

        if (asteroidSize === 'large' || asteroidSize === 'medium') {
            for (let i = 0; i < 2; i++) {
                let newAsteroidKey;
                let newSize;
                let newMass;
                let newVelocities;

                if (asteroidSize === 'large') {
                    newAsteroidKey = i === 0 ? 'mediumAsteroid1' : 'mediumAsteroid2';
                    newSize = 'medium';
                    newMass = 7.5;
                    newVelocities = ASTEROID_VELOCITIES.medium;
                } else {
                    newAsteroidKey = i === 0 ? 'smallAsteroid1' : 'smallAsteroid2';
                    newSize = 'small';
                    newMass = 3.75;
                    newVelocities = ASTEROID_VELOCITIES.small;
                }

                const newAsteroid = scene.matter.add.image(asteroidX, asteroidY, newAsteroidKey);
                newAsteroid.setMass(newMass);
                newAsteroid.setFrictionAir(0);
                const randomAngle = Phaser.Math.Between(0, 360);
                const velocityMagnitude = Phaser.Math.Between(newVelocities.min, newVelocities.max);
                const velocityX = velocityMagnitude * Math.cos(Phaser.Math.DegToRad(randomAngle));
                const velocityY = velocityMagnitude * Math.sin(Phaser.Math.DegToRad(randomAngle));
                newAsteroid.setVelocity(velocityX, velocityY);
                newAsteroid.setCollisionCategory(2);
                newAsteroid.setCollidesWith([1]);
                newAsteroid.asteroidSize = newSize;
                scene.asteroids.add(newAsteroid);
            }
        }

        asteroidBody.gameObject.destroy();

        if (scene.lives > 0) {
            scene.resetShip();
            scene.ship.setVelocity(0, 0);
            scene.ship.setAngularVelocity(0);
        }
    }

    if (asteroidBody && bulletBody) {


        const asteroidX = asteroidBody.gameObject.x;
        const asteroidY = asteroidBody.gameObject.y;

        if (asteroidBody.gameObject.asteroidSize === 'large') {
            asteroidBody.gameObject.destroy();
            scene.hitLargeSound.play();
            for (let i = 0; i < 2; i++) {
                const mediumAsteroid = scene.matter.add.image(
                    asteroidX,
                    asteroidY,
                    i === 0 ? 'mediumAsteroid1' : 'mediumAsteroid2'
                );
                mediumAsteroid.setMass(7.5);
                mediumAsteroid.setFrictionAir(0);
                const randomAngle = Phaser.Math.Between(0, 360);
                const velocityMagnitude = Phaser.Math.Between(
                    ASTEROID_VELOCITIES.medium.min,
                    ASTEROID_VELOCITIES.medium.max
                );
                const velocityX = velocityMagnitude * Math.cos(Phaser.Math.DegToRad(randomAngle));
                const velocityY = velocityMagnitude * Math.sin(Phaser.Math.DegToRad(randomAngle));
                mediumAsteroid.setVelocity(velocityX, velocityY);
                mediumAsteroid.setCollisionCategory(2);
                mediumAsteroid.setCollidesWith([1]);
                mediumAsteroid.asteroidSize = 'medium';
                scene.asteroids.add(mediumAsteroid);
                updateScore(scene, 20);
            }
        } else if (asteroidBody.gameObject.asteroidSize === 'medium') {
            asteroidBody.gameObject.destroy();
            scene.hitMediumSound.play();
            for (let i = 0; i < 2; i++) {
                const smallAsteroid = scene.matter.add.image(
                    asteroidX,
                    asteroidY,
                    i === 0 ? 'smallAsteroid1' : 'smallAsteroid2'
                );
                smallAsteroid.setMass(3.75);
                smallAsteroid.setFrictionAir(0);
                const randomAngle = Phaser.Math.Between(0, 360);
                const velocityMagnitude = Phaser.Math.Between(
                    ASTEROID_VELOCITIES.small.min,
                    ASTEROID_VELOCITIES.small.max
                );
                const velocityX = velocityMagnitude * Math.cos(Phaser.Math.DegToRad(randomAngle));
                const velocityY = velocityMagnitude * Math.sin(Phaser.Math.DegToRad(randomAngle));
                smallAsteroid.setVelocity(velocityX, velocityY);
                smallAsteroid.setCollisionCategory(2);
                smallAsteroid.setCollidesWith([1]);
                smallAsteroid.asteroidSize = 'small';
                scene.asteroids.add(smallAsteroid);
                updateScore(scene, 50);
            }
        } else if (asteroidBody.gameObject.asteroidSize === 'small') {
            scene.hitSmallSound.play();
            asteroidBody.gameObject.destroy();
            updateScore(scene, 100);
        }

        bulletBody.gameObject.destroy();
    }
}