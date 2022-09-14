import * as Phaser from 'phaser';

export default class Enemy extends Phaser.GameObjects.Sprite {
	constructor(scene, x, y, name) {
		super(scene, x, y, 'enemies');

		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.body.setCollideWorldBounds(true);
		this.name = name;
		this.displayName();
	}

	preUpdate(time, delta) {
		super.preUpdate(time, delta);
		if (this.nameText) {
			this.nameText.x = Math.floor(this.body?.x + this.body?.width / 2);
			this.nameText.y = Math.floor(this.body?.y - this.body?.height / 2);
		}
	}

	displayName() {
		if (!this.scene?.displayEnemyNames || !this.name) return;
		this.nameText = this.scene.add.bitmapText(this.body?.x, this.body?.y + 10, 'arcade', this.name);
		this.nameText
			.setOrigin(0.5, 0)
			.setScale(0.33)
		;
	}
}