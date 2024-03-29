import * as Phaser from 'phaser';

export default class Pause extends Phaser.Scene {

	constructor() {
		super({ key: 'Pause' });
	}

	create() {
		this.overlay = this.cameras.add(0, 0, this.game.config.width, this.game.config.height).setBackgroundColor('rgba(0, 0, 0, 0.5)');
		this.createButtons();
		this.input.keyboard.on('keydown-ESC', this.resumePlay.bind(this));
	}

	createButtons() {
		const x = this.game.config.width/2;
		const y = this.game.config.height/2;
		this.pausedText = this.add.bitmapText(x, 100, 'arcade', 'Paused').setOrigin(0.5, 0.5);
		this.resumeText = this.add.bitmapText(x, y, 'arcade', 'Resume');
		this.menuText = this.add.bitmapText(x, y + 50, 'arcade', 'Back to Menu');
		this.resumeText
			.setInteractive({ useHandCursor: true })
			.setScale(0.5)
			.setOrigin(0.5, 0.5)
			.on('pointerup', this.resumePlay.bind(this))
		;
		this.menuText
			.setInteractive({ useHandCursor: true })
			.setScale(0.5)
			.setOrigin(0.5, 0.5)
			.on('pointerup', this.backToMenu.bind(this))
		;
	}

	toggleButtons() {
		this.pausedText.visible = !this.pausedText.visible;
		this.resumeText.visible = !this.resumeText.visible;
		this.menuText.visible = !this.menuText.visible;
	}

	resumePlay() {
		this.overlay.visible = !this.overlay.visible;
		this.toggleButtons();
		this.scene.pause();
		this.scene.resume('Play');
	}

	backToMenu() {
		this.overlay.visible = !this.overlay.visible;
		this.toggleButtons();
		this.scene.stop();
		this.scene.stop('Play');
		this.scene.start('Menu');
	}
}