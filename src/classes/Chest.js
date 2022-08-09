import * as Phaser from 'phaser';
import Item from './Item';

export default class Chest extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'chest');

		this.setOrigin(1, 1);
		this.deathScore = 50;
		scene.add.existing(this);
		scene.physics.add.existing(this);
	}

	destroy() {
		const itemNames = ['subi', 'steely', 'dew'];
		const randomName = Math.floor(Math.random()*itemNames.length);
		const item = new Item(this.scene, this.x, this.y-50, randomName); // Spawn it slightly above so it drops
		this.scene.items.add(item);

		super.destroy();
	}
}