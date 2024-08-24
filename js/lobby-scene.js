import { Client } from './client-socket.js';

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super('LobbyScene');
    }

    preload() {
        this.load.html('lobby', 'assets/html/lobby.html');
    }

    create() {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        this.add.text(centerX, 50, 'Lobby', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // Create a container for DOM elements
        this.domContainer = this.add.dom(centerX, centerY).createFromCache('lobby');

        // Create references to the DOM elements
        this.userListContainer = this.domContainer.getChildByID('user-list');
        this.chatInput = this.domContainer.getChildByID('chat-input');
        this.sendMessageButton = this.domContainer.getChildByID('send-message-btn');
        this.chatMessagesContainer = this.domContainer.getChildByID('chat-messages');
        this.goToMainButton = this.domContainer.getChildByID('go-to-main-btn');

        // Set up WebSocket event listeners
        this.requestUsersList();
        this.setupWebSocket();

        // Add event listeners to chat elements
        this.sendMessageButton.addEventListener('click', () => this.sendMessage());
        this.goToMainButton.addEventListener('click', () => this.goToMainScene());
    }

    requestUsersList() {
        Client.requestUsersList('teste');
    }
    
    setupWebSocket() {
        // Listen for updates from the server
        let context = this;
        Client.socket.on('new-message', function(message) {
            console.log('new message: ' + message);
            
            const response = JSON.parse(message);

            if (response.type === 'userListUpdate') {
                context.updateUserList(response.users);
            } else if (response.type === 'chatMessage') {
                context.addChatMessage(response.username, response.message);
            }
        });

    }

    updateUserList(users) {
        // Clear existing user list
        this.userListContainer.innerHTML = '';

        // Add each user to the list
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.textContent = user;
            this.userListContainer.appendChild(userItem);
        });
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (message) {
            const newMessage = {
                username: Client.username, // Replace with the actual logged-in username
                chatMessage: message
            };

            Client.sendMessage(newMessage);

            // Clear the chat input
            this.chatInput.value = '';
        }
    }

    addChatMessage(username, message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = `${username}: ${message}`;
        this.chatMessagesContainer.appendChild(messageElement);
    }

    goToMainScene() {
        // Transition to the MainScene
        this.scene.start('MainScene');
    }
}