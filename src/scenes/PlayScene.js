import * as Phaser from 'phaser';
import config from '../../config';
import Missile from '../classes/Missile';
import TwitchJs from 'twitch-js';

const TEST_CHANNEL = 'disguisedtoast';
const CHECK_MSG = 'KEKW';
const {
	TWITCH_USER,
	TWITCH_TOKEN
} = config;

export default class PlayScene extends Phaser.Scene {
	constructor() {
		super({ key: 'PlayScene' });

		this.playerSpeed = 150;
		this.jumpSpeed = -700;
		this.isReady = false;
	}

	preload() {
		if (!this.isReady) {
			this.load.image('background', '/static/kerningcity-background.png');
			// this.load.image('ground', '/static/ground.png');
			// this.load.image('cbd-block', '/static/cbd-block.png');
			this.load.image('platformerTiles', '/static/tilesheet_complete.png');
			// this.load.image('groundTiles', '/static/spritesheet_ground.png');
			// this.load.image('objectsTiles', '/static/spritesheet_tiles.png');
			// this.load.image('spikeA-Up', '/static/spikes_A1.png');
			this.load.multiatlas('ratz', '/static/ratz.json', '/static');
			this.load.multiatlas('jr-necki', '/static/jrnecki.json', '/static');
	  		this.load.json('levelData', '/static/levelData.json');
	  		this.load.tilemapTiledJSON('map', '/static/stage1.json');

			this.load.image('rocket', '/static/rocket.png');
			this.load.image('smoke', '/static/smoke.png');
			// this.load.spritesheet('explosion', '/static/explosion.png', 128, 128);
			// this.load.spritesheet('fire', '/static/fire_spritesheet.png', {
			// 	frameWidth: 20,
			// 	frameHeight: 21,
			// 	margin: 1,
			// 	spacing: 1
			// });
			this.isReady = true;
		}
	}

	create() {
		// Initializers
		this.initMap();
		this.initLayers();
		this.initPlayer();

		// Setting up
		this.setupAnimations();
		this.setupLevel();
		this.setupCamera();
		// this.setupTwitch();
		this.cursors = this.input.keyboard.createCursorKeys();
	}

	update() {
		let isGrounded = this.player.body.blocked.down || this.player.body.touching.down;

		if (this.cursors.left.isDown) {
			this.player.body.setVelocityX(-this.playerSpeed);
			this.player.flipX = false;
			if (!this.player.anims.isPlaying) {
				this.player.anims.play('walking');
			}
		} else if (this.cursors.right.isDown) {
			this.player.body.setVelocityX(this.playerSpeed);
			this.player.flipX = true;
			if (!this.player.anims.isPlaying) {
				this.player.anims.play('walking');
			}
		} else {
			this.player.body.setVelocityX(0);
			this.player.anims.stop('walking');
			this.player.setFrame('idle01.png');
		}

		if (isGrounded && (this.cursors.space.isDown || this.cursors.up.isDown)) {
			// this.player.anims.stop('walking');
			this.player.anims.play('jumping');
			this.player.body.setVelocityY(this.jumpSpeed);
		}

		if (isGrounded && (this.cursors.shift.isDown)) {
			this.launchMissile(this.player);
		}

		// this.neckis.playAnimation('necki-walking');

		// const missile = this.missiles.getFirstAlive();

		// this.physics.moveToObject(missile, this.player, 100);
		// if (x < 0) {
		// 	Phaser.Actions.IncX(this.missiles.getChildren(), -1);
		// } else {
		// 	Phaser.Actions.IncX(this.missiles.getChildren(), 1);
		// }

		// if (y < 0) {
		// 	Phaser.Actions.IncY(this.missiles.getChildren(), -1);
		// } else {
		// 	Phaser.Actions.IncY(this.missiles.getChildren(), 1);
		// }
	}

