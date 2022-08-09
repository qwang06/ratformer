import * as Phaser from 'phaser';
import config from '../../config';
import Missile from '../classes/Missile';
import Beam from '../classes/Beam';
import Bullet from '../classes/Bullet';
import TwitchJs from 'twitch-js';

const TEST_CHANNEL = 'qwang00';
const CHECK_MSG = 'KEKW';
const {
	TWITCH_USER,
	TWITCH_TOKEN
} = config;

export default class Play extends Phaser.Scene {
	constructor() {
		super({ key: 'Play' });

		this.playerSpeed = 550;
		this.jumpSpeed = -700;
	}

	init() {
		this.canFire = true;
		this.spawnQueue = [];
		this.spawnerEvents = {};
	}

	create() {
		this.setupMap();
		this.setupPlayer();
		this.setupAnimations();
		this.setupLevel();
		this.setupCamera();
		// this.setupTwitch();
		this.cursors = this.input.keyboard.createCursorKeys();

		this.input.keyboard.on('keydown-ESC', () => {
			this.scene.pause();
			this.scene.launch('Pause');
		});
	}

	update() {
		const isGrounded = this.player.body.blocked.down || this.player.body.touching.down;

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
			this.player.setFrame('idle01');
		}

		if (isGrounded && (this.cursors.space.isDown || this.cursors.up.isDown)) {
			// this.player.anims.stop('walking');
			this.player.anims.play('jumping');
			this.player.body.setVelocityY(this.jumpSpeed);
		}

		if (isGrounded && (this.cursors.shift.isDown)) {
			this.shootBullet(this.player, 'cone');
		}

		// When moving, check for portals
		if (this.player.body.velocity.x !== 0) {
			this.searchForPortals();
		}

		this.spawnEnemies();

		this.neckis.getChildren().forEach(necki => {
			if (necki.frame.name.includes('death')) {
				necki.setVelocityX(0);
			} else {
				necki.setVelocityX(-100);
			}
		})
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

	setupMap() {
		const map = this.make.tilemap({ key: 'map' });
		const platformerTileset = map.addTilesetImage('kenney', 'platformerTiles'); // params: name of tileset in tiled editor, key of the loaded tileset
		const backgroundLayer = map.createLayer('Background', platformerTileset);
		this.add.tileSprite(0, 0, map.widthInPixels, 900, 'background').setOrigin(0);
		this.physics.world.bounds.width = map.widthInPixels;
		this.physics.world.bounds.height = map.heightInPixels;
		this.groundLayer = map.createLayer('Ground', platformerTileset);
		this.platformsLayer = map.createLayer('Platforms', platformerTileset);
		this.gameMap = map;
	}

	setupPlayer() {
		const player = this.gameMap.getObjectLayer('Player').objects[0];
		this.player = this.add.sprite(player.x, player.y, 'ratz', 'idle01');
		this.player.flipX = true;
		this.physics.add.existing(this.player);
		this.player.body.setCollideWorldBounds(true);
	}

	setupLevel() {
		this.missiles = this.physics.add.group({ allowGravity: false });
		this.bullets = this.physics.add.group({ allowGravity: false });
		this.beams = this.physics.add.group({ allowGravity: false });
		this.createSpawner();
		this.createDeathZones();
		this.setCollisions();
		this.setOverlap();
	}

	createSpawner() {
		const summonEnemiesPortal = this.gameMap.getObjectLayer('Portal').objects.filter(portal => {
			return portal.properties.find(property => property.name === 'summonEnemies');
		});
		this.neckis = this.physics.add.group({
			allowGravity: true,
			collideWorldBounds: true
		});
		this.sentinels = this.physics.add.group({
			allowGravity: false,
			collideWorldBounds: true
		});

		// this.spawnEvent({
		// 	delay: 5000,
		// 	loop: true,
		// 	max: 15,
		// 	portal: summonEnemiesPortal[0],
		// 	group: this.neckis,
		// 	spawner: this.spawnNecki.bind(this)
		// });

		this.time.addEvent({
			delay: 4000,
			loop: false,
			callback: () => {
				this.spawnSentinel(summonEnemiesPortal[0].x, summonEnemiesPortal[0].y-10);
			}
		});
	}

	createDeathZones() {
		this.deathZones = this.physics.add.group({
			allowGravity: false,
			collideWorldBounds: true
		});
		this.gameMap.getObjectLayer('Death').objects.forEach(deathObject => {
			const zone = this.add.zone(deathObject.x, deathObject.y).setSize(100, 20);
			this.deathZones.add(zone);
		});
	}

	getNearestPortal(portals) {
		return portals.reduce((previousPortal, currentPortal) => {
			const previousDistance = Math.sqrt(Math.pow(previousPortal.x - this.player.x, 2) + Math.pow(previousPortal.y - this.player.y, 2));
			const currentDistance = Math.sqrt(Math.pow(currentPortal.x - this.player.x, 2) + Math.pow(currentPortal.y - this.player.y, 2));
			return previousDistance > currentDistance ? currentPortal : previousPortal;
		});
	}

