import * as Phaser from 'phaser';
import Item from './Item';

export default class Chest extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'chest');

		this.setOrigin(0.5, 1);
		this.deathScore = 50;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		const itemFrames = Object.keys(this.scene.textures.get('items').frames);
		const itemNames = itemFrames.filter(item => !item.includes('_')); // `_` incdicates it's an animation
		const rnd = new Phaser.Math.RandomDataGenerator();
		this.itemName = itemNames[rnd.integerInRange(0, itemNames.length-1)]; // Choose randomly
	}

	destroy() {
		if (this.scene) {
			this.scene.items.add(new Item(this.scene, this.x, this.y-50, this.itemName));
		}
		super.destroy();
	}
}