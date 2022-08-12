import * as Phaser from 'phaser';
import Projectile from './Projectile';

const SPEED = 250;
const MAX_HEALTH = 3;
const HIT_INVULNERABILITY = 1000;

export default class Player extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		// The map moves up and down slightly when player moves
		// This may be due to iconsistent `ratz` sprite sizes
		super(scene, x, y, 'ratz', 'idle01');

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setCollideWorldBounds(true);

		// Properties that can change
		this.speed = SPEED;
		this.jumpSpeed = -600;
		this.projectileCooldown = 500;
		this.maxHealth = 3;
		this.health = this.maxHealth;
		this.isInvulnerable = false;
		this.canFire = true;
		this.canMove = true;
		this.knockedBack = false;
		this.projectile = 'beam'; // start off with beam?
	}

	update() {
		const isGrounded = this.body.blocked.down || this.body.touching.down;
		const cursors = this.scene.cursors;

		if (this.knockedBack) {
			this.body.setVelocity(this.knockedBackDirection > 0 ? -300 : 300, -50);
		}

		if (cursors.left.isDown && this.canMove) {
			this.body.setVelocityX(-this.speed);
			this.flipX = false;
			if (!this.anims.isPlaying) {
				this.anims.play('walking');
			}
		} else if (cursors.right.isDown && this.canMove) {
			this.body.setVelocityX(this.speed);
			this.flipX = true;
			if (!this.anims.isPlaying) {
				this.anims.play('walking');
			}
		} else if (!this.knockedBack) {
			this.body.setVelocityX(0);
			this.anims.stop('walking');
			this.setFrame('idle01');
		}

		if ((cursors.space.isDown || cursors.up.isDown) && isGrounded && this.canMove) {
			// this.player.anims.stop('walking');
			this.anims.play('jumping');
			this.body.setVelocityY(this.jumpSpeed);
		}

		if (cursors.shift.isDown && this.projectile && this.canMove) {
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

	// TODO: Come up with better way to prevent users from "recovering" too quickly after being knocked back
	knockBack() {
		this.canMove = false;
		this.knockedBack = true;
		this.knockedBackDirection = this.body.overlapX;
		this.speed = SPEED/8; // Probably not the best idea
		this.scene.time.addEvent({
			delay: HIT_INVULNERABILITY/4,
			callback: () => {
				this.canMove = true;
				this.knockedBack = false;
				this.speed = SPEED;
			}
		});
	}

	takeDamage(hpLost) {
		if (this.isInvulnerable) return;
		this.knockBack();
		this.health -= hpLost;
		this.isInvulnerable = true;
		this.alpha = 0.5;
		this.scene.healthText.setText(String(this.health).padStart(3, 0));
		this.scene.time.addEvent({
			delay: HIT_INVULNERABILITY,
			callback: () => {
				this.alpha = 1;
				this.isInvulnerable = false;
			}
		});

		if (this.health === 0) {
			this.setVisible(false);
			this.scene.endGame();
		}
	}
}