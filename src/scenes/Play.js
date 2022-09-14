import * as Phaser from 'phaser';
import config from '../../config';
import Chest from '../classes/Chest';
import Player from '../classes/Player';
import Projectile from '../classes/Projectile';
import Sentinel from '../classes/enemies/Sentinel';
import Necki from '../classes/enemies/Necki';
import TwitchJs from 'twitch-js';

const TEST_CHANNEL = 'qwang00';
const {
	TWITCH_USER,
	TWITCH_TOKEN
} = config;

export default class Play extends Phaser.Scene {
	constructor() {
		super({ key: 'Play' });
	}

	init() {
		this.spawnQueue = [];
		this.spawnerEvents = {};
		this.score = 0;

		// TODO: Create and save settings in menu
		this.displayEnemyNames = true;
	}

	create() {
		this.setupMap();
		this.setupPlayer();
		this.setupAnimations();
		this.setupLevel();
		this.setupHUD();
		this.setupCamera();
		this.setupTwitch();
		this.cursors = this.input.keyboard.createCursorKeys();

		this.input.keyboard.on('keydown-ESC', () => {
			this.scene.pause();
			this.scene.launch('Pause');
		});
	}

	update() {
		this.player.update()

		// When moving, check for portals
		if (this.player.body.velocity.x !== 0) {
			this.searchForPortals();
		}

		this.spawnEnemies()
	}

	setupMap() {
		const map = this.make.tilemap({ key: 'map' });
		// const platformerTileset = map.addTilesetImage('kenney', 'platformerTiles'); // params: name of tileset in tiled editor, key of the loaded tileset
		const kgTileset = map.addTilesetImage('kenney_grass', 'kenney_grass');
		const kcTileset = map.addTilesetImage('kenney_castle', 'kenney_castle');
		// const backgroundLayer = map.createLayer('Background', platformerTileset);
		this.add.tileSprite(0, 0, map.widthInPixels, map.heightInPixels, 'background')
			.setOrigin(0)
			.setScrollFactor(1, 0)
			.setDepth(-2)
		;
		this.physics.world.bounds.width = map.widthInPixels;
		this.physics.world.bounds.height = map.heightInPixels;
		this.groundLayer = map.createLayer('Ground', kgTileset);
		this.platformsLayer = map.createLayer('Platforms', kcTileset);
		this.edgeBlockLayer = map.createLayer('Edge Block', kcTileset); // This layer is to prevent enemies from walking over the edge (it's invisible)
		this.gameMap = map;
	}

	setupPlayer() {
		const player = this.gameMap.getObjectLayer('Player').objects[0];
		this.player = new Player(this, player.x, player.y);
	}

	setupHUD() {
		this.healthText = this.add.bitmapText(60, 30, 'arcade', String(this.player.health).padStart(3, 0));
		this.scoreText = this.add.bitmapText(150, 30, 'arcade', `SCORE ${String(this.score).padStart(5, 0)}`);

		// setDropShadow(4, 6, 0xff00ff, 0.7) - very retro magenta
		this.healthText
			.setOrigin(0)
			.setScale(0.5)
			.setScrollFactor(0)
			.setDropShadow(1, 1)
		;
		this.scoreText
			.setOrigin(0)
			.setScale(0.5)
			.setScrollFactor(0)
			.setDropShadow(1, 1)
		;
		this.add.sprite(25, 25, 'heart')
			.setScrollFactor(0)
			.setScale(0.5)
			.setOrigin(0)
		;
	}

	setupLevel() {
		this.beams = this.physics.add.group({ allowGravity: false });
		this.projectiles = this.physics.add.group({ allowGravity: false });
		this.items = this.physics.add.group({ allowGravity: true, collideWorldBounds: true  });
		this.createChests();
		this.createSpawner();
		this.createDeathZones();
		this.setCollisions();
		this.setOverlap();
	}

