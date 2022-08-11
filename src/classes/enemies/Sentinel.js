import * as Phaser from 'phaser';
import Enemy from '../Enemy';
import Beam from '../Beam';

export default class Sentinel extends Enemy {
	constructor(scene, x, y) {
		super(scene, x, y);

		this.anims.play('sentinel-idle');
		this.deathScore = 300;
		this.body.width = this.width;
		this.body.height = this.height;
		this.y -= 10; // Make it float
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		const distance = Phaser.Math.Distance.Between(this.x, this.y, this.scene.player.x, this.scene.player.y);
		const numOfBeams = this.scene.beams.children.size;
		if (distance < 300 && numOfBeams === 0) {
			this.shootBeam(this.scene.player);
		}

		this.flipX = this.x - this.scene.player.x < 0;
	}

	shootBeam(target) {
		this.beam = new Beam(this.scene, this, target);
		this.scene.beams.add(this.beam);
		this.body.width = this.width;
		this.body.height = this.height;
	}
}