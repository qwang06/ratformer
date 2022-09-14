import * as Phaser from 'phaser';
import Enemy from '../Enemy';

const SPEED = 150;

export default class Necki extends Enemy {
	constructor(scene, x, y, name) {
		super(scene, x, y, name);

		this.anims.play('necki-walking');
		this.deathAnim = 'necki-death';
		this.deathScore = 200;
		this.speed = SPEED;
		this.body.width = this.width;
		this.body.height = this.height;
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (!this.body) return;
		if (this.frame.name.includes('death')) {
			this.body.setVelocityX(0);
		} else {
			if (this.body.blocked.left) {
				this.body.setVelocityX(this.speed);
				this.prevVelocityX = this.speed;
			} else if (this.body.blocked.right) {
				this.body.setVelocityX(-this.speed);
				this.prevVelocityX = -this.speed;
			} else {
				this.body.setVelocityX(this.prevVelocityX || this.speed);
			}
		}

		this.flipX = this.body.velocity.x > 0;
	}
}