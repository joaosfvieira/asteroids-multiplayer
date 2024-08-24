import { Client } from './client-socket.js';

export default class LoginScene extends Phaser.Scene {
    constructor() {
        super('LoginScene');
    }

    preload() {
        // Load any assets here
        this.load.image('background', 'assets/sprites/asteroid.png');
        this.load.html('loginForm', 'assets/html/login-form.html');

        this.load.audio('menuMusic', 'assets/music/menu.mp3');
    }

    create() {
        // Check if music is already playing
        if (!this.sound.get('menuMusic')) {
            this.backgroundMusic = this.sound.add('menuMusic', {
                volume: 0.5,
                loop: true
            });
            this.backgroundMusic.play();
        }

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        this.add.image(centerX, centerY - 200, 'background');

        // Create a container for DOM elements
        this.domContainer = this.add.dom(centerX, centerY).createFromCache('loginForm');

        // Create the form fields
        this.createInputFields();

        // Add event listeners for buttons
        this.addDOMEventListeners();
    }

    createInputFields() {
        // Get references to the input elements
        this.usernameInput = this.domContainer.getChildByID('username');
        this.passwordInput = this.domContainer.getChildByID('password');
    }

    addDOMEventListeners() {
        // Get references to the buttons
        const loginButton = this.domContainer.getChildByID('login-btn');
        const backButton = this.domContainer.getChildByID('back-btn');

        // Add event listeners for the Login button
        loginButton.addEventListener('click', () => this.handleLogin());

        // Add event listener for the Back button
        backButton.addEventListener('click', () => this.scene.start('StartScene'));
    }

    handleLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (username && password) {
            const loginCredentials = {
                username,
                password
            };

            // Send the credentials to the server via WebSocket
            Client.login(loginCredentials);

            const scene = this;

            Client.socket.on('login-response', function(message) {
                const response = JSON.parse(message);
                if (response.type === 'loginResponse') {
                    if (response.success) {
                        console.log('Login successful');

                        Client.username = loginCredentials.username;
                        scene.scene.start('LobbyScene');
                    } else {
                        console.error('Login failed: ', response.message);
                    }
                }
            });
        } else {
            console.error('Please enter both username and password.');
        }
    }
}