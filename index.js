import * as Phaser from 'phaser';
import Boot from './src/scenes/Boot';
import Menu from './src/scenes/Menu';
import Play from './src/scenes/Play';
import Pause from './src/scenes/Pause';

const config = {
	name: 'RATFORMER',
	title: 'RATFORMER',
	type: Phaser.AUTO,
	width: 800,
	height: 640,
	// scene: [Boot, Menu, Play, Pause],
	scene: [Boot, Play, Pause],
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