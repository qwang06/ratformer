import * as Phaser from 'phaser';

export default class Bullet extends Phaser.GameObjects.Sprite {
	constructor(scene, owner, angle) {
		const offsetx = owner.width - 10;

		let startx, starty;

		if (!owner.flipX) {
			startx = owner.x - offsetx;
		} else {
			startx = owner.x + offsetx;
		}
		starty = owner.y;

		super(scene, startx, starty, 'enemies');

		// Enable physics on the bullet
		scene.add.existing(this);
		scene.physics.add.existing(this); // scene.physics.world.enableBody(this);
		// Define constants that affect motion
		this.SPEED = 500; // bullet speed pixels/second
		this.MAX_DISTANCE = 600;
		this.startx = startx;
		this.starty = starty;
		this.flipX = !owner.flipX;
		this.bulletAngle = angle;

		this.setFrame('sentinel/fire04');
		this.body.width = this.width;
		this.body.height = this.height;
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.anims && !this.anims.isPlaying) {
			if (this.bulletAngle) {
				this.fireAngle();
			} else {
				this.fire();
			}
		}
	}

	// Fires in a straight line
	fire() {
		const upperx = this.startx + this.MAX_DISTANCE;
		const lowerx = this.startx - this.MAX_DISTANCE;

		if (this.x > upperx || this.x < lowerx) {
			this.destroy();
		} else {
			this.body.velocity.x = this.SPEED * (!this.flipX ? 1 : -1);
		}
	}

	fireAngle() {
		const distanceTraveled = Math.sqrt(Math.pow(this.x - this.startx, 2) + Math.pow(this.y - this.starty, 2));

		if (distanceTraveled > this.MAX_DISTANCE) {
			this.destroy();
		} else {
			this.body.velocity.x = this.SPEED * (this.flipX ? -1 : 1);
			this.body.velocity.y = Math.sin(this.bulletAngle) * this.SPEED;
		}
	}
}