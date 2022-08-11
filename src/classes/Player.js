import * as Phaser from 'phaser';
import Projectile from './Projectile';

export default class Player extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		// The map moves up and down slightly when player moves
		// This may be due to iconsistent `ratz` sprite sizes
		super(scene, x, y, 'ratz', 'idle01');

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setCollideWorldBounds(true);

		// Constants
		this.MAX_HEALTH = 2;
		this.HIT_INVULNERABILITY = 500; // in milliseconds

		// Properties that can change
		this.speed = 250;
		this.jumpSpeed = -600;
		this.projectileCooldown = 500;
		this.health = this.MAX_HEALTH;
		this.isInvulnerable = false;
		this.canFire = true;
		this.projectile = 'beam'; // start off with beam?
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
	}

	update() {
		const isGrounded = this.body.blocked.down || this.body.touching.down;
		const cursors = this.scene.cursors;

		if (cursors.left.isDown) {
			this.body.setVelocityX(-this.speed);
			this.flipX = false;
			if (!this.anims.isPlaying) {
				this.anims.play('walking');
			}
		} else if (cursors.right.isDown) {
			this.body.setVelocityX(this.speed);
			this.flipX = true;
			if (!this.anims.isPlaying) {
				this.anims.play('walking');
			}
		} else {
			this.body.setVelocityX(0);
			this.anims.stop('walking');
			this.setFrame('idle01');
		}

		if (isGrounded && (cursors.space.isDown || cursors.up.isDown)) {
			// this.player.anims.stop('walking');
			this.anims.play('jumping');
			this.body.setVelocityY(this.jumpSpeed);
		}

		if (cursors.shift.isDown && this.projectile) {
			this.shootProjectile(this);
		}

		super.update();
	}

	// Here is where I decide what each item does
	pickUp(item) {
		const throwingStars = ['subi', 'steely'];
		this.item = item.item;
		if (throwingStars.includes(this.item)) {
			this.projectileCooldown = 250;
			this.projectile = this.item;
		} else if (this.item === 'dew') {
			this.projectilePattern = 'cone';
		}
	}

	shootProjectile(owner) {
		if (!this.canFire) return;
		const projectileConfig = {
			projectile: this.projectile
		}
		if (this.projectilePattern === 'cone') {
			let angles = [-60, -20, 60, 20, 0];
			angles.forEach(angle => {
				projectileConfig.angle = angle;
				this.scene.projectiles.add(new Projectile(this.scene, owner, projectileConfig));
			})
		} else {
			this.scene.projectiles.add(new Projectile(this.scene, owner, projectileConfig));
		}
		this.setCooldown();
	}

	setCooldown() {
		this.canFire = false;
		this.scene.time.addEvent({
			delay: this.projectileCooldown,
			callback: () => {
				this.canFire = true;
			}
		});
	}

	knockBack() {
		console.log('isFlipped', this.flipX);
		if (this.flipX) {
			this.body.setBounce(20, 20);
		}
	}

	takeDamage(hpLost) {
		if (this.isInvulnerable) return;
		this.knockBack();
		this.health -= hpLost;
		this.isInvulnerable = true;
		this.alpha = 0.5;
		this.scene.healthText.setText(String(this.health).padStart(3, 0));
		this.scene.time.addEvent({
			delay: this.HIT_INVULNERABILITY,
			callback: () => {
				this.alpha = 1;
				this.isInvulnerable = false;
				this.body.setBounce(0);
			}
		});

		if (this.health === 0) {
			this.setVisible(false);
			this.scene.endGame();
		}
	}
}