	setupAnimations() {
		if (!this.anims.get('walking')) {
			this.anims.create({
				key: 'walking',
				frames: this.anims.generateFrameNames('ratz', {
					start: 1,
					end: 10,
					zeroPad: 2,
					prefix: 'idle',
					suffix: '.png'
				}),
				frameRate: 12,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('jumping')) {
			this.anims.create({
				key: 'jumping',
				frames: this.anims.generateFrameNames('ratz', {
					start: 1,
					end: 6,
					zeroPad: 2,
					prefix: 'walk',
					suffix: '.png'
				}),
				frameRate: 12,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('necki-walking')) {
			this.anims.create({
				key: 'necki-walking',
				frames: this.anims.generateFrameNames('jr-necki', {
					start: 1,
					end: 6,
					zeroPad: 2,
					prefix: 'walk',
					suffix: '.png'
				}),
				frameRate: 6,
				yoyo: true,
				repeat: -1
			});
		}
	}

	initMap() {
		this.map = this.make.tilemap({ key: 'map' });
		this.add.tileSprite(0, 0, this.map.widthInPixels, 900, 'background').setOrigin(0);
		this.physics.world.bounds.width = this.map.widthInPixels;
		this.physics.world.bounds.height = this.map.heightInPixels;
	}

	initLayers() {
		const platformerTileset = this.map.addTilesetImage('kenney', 'platformerTiles'); // params: name of tileset in tiled editor, key of the loaded tileset
		// const objectsTileset = this.map.addTilesetImage('objects', 'objectsTiles');
		const backgroundLayer = this.map.createLayer('Background', platformerTileset);
		// const spikesLayer = this.map.getObjectLayer('Spikes').objects;
		this.groundLayer = this.map.createLayer('Ground', platformerTileset);
		this.platformsLayer = this.map.createLayer('Platforms', platformerTileset);
	}

	initPlayer() {
		const player = this.map.getObjectLayer('Player').objects[0];
		this.player = this.add.sprite(player.x, player.y, 'ratz', 'idle01.png');
		this.physics.add.existing(this.player);
		this.player.body.setCollideWorldBounds(true);
	}

	setupLevel() {
		this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
			gameObject.x = dragX;
			gameObject.y = dragY;

			console.log(dragX, dragY);
		});

		// // Create fires
		// this.fires = this.physics.add.group({
		// 	allowGravity: false,
		// 	immovable: true
		// });
		// fires.forEach(fire => {
		// 	let newObj = this.add.sprite(fire.x, fire.y, 'fire').setOrigin(0);
		// 	newObj.anims.play('burning');
		// 	newObj.setInteractive();
		// 	this.fires.add(newObj);
		// 	this.input.setDraggable(newObj);
		// });
		this.spikes = this.physics.add.group({
			allowGravity: false,
			immovable: true
		});

		this.missiles = this.physics.add.group({
			allowGravity: false
		});

		// spikesLayer.forEach(spike => {
		// 	const newSpike = this.add.image(spike.x, spike.y, 'spikeA-Up').setOrigin(0, 1);
		// 	spikes.add(newSpike);
		// });
		this.createSpawner();
		this.setCollisions();
		this.setOverlap();
	}

	createSpawner() {
		this.neckis = this.physics.add.group({
			allowGravity: true,
			collideWorldBounds: true
		});

		const spawningEvent = this.time.addEvent({
			delay: 5000,
			loop: true,
			callback: () => {
				const firstPortal = this.map.getObjectLayer('Portal').objects[0];
				if (this.neckis.getLength() === 3) {
					const firstAlive = this.neckis.getFirst(true);
					// this.neckis.killAndHide(firstAlive);
					firstAlive.x = firstPortal.x;
					firstAlive.y = firstPortal.y;
				} else {
					this.spawnNecki(firstPortal.x, firstPortal.y);
				}
			}
		});
	}

	setCollisions() {
		this.physics.add.collider(this.player, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.neckis, [this.groundLayer, this.platformsLayer]);
		this.groundLayer.setCollisionBetween(1, 500); // `start`, `stop` - value is the number in layer data
		this.platformsLayer.setCollisionBetween(1, 500);
		// this.groundLayer.setCollisionByExclusion([1]);
	}

	setOverlap() {
		this.physics.add.overlap(this.player, this.spikes, this.restartGame, null, this);
		this.physics.add.overlap(this.player, this.neckis, this.restartGame, null, this);		
	}

	setupCamera() {
		this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
		// 2nd arg is `roundPixels` and fixes the black lines that appear between when moving
		this.cameras.main.startFollow(this.player, true);
	}

	setupTwitch() {
		this.chat = new TwitchJs.Chat({
			username: TWITCH_USER,
			token: TWITCH_TOKEN
		});

		this.chat.on('*', (event) => {
			if (event.message && event.message.includes(CHECK_MSG)) {
				console.log('message', event.message);
			}
		});

		this.chat.connect().then(() => {
			this.chat.join(TEST_CHANNEL).then(response => {
				console.log('response', response);
			}).catch(err => {
				console.error('join error', error);
			});
		}).catch(err => {
			console.error('connect error', error);
		});		
	}

	launchMissile(owner) {
		// const missile = this.missiles.get(x, y, 'rocket');
		const missile = new Missile(this, owner);
		this.missiles.add(missile);
	}

	spawnNecki(x, y) {
		const necki = this.neckis.get(x, y, 'jr-necki');
		necki.anims.play('necki-walking');
		this.tweens.add({
			targets: necki,
			x: x - 200,
			duration: 1500,
			flipX: true,
			yoyo: true,
			repeat: -1
		});
		this.neckis.add(necki);
	}

	restartGame(player, targetSprite) {
		this.scene.restart();
	}
}