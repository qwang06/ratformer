import * as Phaser from 'phaser';
import PlayScene from './src/scenes/PlayScene';

const config = {
	name: 'RATFORMER',
	title: 'RATFORMER',
	type: Phaser.AUTO,
	width: 800,
	height: 640,
	scene: [PlayScene],
	pixelArt: false,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 1000 },
			debug: true
		}
	}
};

window.game = new Phaser.Game(config);