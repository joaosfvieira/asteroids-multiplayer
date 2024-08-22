export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        this.sound.stopAll(); // Stops all sounds in the game
        this.cameras.main.fadeIn(1000, 0, 0, 0)

        // Add a text to display "Game Over!"
        this.gameOverText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 - 100, 'Game Over!', {
            fontSize: '48px',
            fontFamily: 'AsteroidsFont',
            align: 'center',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Add a button to navigate to the "ConnectScene"
        this.restartButton = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 100, 'Restart', {
            fontSize: '32px',
            fontFamily: 'AsteroidsFont',
            align: 'center',
            backgroundColor: '#00ff00',
            color: '#000000',
            padding: 10
        }).setOrigin(0.5);

        this.restartButton.setInteractive();
        this.restartButton.on('pointerdown', () => {
            this.scene.start('ConnectScene');
        });
    }
}