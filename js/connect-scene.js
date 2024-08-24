export default class ConnectScene extends Phaser.Scene {
    constructor() {
        super('ConnectScene');
    }

    preload() {
        this.load.image('capa', 'assets/sprites/capa.png');
        this.load.audio('menuMusic', 'assets/music/menu.mp3');
    }

    create() {
        this.sound.stopAll();
        this.music = this.sound.add('menuMusic', { loop: true });
        this.music.pauseOnBlur = false;
        this.music.play();

        const image = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'capa');

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
            this.cameras.main.fadeOut(1000, 0, 0, 0)

            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
                this.time.delayedCall(1000, () => {
                    this.music.stop();
                    this.scene.start('MainScene')
                })
            })
        });
    }
}