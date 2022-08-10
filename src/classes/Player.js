import * as Phaser from 'phaser';
import Projectile from './Projectile';

export default class Player extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'ratz', 'idle01');

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setCollideWorldBounds(true);
		this.flipX = true;

		this.playerSpeed = 250;
		this.jumpSpeed = -600;
		this.projectileCooldown = 500;
		this.canFire = true;
		this.projectile = 'bullet'; // start off with normal bullets?
	}

	destroy() {
		super.destroy();
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
	}

	update() {
		const isGrounded = this.body.blocked.down || this.body.touching.down;
		const cursors = this.scene.cursors;

		if (cursors.left.isDown) {
			this.body.setVelocityX(-this.playerSpeed);
			this.flipX = false;
			if (!this.anims.isPlaying) {
				this.anims.play('walking');
			}
		} else if (cursors.right.isDown) {
			this.body.setVelocityX(this.playerSpeed);
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

		if (isGrounded && (cursors.shift.isDown)) {
			if (this.projectile) {
				this.shootProjectile(this);
			}
		}

		super.update();
	}

	// Here is where I decide what items does
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
}