	searchForPortals() {
		if (!this.spawnQueue.length) return;
		const portalBounds = {
			lower: this.player.x - 500,
			upper: this.player.x + 1000
		}
		this.portalsWithinRange = this.gameMap.getObjectLayer('Portal').objects.filter(portal => {
			return portal.x > portalBounds.lower && portal.x < portalBounds.upper;
		});
		this.portalsWithinRange.sort((portalA, portalB) => {
			const portalADistance = Math.sqrt(Math.pow(portalA.x - this.player.x, 2) + Math.pow(portalA.y - this.player.y, 2));
			const portalBDistance = Math.sqrt(Math.pow(portalB.x - this.player.x, 2) + Math.pow(portalB.y - this.player.y, 2));
			if (portalADistance < portalBDistance) {
				return -1;
			} else if (portalADistance > portalBDistance) {
				return 1;
			} else {
				return 0;
			}
		});
	}

	spawnEnemies() {
		if (!this.portalsWithinRange || !this.portalsWithinRange.length) return;
		if (!this.spawnQueue.length) return;
		const nearestPortal = this.portalsWithinRange[0];
		const nextSpawn = this.spawnQueue.shift();
		console.log('nextSpawn', nextSpawn);
		if (nextSpawn && nextSpawn.enemy === 'necki') {
			this.spawnNecki(nearestPortal.x, nearestPortal.y);
		}
	}

	spawnEvent(options) {
		return this.time.addEvent({
			delay: options.delay,
			loop: options.loop || false,
			callback: () => {
				const portalCoordinates = options.portal.x + ',' + options.portal.y;
				const portal = options.portal;
				const firstDead = options.group.getFirst(false);
				if (firstDead) {
					firstDead.x = portal.x;
					firstDead.y = portal.y;
					firstDead.setActive(true);
					firstDead.setVisible(true);
					return;
				}

				if (options.group.getLength() === options.max) {
					const firstAlive = options.group.getFirst(true);
					firstAlive.x = portal.x;
					firstAlive.y = portal.y;
				} else {
					options.spawner(portal.x, portal.y);
				}
			}
		});
	}

	spawnNecki(x, y) {
		const necki = this.neckis.get(x, y, 'enemies');
		necki.anims.play('necki-walking');
		necki.deathScore = 100;
		necki.deathAnim = 'necki-death';
		necki.body.width = necki.width;
		necki.body.height = necki.height;
		// Tweens don't work with collisions because collisions only work
		// with bodies with velocity and tweens only update the x,y
		// necki.patrolTween = this.tweens.add({
		// 	targets: necki,
		// 	x: x - 200,
		// 	duration: 1500,
		// 	flipX: true,
		// 	yoyo: true,
		// 	repeat: -1
		// });
		this.neckis.add(necki);
	}

	spawnSentinel(x, y) {
		const sentinel = this.sentinels.get(x, y, 'enemies'); // Float
		sentinel.anims.play('sentinel-idle');
		sentinel.deathScore = 300;
		sentinel.body.width = sentinel.width;
		sentinel.body.height = sentinel.height;
		this.sentinels.add(sentinel);
		this.time.addEvent({
			delay: 2000,
			callback: () => {
				// An error occurs if the sentinel is destroyed before releasing its
				// attack so we need to check to make sure it can play the animations
				if (sentinel.anims) {
					sentinel.anims.play('sentinel-attack');
					this.shootBeam(sentinel, this.player);
				}
			}
		});
	}

	setCollisions() {
		this.physics.add.collider(this.player, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.neckis, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.sentinels, [this.groundLayer, this.platformsLayer]);
		this.groundLayer.setCollisionBetween(1, 500); // `start`, `stop` - value is the number in layer data
		this.platformsLayer.setCollisionBetween(1, 500);
		// this.groundLayer.setCollisionByExclusion([1]);
	}

	setOverlap() {
		this.physics.add.overlap(this.player, this.spikes, this.restartGame, null, this);
		this.physics.add.overlap(this.player, this.neckis, this.restartGame, null, this);
		this.physics.add.overlap(this.missiles, this.neckis, this.missileHit, null, this);
		this.physics.add.overlap(this.bullets, [this.neckis, this.sentinels], this.bulletHit, null, this);
		this.physics.add.overlap(this.beams, this.player, this.beamHit, null, this);
		this.physics.add.overlap(this.player, this.deathZones, this.restartGame, null, this);
	}

	setupCamera() {
		this.cameras.main.setBounds(0, 0, this.gameMap.widthInPixels, this.gameMap.heightInPixels);
		// 2nd arg is `roundPixels` and fixes the black lines that appear between when moving
		this.cameras.main.startFollow(this.player, true);
	}

	setupTwitch() {
		if (this.chat) return;
		this.chat = new TwitchJs.Chat({
			username: TWITCH_USER,
			token: TWITCH_TOKEN
		});

		this.chat.on('*', (event) => {
			if (event.message.includes(CHECK_MSG)) {
				console.log('event.message', event.message);
				this.spawnQueue.push({
					enemy: 'necki'
				});
			}
		});

		this.chat.connect().then(() => {
			this.chat.join(TEST_CHANNEL).then(response => {
				console.log('response', response);
			}).catch(err => {
				console.error('join error', err);
			});
		}).catch(err => {
			console.error('connect error', err);
		});		
	}

