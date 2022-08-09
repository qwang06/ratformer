import * as Phaser from 'phaser';

export default class Beam extends Phaser.GameObjects.Sprite {
	constructor(scene, owner, target) {
		const offsetx = owner.width - 10;

		let startx, starty;

		if (!owner.flipX) {
			startx = owner.x - offsetx;
		} else {
			startx = owner.x + offsetx;
		}
		starty = owner.y;

		super(scene, startx, starty, 'enemies');

		// Enable physics on the missile
		scene.add.existing(this);
		scene.physics.add.existing(this); // scene.physics.world.enableBody(this);
		// Define constants that affect motion
		this.SPEED = 500; // missile speed pixels/second
		this.TURN_RATE = 5; // turn rate in degrees/frame
		this.MAX_DISTANCE = 350;
		this.startx = startx;
		this.starty = starty;
		this.targetx = target.x; // Use these so that it doesn't actually home in on the target
		this.targety = target.y;
		this.flipX = !owner.flipX;
		this.target = target;

		this.anims.play('beam-fire');
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.anims && !this.anims.isPlaying) {
			this.body.width = this.width;
			this.body.height = this.height;
			this.fire();
		}
	}

	// Fires in a straight line
	fire() {
		const upperx = this.startx + this.MAX_DISTANCE;
		const lowerx = this.startx - this.MAX_DISTANCE;

		if (this.x > upperx || this.x < lowerx) {
			this.explode();
		} else {
			if (this.target) {
				this.aimAtTarget(this.target);
			} else {
				this.body.velocity.x = this.SPEED * (!this.flipX ? 1 : -1);
			}
		}
	}

	explode() {
		this.body.velocity.x = 0;
		this.body.velocity.y = 0;
		this.anims.play('beam-explode');
		this.on('animationcomplete-beam-explode', () => {
			this.destroy();
		});
	}

	aimAtTarget(target) {
		// Calculate the angle from the missile to the target
		var targetAngle = Phaser.Math.Angle.Between(
			this.x, this.y,
			this.targetx, this.targety
		);
		// Calculate velocity vector based on targetAngle and this.SPEED
		this.body.velocity.x = Math.cos(targetAngle) * this.SPEED;
		this.body.velocity.y = Math.sin(targetAngle) * this.SPEED;
	}
}