import * as Phaser from 'phaser';

export default class Menu extends Phaser.Scene {

	constructor() {
		super({ key: 'Menu' });
	}

	init() {
	}

	preload() {
	}

	create() {
		this.playButton = this.add.bitmapText(100, 100, 'arcade', 'Play').setInteractive({ useHandCursor: true });
		this.playButton.on('pointerover', () => {
		});
		this.playButton.on('pointerout', () => {
		});
		this.playButton.on('pointerdown', () => {
		});
		this.playButton.on('pointerup', () => {
			this.scene.start('Play');
		});
	}

	update() {

	}
}