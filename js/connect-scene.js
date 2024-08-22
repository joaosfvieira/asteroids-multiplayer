export default class ConnectScene extends Phaser.Scene {
    constructor() {
        super('ConnectScene');
    }

    preload() {
        this.load.image('capa', 'assets/capa.png');
        this.load.audio('menuMusic', 'assets/music/menu.mp3');
    }

    create() {

        this.music = this.sound.add('menuMusic', { loop: true });
        this.music.play();

        const image = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'capa');

        // Create a text object to display the title
        /*
        this.titleText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 - 100, 'Connect to Server', {
            fontSize: '32px',
            fontFamily: 'Arial',
            align: 'center'
        });
        this.titleText.setOrigin(0.5, 0.5);
        */
        // Create a button to connect to the server
        this.connectButton = this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 100,  'Connect', {
            fontSize: '24px',
            fontFamily: 'Arial',
            align: 'center',
            backgroundColor: 'blue',
            color: 'white',
            padding: 10
        });
        this.connectButton.setOrigin(0.5, 0.5);
        this.connectButton.setInteractive();
        this.connectButton.on('pointerdown', () => {
            // Handle the button click event here
            this.cameras.main.fadeOut(1000, 0, 0, 0)

            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
                this.time.delayedCall(1000, () => {
                    this.music.stop();
                    this.scene.start('Example')
                })
            })
        });
    }
}