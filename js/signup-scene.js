import { Client } from './client-socket.js';

export default class SignUpScene extends Phaser.Scene {
    constructor() {
        super('SignUpScene');
    }

    preload() {
        this.load.image('background', 'assets/sprites/asteroid.png');
        this.load.html('form', 'assets/html/signup-form.html');

        this.load.audio('menuMusic', 'assets/music/menu.mp3');
    }
    
    create() {
        if (!this.sound.get('menuMusic')) {
            this.backgroundMusic = this.sound.add('menuMusic', {
                volume: 0.5,
                loop: true
            });
            this.backgroundMusic.play();
        }

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight /2 ;

        this.add.image(centerX, centerY - 200, 'background');

        // Create a container for DOM elements
        this.domContainer = this.add.dom(centerX, centerY).createFromCache('form');

        // Create the form fields
        this.createInputFields();

        // Add event listeners for buttons
        this.addDOMEventListeners();

        
    }

    createInputFields() {
        // Get references to the input elements
        this.usernameInput = this.domContainer.getChildByID('username');
        this.passwordInput = this.domContainer.getChildByID('password');
        this.emailInput = this.domContainer.getChildByID('email');
    }

    addDOMEventListeners() {
        // Get references to the buttons
        const signUpButton = this.domContainer.getChildByID('sign-up-btn');
        const backButton = this.domContainer.getChildByID('back-btn');

        // Add event listeners for the Sign Up button
        signUpButton.addEventListener('click', () => this.handleSignUp());

        // Add event listener for the Back button
        backButton.addEventListener('click', () => this.scene.start('StartScene'));
    }

    handleSignUp() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();
        const email = this.emailInput.value.trim();

        if (username && password && email) {
            const userCredentials = {
                username,
                password,
                email
            };
            
            // Send the credentials to the server via WebSocket
            Client.signup(userCredentials);

            let scene = this;

            Client.socket.on('signup-response', function(message) {
                const response = JSON.parse(message);
    
                if (response.type === 'signUpResponse') {
                    if (response.success) {
                        console.log('Sign-Up successful');
                        // Transition to the login scene
                        scene.scene.start('LoginScene');
                    } else {
                        console.error('Sign-Up failed:', response.message);
                    }
                }
            });

            // Optionally, provide feedback to the user and transition to another scene
            console.log('Sign-Up Details Sent:', userCredentials);
            this.scene.start('LoginScene');

        } else {
            console.error('Please fill in all fields.');
        }
    }

    displayError(message) {
        // Implement your error display logic here, e.g., using Phaser text objects or DOM elements
        const errorText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, message, {
            fontSize: '32px',
            fill: '#f00'
        });
        errorText.setOrigin(0.5);
    }
}

