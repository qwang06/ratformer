import * as Phaser from 'phaser';
import Bullet from './Bullet';
import ItemProjectile from './ItemProjectile';

export default class Player extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'ratz', 'idle01');

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setCollideWorldBounds(true);
		this.flipX = true;

		this.playerSpeed = 550;
		this.jumpSpeed = -700;
		this.projectileCooldown = 150;
		this.canFire = true;
		this.projectile = '';
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
			} else {
				this.shootBullet(this);
			}
		}

		super.update();
	}

	pickUp(item) {
		this.projectile = item.item;
	}

	shootProjectile(owner, pattern) {
		if (!this.canFire) return;
		this.scene.projectiles.add(new ItemProjectile(this.scene, owner, this.projectile));
		this.setCooldown();
	}

	shootBullet(owner, pattern) {
		if (!this.canFire) return;
		if (pattern === 'cone') {
			let angles = [-60, -20, 60, 20, 0];
			angles.forEach(angle => {
				this.scene.bullets.add(new Bullet(this.scene, owner, angle * Math.PI/180));
			})
		} else {
			this.scene.bullets.add(new Bullet(this.scene, owner));
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