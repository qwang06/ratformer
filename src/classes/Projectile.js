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
		this.flipX = owner.flipX;
		this.projectile = config.projectile;
		this.bulletAngle = config.angle;

		this.scene.time.addEvent({
			delay: 600, // lifetime of projectile
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
		} else {
			this.fire();
		}

		if (this.projectile === 'subi') {
			this.rotation -= Phaser.Math.DegToRad(75);
		}
	}

	// Fires in a straight line
	fire() {
		this.body.velocity.x = this.SPEED * (this.flipX ? 1 : -1);
	}

	fireAngle() {
		this.body.velocity.x = this.SPEED * (!this.flipX ? -1 : 1);
		this.body.velocity.y = Math.sin(this.bulletAngle) * this.SPEED;
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
}