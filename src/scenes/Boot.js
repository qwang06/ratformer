import * as Phaser from 'phaser';

export default class Boot extends Phaser.Scene {

	constructor() {
		super({ key: 'Boot' });
	}

	init() {
		this.readyCount = 0;
	}

	preload() {
		this.createProgressBar();
		this.load.image('background', '/static/kerningcity-background.png');
		this.load.image('platformerTiles', '/static/tilesheet_complete.png');
		this.load.image('kenney_grass', '/static/kenney_grass.png');
		this.load.image('kenney_castle', '/static/kenney_castle.png');
		this.load.image('knighthawks', '/static/knight3.png');
		this.load.image('chest', '/static/chest.png');
		this.load.image('heart', '/static/heart.png');
		this.load.image('portal', '/static/portal.png');
		this.load.bitmapFont('arcade', '/static/arcade-font.png', '/static/arcade-font.xml');
		this.load.multiatlas('ratz', '/static/ratz.json', '/static'); // main character
		this.load.multiatlas('enemies', '/static/enemies.json', '/static');
		this.load.multiatlas('items', '/static/items.json', '/static');
  		this.load.json('levelData', '/static/levelData.json');
  		// this.load.tilemapTiledJSON('map', '/static/stage1.json');
  		this.load.tilemapTiledJSON('map', '/static/stage2.json');
	}

	createProgressBar() {		
		const width = this.cameras.main.width;
		const height = this.cameras.main.height;
		let progressBar = this.add.graphics(),
			progressBox = this.add.graphics();
		const percentText = this.make.text({
			x: width / 2,
			y: height / 2 - 5,
			text: '0%',
			style: {
				font: '18px monospace',
				fill: '#ffffff'
			}
		}).setOrigin(0.5, 0.5);
		const assetText = this.make.text({
			x: width / 2,
			y: height / 2 + 50,
			text: '',
			style: {
				font: '18px monospace',
				fill: '#ffffff'
			}
		}).setOrigin(0.5, 0.5);
		this.loadingText = this.make.text({
			x: width / 2,
			y: height / 2 - 50,
			text: 'Loading...',
			style: {
				font: '20px monospace',
				fill: '#ffffff'
			}
		}).setOrigin(0.5, 0.5);

		progressBox.fillStyle(0x222222, 0.8);
		progressBox.fillRect(240, 270, 320, 50);

		this.load.on('progress', (value) => {
			percentText.setText(parseInt(value * 100) + '%');
			progressBar.clear();
			progressBar.fillStyle(0xffffff, 1);
			progressBar.fillRect(250, 280, 300 * value, 30);
		});
		this.load.on('fileprogress', (file) => {
			assetText.setText('Loading asset: ' + file.key);
		});
		this.load.on('complete', () => {
			progressBar.destroy();
			progressBox.destroy();
			percentText.destroy();
			assetText.destroy();
			this.ready();
		});
		this.timedEvent = this.time.delayedCall(0, this.ready, [], this);
	}

	ready() {
		this.readyCount++;
		if (this.readyCount === 2) {
			// this.scene.start('Menu');
			this.scene.start('Play');
			this.loadingText.destroy();
		}
	}
}