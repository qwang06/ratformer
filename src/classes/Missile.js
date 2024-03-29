import * as Phaser from 'phaser';

export default class Missile extends Phaser.GameObjects.Sprite {
	constructor(scene, owner) {
		const offsetx = owner.width - 10;

		let startx, starty;

		if (!owner.flipX) {
			startx = owner.x - offsetx;
		} else {
			startx = owner.x + offsetx;
		}
		starty = owner.y;

		super(scene, startx, starty, 'rocket');

		// Enable physics on the missile
		scene.add.existing(this);
		scene.physics.add.existing(this); // scene.physics.world.enableBody(this);
		// Define constants that affect motion
		this.SPEED = 250; // missile speed pixels/second
		this.TURN_RATE = 5; // turn rate in degrees/frame
		this.maxDistance = 250;
		this.startx = startx;
		this.starty = starty;
		this.flipX = !owner.flipX;
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		this.fire();
	}

	// Fires in a straight line
	fire() {
		const upperx = this.startx + this.maxDistance;
		const lowerx = this.startx - this.maxDistance;
		this.body.velocity.x = this.SPEED * (!this.flipX ? 1 : -1);
		if (this.x > upperx || this.x < lowerx) {
			this.destroy();
		}
	}

	fireAtTarget(target) {
		// Calculate the angle from the missile to the mouse cursor game.input.x
		// and game.input.y are the mouse position; substitute with whatever
		// target coordinates you need.
		var targetAngle = Phaser.Math.Angle.Between(
			this.x, this.y,
			target.x, target.y
		);

		// Gradually (this.TURN_RATE) aim the missile towards the target angle
		if (this.rotation !== targetAngle) {
			// Calculate difference between the current angle and targetAngle
			var delta = targetAngle - this.rotation;

			// Keep it in range from -180 to 180 to make the most efficient turns.
			if (delta > Math.PI) delta -= Math.PI * 2;
			if (delta < -Math.PI) delta += Math.PI * 2;

			if (delta > 0) {
				// Turn clockwise
				this.angle += this.TURN_RATE;
			} else {
				// Turn counter-clockwise
				this.angle -= this.TURN_RATE;
			}

			// Just set angle to target angle if they are close
			if (Math.abs(delta) < Phaser.Math.DegToRad(this.TURN_RATE)) {
				this.rotation = targetAngle;
			}
		}

		// Calculate velocity vector based on this.rotation and this.SPEED
		this.body.velocity.x = Math.cos(this.rotation) * this.SPEED;
		this.body.velocity.y = Math.sin(this.rotation) * this.SPEED;
	}
}