	createChests() {
		this.chests = this.physics.add.group({ allowGravity: true, collideWorldBounds: true });
		this.gameMap.getObjectLayer('Chests').objects.forEach(chestObj => {
			const chest = new Chest(this, chestObj.x, chestObj.y);
			this.chests.add(chest);
		});
	}

	createSpawner() {
		this.neckis = this.physics.add.group({ allowGravity: true, collideWorldBounds: true });
		this.sentinels = this.physics.add.group({ allowGravity: false, collideWorldBounds: true });
		this.portals = this.physics.add.group({ allowGravity: false, collideWorldBounds: true });
		this.enemyProjectiles = this.physics.add.group({ allowGravity: false, collideWorldBounds: true });

		this.gameMap.getObjectLayer('Portals').objects.forEach(portal => {
			// This loops through all portals so creating new portals just need to run here
			this.portals.get(portal.x, portal.y, 'portal')
				.setOrigin(1)
				.setDepth(-1)
			;
		});
		// this.rangedPortals = this.gameMap.getObjectLayer('Portals').objects.filter(portal => {
		// 	return portal.properties.find(property => property.name === 'ranged');
		// });
		// this.projectilesPortals = this.gameMap.getObjectLayer('Portals').objects.filter(portal => {
		// 	return portal.properties.find(property => property.name === 'projectiles');
		// });

		// this.spawnSentinel(this.rangedPortals[0].x, this.rangedPortals[0].y);
		// this.spawnNecki(this.meleePortals[0].x, this.meleePortals[0].y);
		// this.spawnEnemyProjectile(this.projectilesPortals[0].x, this.projectilesPortals[0].y);
	}

	createDeathZones() {
		this.deathZones = this.physics.add.group({
			allowGravity: false,
			collideWorldBounds: true
		});
		this.gameMap.getObjectLayer('Death').objects.forEach(deathObject => {
			const zone = this.add.zone(deathObject.x, deathObject.y).setSize(160, 20);
			this.deathZones.add(zone);
		});
	}

	getNearestPortal(portals) {
		return portals.reduce((previousPortal, currentPortal) => {
			const previousDistance = Phaser.Math.Distance.Between(previousPortal.x, previousPortal.y, this.player.x, this.player.y);
			const currentDistance = Phaser.Math.Distance.Between(currentPortal.x, currentPortal.y, this.player.x, this.player.y);
			return previousDistance > currentDistance ? currentPortal : previousPortal;
		});
	}