	launchMissile(owner) {
		if (!this.canFire) return;
		// const missile = this.missiles.get(x, y, 'rocket');
		const missile = new Missile(this, owner);
		this.missiles.add(missile);
		this.setCooldown();
	}

	shootBullet(owner, pattern) {
		if (!this.canFire) return;
		if (pattern === 'cone') {
			let angles = [-60, -20, 60, 20, 0];
			angles.forEach(angle => {
				this.bullets.add(new Bullet(this, owner, angle * Math.PI/180));
			})
		} else {
			this.bullets.add(new Bullet(this, owner));
		}
		this.setCooldown();
	}

	shootBeam(owner, target) {
		const beam = new Beam(this, owner, target);
		this.beams.add(beam);
		owner.body.width = owner.width;
		owner.body.height = owner.height;
	}

	setCooldown() {
		this.canFire = false;
		this.time.addEvent({
			delay: 50,
			callback: () => {
				this.canFire = true;
			}
		});
	}

	missileHit(missile, targetHit) {
		if (targetHit.patrolTween) {
			targetHit.patrolTween.stop();
		}
		if (targetHit.deathAnim) {
			targetHit.on('animationcomplete-' + targetHit.deathAnim, () => {
				targetHit.destroy();
			});
			targetHit.anims.play(targetHit.deathAnim);
			targetHit.body.width = targetHit.width;
			targetHit.body.height = targetHit.height;
		} else {
			targetHit.destroy();
		}

		missile.destroy();
	}

	bulletHit(bullet, targetHit) {
		if (targetHit.patrolTween) {
			targetHit.patrolTween.stop();
		}
		if (targetHit.deathAnim) {
			targetHit.on('animationcomplete-' + targetHit.deathAnim, () => {
				this.destroyTarget(targetHit);
			});
			targetHit.anims.play(targetHit.deathAnim);
			targetHit.body.setVelocityX(0);
			targetHit.body.width = targetHit.width;
			targetHit.body.height = targetHit.height;
		} else {
			this.destroyTarget(targetHit);
		}
		bullet.destroy();
	}

	// Not sure why these params are reversed here??
	beamHit(targetHit, beam) {
		beam.explode();
	}

	destroyTarget(target) {
		const scoreText = this.add.bitmapText(target.x, target.y, 'arcade', '', 38)
			.setInteractive()
			.setOrigin(0.5)
			.setCenterAlign()
			.setScale(0.5)
			.setText(target.deathScore)
		;
		this.tweens.add({
			targets: scoreText,
			y: scoreText.y - 100,
			alpha: 0,
			duration: 2000,
			ease: 'Power2'
		}, this);
		target.destroy();
	}

	restartGame(collider, collidee) {
		// Ignore death animation sprites
		if (collidee.frame && collidee.frame.name.includes('death')) return;
		this.scene.restart();
	}

	setupAnimations() {
		// Trying to make this DRY
		const frameConfig = (end, prefix, start = 1, suffix = '', zeroPad = 2) => {
			// `end` is basically the number of frames
			// `prefix` is basically the frame name
			return { start, end, prefix, zeroPad, suffix }
		}
		if (!this.anims.get('walking')) {
			this.anims.create({
				key: 'walking',
				frames: this.anims.generateFrameNames('ratz', frameConfig(10, 'idle')),
				frameRate: 12,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('jumping')) {
			this.anims.create({
				key: 'jumping',
				frames: this.anims.generateFrameNames('ratz', frameConfig(6, 'walk')),
				frameRate: 12,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('necki-walking')) {
			this.anims.create({
				key: 'necki-walking',
				frames: this.anims.generateFrameNames('enemies', frameConfig(6, 'jrnecki/walk')),
				frameRate: 6,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('necki-death')) {
			this.anims.create({
				key: 'necki-death',
				frames: this.anims.generateFrameNames('enemies', frameConfig(3, 'jrnecki/death')),
				frameRate: 6
			});
		}

		if (!this.anims.get('sentinel-idle')) {
			this.anims.create({
				key: 'sentinel-idle',
				frames: this.anims.generateFrameNames('enemies', frameConfig(4, 'sentinel/idle')),
				frameRate: 4,
				yoyo: true,
				repeat: -1
			});
		}

		if (!this.anims.get('sentinel-attack')) {
			this.anims.create({
				key: 'sentinel-attack',
				frames: this.anims.generateFrameNames('enemies', frameConfig(9, 'sentinel/attack')),
				yoyo: true,
				frameRate: 9
			});
		}

		if (!this.anims.get('beam-fire')) {
			this.anims.create({
				key: 'beam-fire',
				frames: this.anims.generateFrameNames('enemies', frameConfig(4, 'sentinel/fire')),
				frameRate: 4
			});
		}

		if (!this.anims.get('beam-explode')) {
			this.anims.create({
				key: 'beam-explode',
				frames: this.anims.generateFrameNames('enemies', frameConfig(5, 'sentinel/explode')),
				frameRate: 10
			});
		}
	}
}