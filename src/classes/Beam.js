import * as Phaser from 'phaser';

const SPEED = 500;

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

		// Enable physics on the beam
		scene.add.existing(this);
		scene.physics.add.existing(this);
		// Define constants that affect motion
		this.speed = SPEED; // beam speed pixels/second
		this.flipX = !owner.flipX;
		this.target = target;
		this.targetx = '';
		this.targety = '';

		this.anims.play('beam-fire');

		this.scene.time.addEvent({
			delay: 1800,
			callback: () => {
				if (this.anims && !this.anims.currentAnim.key.includes('explode')) {
					this.explode();
				}
			}
		});
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.anims && !this.anims.isPlaying) {
			this.body.width = this.width;
			this.body.height = this.height;
			if (this.targetx === '') {
				// We want the target's position here so that it's actually 
				// the beam that targets the player and not the charge-up animation
				this.targetx = this.target.x;
				this.targety = this.target.y;
			}
			this.fire();
		 }
	}

	// Fires in a straight line
	fire() {
		if (this.target) {
			this.aimAtTarget();
		} else {
			this.body.velocity.x = this.speed * (!this.flipX ? 1 : -1);
		}
	}

	// TODO: Fix player jumping on beams
	explode() {
		this.body.velocity.x = 0;
		this.body.velocity.y = 0;
		this.body.width = 0;
		this.body.height = 0;
		this.anims.play('beam-explode');
		this.on('animationcomplete-beam-explode', () => {
			this.destroy();
		});
	}

	aimAtTarget() {
		if (Math.abs(this.targetx - this.x) < 3 && Math.abs(this.targety - this.y) < 3) {
			// Considering within 3 pixels close enough
			return this.explode();
		}
		// Calculate the angle from the beam to the target
		var targetAngle = Phaser.Math.Angle.Between(
			this.x, this.y,
			this.targetx, this.targety
		);
		// Calculate velocity vector based on targetAngle and this.speed
		this.body.velocity.x = Math.cos(targetAngle) * this.speed;
		this.body.velocity.y = Math.sin(targetAngle) * this.speed;
	}
}