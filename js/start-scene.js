export default class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.image('capa', 'assets/sprites/capa.png');
        this.load.audio('menuMusic', 'assets/music/menu.mp3');
    }

    create() {
        if (!this.sound.get('menuMusic')) {
            // Add and play the background music
            this.backgroundMusic = this.sound.add('menuMusic', {
                volume: 0.5,
                loop: true
            });
            this.backgroundMusic.play();
        }

        const image = this.add.image(this.game.config.width / 2 + 50, this.game.config.height / 2, 'capa');

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Add a button to go to the Sign-Up scene
        const signUpButton = this.add.text(centerX, centerY + 100, 'Sign Up', {
            fontSize: '32px',
            color: '#fff',
            padding: { x: 20, y: 10 },

        });
        signUpButton.setOrigin(0.5);
        signUpButton.setInteractive({ useHandCursor: true });
        signUpButton.on('pointerdown', () => this.scene.start('SignUpScene'));

        // Add a button to go to the Login scene
        const loginButton = this.add.text(centerX, centerY + 200, 'Login', {
            fontSize: '32px',
            color: '#fff',
            padding: { x: 20, y: 10 }
        });
        loginButton.setOrigin(0.5);
        loginButton.setInteractive({ useHandCursor: true });
        loginButton.on('pointerdown', () => this.scene.start('LoginScene'));
    }
}