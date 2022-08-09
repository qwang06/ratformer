import * as Phaser from 'phaser';

/**
 * Lootable item that drops from enemies/chests
 */
export default class Item extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, item) {
		super(scene, x, y, 'items');

		scene.add.existing(this);
		scene.physics.add.existing(this);

		if (!item) {
			this.setFrame('subi');
			this.item = 'subi';
		} else {
			this.setFrame(item);
			this.item = item
		}
	}
}