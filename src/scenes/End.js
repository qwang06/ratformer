import * as Phaser from 'phaser';

export default class End extends Phaser.Scene {

	constructor() {
		super({ key: 'End' });
	}

	create() {
		this.overlay = this.cameras.add(0, 0, this.game.config.width, this.game.config.height).setBackgroundColor('rgba(0, 0, 0, 0.5)');
		this.createButtons();
	}

	createButtons() {
		const x = this.game.config.width/2;
		const y = this.game.config.height/2;
		this.gameOverText = this.add.bitmapText(x, 100, 'arcade', 'GAME OVER').setOrigin(0.5, 0.5);
		this.restartText = this.add.bitmapText(x, y, 'arcade', 'Restart');
		this.menuText = this.add.bitmapText(x, y + 50, 'arcade', 'Back to Menu');
		this.restartText
			.setInteractive({ useHandCursor: true })
			.setScale(0.5)
			.setOrigin(0.5, 0.5)
			.on('pointerup', this.restartGame.bind(this))
		;
		this.menuText
			.setInteractive({ useHandCursor: true })
			.setScale(0.5)
			.setOrigin(0.5, 0.5)
			.on('pointerup', this.backToMenu.bind(this))
		;
	}

	toggleButtons() {
		this.gameOverText.visible = !this.gameOverText.visible;
		this.restartText.visible = !this.restartText.visible;
		this.menuText.visible = !this.menuText.visible;
	}

	restartGame() {
		this.overlay.visible = !this.overlay.visible;
		this.toggleButtons();
		this.scene.stop();
		this.scene.stop('Play');
		this.scene.start('Play');
	}

	backToMenu() {
		this.overlay.visible = !this.overlay.visible;
		this.toggleButtons();
		this.scene.stop();
		this.scene.stop('Play');
		this.scene.start('Menu');
	}
}