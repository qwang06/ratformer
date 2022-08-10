import * as Phaser from 'phaser';
import Item from './Item';

export default class Chest extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'chest');

		this.setOrigin(1, 1);
		this.deathScore = 50;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		const itemFrames = Object.keys(this.scene.textures.get('items').frames);
		const itemNames = itemFrames.filter(item => !item.includes('_')); // `_` incdicates it's an animation
		this.itemName = itemNames[Math.floor(Math.random()*itemNames.length)]; // Choose randomly
	}

	destroy() {
		const item = new Item(this.scene, this.x, this.y-50, this.itemName); // Spawn it slightly above so it drops
		this.scene.items.add(item);

		super.destroy();
	}
}