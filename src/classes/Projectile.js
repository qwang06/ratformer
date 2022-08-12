import * as Phaser from 'phaser';

const SPEED = 500;

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

		this.speed = SPEED;
		this.flipX = owner.flipX;
		this.projectile = config.projectile;
		this.targetx = config.target.x;
		this.targety = config.target.y;
		this.bulletAngle = config.angle;

		this.scene.time.addEvent({
			delay: config.lifetime || 600, // lifetime of projectile
			callback: () => {
				this.destroy()
			}
		});

		this.setAnimation();
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.bulletAngle) {
			this.fireAngle();
		} else if (this.targetx && this.targety) {
			this.aimAtTarget();
		} else {
			this.fire();
		}

		if (this.projectile === 'subi') {
			this.rotation -= Phaser.Math.DegToRad(75);
		}
	}

	// Fires in a straight line
	fire() {
		this.body.velocity.x = this.speed * (this.flipX ? 1 : -1);
	}

	fireAngle() {
		this.body.velocity.x = this.speed * (!this.flipX ? -1 : 1);
		this.body.velocity.y = Math.sin(this.bulletAngle) * this.speed;
	}

	setAnimation() {
		if (this.projectile === 'steely') {
			this.anims.play('steely-fire');
		} else if (this.projectile === 'subi') {
			this.setFrame('subi');
		} else if (this.projectile === 'beam') {
			this.setTexture('enemies');
			this.setFrame('sentinel/fire04');
			this.body.width = this.width;
			this.body.height = this.height;
		}
	}

	aimAtTarget() {
		if (Math.abs(this.targetx - this.x) < 3 && Math.abs(this.targety - this.y) < 3) {
			// Considering within 3 pixels close enough
			return this.destroy();
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