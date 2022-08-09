import * as Phaser from 'phaser';

/**
 * This is the projectile that fires from a looted item
 */
export default class ItemProjectile extends Phaser.GameObjects.Sprite {
	constructor(scene, owner) {
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

		this.anims.play('steely-fire');
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		this.fire();
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
}