	searchForPortals() {
		if (!this.spawnQueue.length) return;
		const portalBounds = {
			lowerX: this.player.x - this.game.config.width,
			upperX: this.player.x + this.game.config.width,
			lowerY: this.player.y - 500,
			upperY: this.player.y + 500
		}
		this.portalsWithinRange = this.gameMap.getObjectLayer('Portals').objects.filter(portal => {
			return portal.x > portalBounds.lowerX && portal.x < portalBounds.upperX && portal.y > portalBounds.lowerY && portal.y < portalBounds.upperY;
		});
		this.portalsWithinRange.sort((portalA, portalB) => {
			const portalADistance = Phaser.Math.Distance.Between(portalA.x, portalA.y, this.player.x, this.player.y);
			const portalBDistance = Phaser.Math.Distance.Between(portalB.x, portalB.y, this.player.x, this.player.y);
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
		if (nextSpawn && ['necki', 'sentinel', 'projectile'].includes(nextSpawn.enemy)) {
			if (nextSpawn.enemy === 'necki') {
				this.spawnEnemy(nearestPortal.x, nearestPortal.y, nextSpawn.name, this.neckis, Necki);
			} else if (nextSpawn.enemy === 'sentinel') {
				this.spawnEnemy(nearestPortal.x, nearestPortal.y, nextSpawn.name, this.sentinels, Sentinel);
			} else if (nextSpawn.enemy === 'projectile') {
				this.spawnEnemyProjectile(nearestPortal.x, nearestPortal.y);
			}
		}
	}

	spawnEnemy(x, y, name, group, EnemyClass) {
		group.add(new EnemyClass(this, x, y, name));
	}

	spawnEnemyProjectile(x, y) {
		const projectileConfig = {
			projectile: 'subi', // TODO: make this dynamic
			target: this.player,
			lifetime: 1500
		};
		const portalProperties = {
			width: 70,
			flipX: false,
			x, y
		}
		const projectile = new Projectile(this, portalProperties, projectileConfig);
	}

	setCollisions() {
		this.physics.add.collider(this.player, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.neckis, [this.groundLayer, this.platformsLayer, this.edgeBlockLayer]);
		this.physics.add.collider(this.sentinels, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.items, [this.groundLayer, this.platformsLayer]);
		this.physics.add.collider(this.chests, [this.groundLayer, this.platformsLayer]);
		this.groundLayer.setCollisionBetween(1, 500); // `start`, `stop` - value is the number in layer data
		this.platformsLayer.setCollisionBetween(1, 500);
		this.edgeBlockLayer.setCollisionBetween(1, 500);
		// this.groundLayer.setCollisionByExclusion([1]);
	}

	setOverlap() {
		this.physics.add.overlap(this.player, this.neckis, () => { this.player.takeDamage(1) });
		this.physics.add.overlap(this.player, this.items, this.pickUpItem, null, this);
		this.physics.add.overlap(this.projectiles, [this.neckis, this.sentinels, this.chests], this.projectileHit, null, this);
		this.physics.add.overlap(this.beams, this.player, this.beamHit, null, this);
		this.physics.add.overlap(this.player, this.deathZones, this.endGame, null, this);
	}

	setupCamera() {
		this.cameras.main.setBounds(0, 0, this.gameMap.widthInPixels, this.gameMap.heightInPixels);
		// 2nd arg is `roundPixels` and fixes the black lines that appear between when moving
		this.cameras.main.startFollow(this.player, true);
	}

	setupTwitch() {
		if (this.chat) return;
		// These are the strings that will summon specific enemies, traps, projectiles
		const stringTest = {
			neckis: 'n', // TODO: These should really be `!spawn necki` or something to that effect but this is fine for testing
			sentinels: 's',
			projectiles: 'p'
		};

		this.chat = new TwitchJs.Chat({
			username: TWITCH_USER,
			token: TWITCH_TOKEN,
			log: { level: 'error' }
		});

		this.chat.on('PRIVMSG', (event) => {
			if (!event.message) return;
			const spawnQueueObj = {
				name: event.username,
				enemy: ''
			};

			if (event.message.includes(stringTest.neckis)) {
				spawnQueueObj.enemy = 'necki';
			} else if (event.message.includes(stringTest.sentinels)) {
				spawnQueueObj.enemy = 'sentinel';
			} else if (event.message.includes(stringTest.projectiles)) {
				spawnQueueObj.enemy = 'projectile';
			}
			if (spawnQueueObj.enemy) {
				this.spawnQueue.push(spawnQueueObj);
			}
		});

		this.chat.connect().then(() => {
			this.chat.join(TEST_CHANNEL).then(response => {
				console.log('successfully joined channel');
			}).catch(err => {
				console.error('join error', err);
			});
		}).catch(err => {
			console.error('connect error', err);
		});		
	}

	pickUpItem(player, item) {
		this.player.pickUp(item);
		item.destroy();
	}

	projectileHit(bullet, targetHit) {
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
		if (beam.anims && beam.anims.currentFrame.textureFrame.includes('fire04')) {
			// The other frames are charge-up animations
			this.player.takeDamage(1);
			beam.explode();
		}
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

	endGame(collider, collidee) {
		if (collider && collidee) {
			// Ignore death animation sprites
			if (collidee.frame && collidee.frame.name.includes('death')) return;
		}
		this.scene.pause();
		this.scene.launch('End');
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

		if (!this.anims.get('steely-fire')) {
			this.anims.create({
				key: 'steely-fire',
				frames: this.anims.generateFrameNames('items', frameConfig(2, 'steely_throw')),
				frameRate: 15,
				repeat: -1
			});
		}
	}
}