import * as Phaser from 'phaser';

/**
 * General projectiles
 */
export default class Projectile extends Phaser.GameObjects.Sprite {
	constructor(scene, owner, config) {
		const offsetx = owner.width - 10;

		let startx, starty;

		if (!owner.flipX) {
			startx = owner.x - offsetx;
		} else {
			startx = owner.x + offsetx;
		}
		starty = owner.y;

		super(scene, startx, starty, 'items');

		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.SPEED = 500;
		this.MAX_DISTANCE = 600;
		this.startx = startx;
		this.starty = starty;
		this.flipX = owner.flipX;
		this.projectile = config.projectile;
		this.bulletAngle = config.angle;

		this.setAnimation();
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.bulletAngle) {
			this.fireAngle();
		} else {
			this.fire();
		}

		if (this.projectile === 'subi') {
			this.rotation -= Phaser.Math.DegToRad(75);
		}
	}

	// Fires in a straight line
	fire() {
		const upperx = this.startx + this.MAX_DISTANCE;
		const lowerx = this.startx - this.MAX_DISTANCE;

		if (this.x > upperx || this.x < lowerx) {
			this.destroy();
		} else {
			this.body.velocity.x = this.SPEED * (this.flipX ? 1 : -1);
		}
	}

	fireAngle() {
		// const distanceTraveled = Math.sqrt(Math.pow(this.x - this.startx, 2) + Math.pow(this.y - this.starty, 2));
		const distanceTraveled = Phaser.Math.Distance.Between(this.x, this.y, this.startx, this.starty);

		if (distanceTraveled > this.MAX_DISTANCE) {
			this.destroy();
		} else {
			this.body.velocity.x = this.SPEED * (!this.flipX ? -1 : 1);
			this.body.velocity.y = Math.sin(this.bulletAngle) * this.SPEED;
		}
	}

	setAnimation() {
		if (this.projectile === 'steely') {
			this.anims.play('steely-fire');
		} else if (this.projectile === 'subi') {
			this.setFrame('subi');
		} else if (this.projectile === 'bullet') {
			this.setTexture('enemies');
			this.setFrame('sentinel/fire04');
			this.body.width = this.width;
			this.body.height = this.height;
		}
	}
}