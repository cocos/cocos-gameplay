import { _decorator, Component, ccenum, Vec3 } from 'cc';
const { ccclass, property, type } = _decorator;
import ObjectBounds from './object-bounds';

@ccclass("PoolableObject")
export default class PoolableObject extends ObjectBounds{
	@property
	lifeTime = 5;

	protected _liftTime: number = 10;

	public reuseCallback: Function | null = null;
	public spawnCompleteCallback: Function | null = null;

	start () {
		super.start();
		this._liftTime = this.lifeTime;
	}

	update (dt: number) {
		if (this.lifeTime > 0) {
			this._liftTime -= dt;
		} 

		if (this._liftTime <= 0) {
			this.node.active = false;
		}
	}

	onEnable () {
		this._liftTime = this.lifeTime;
		this.initialization();
	}

	onDisable () {
		if (this.reuseCallback) {
			this.node.removeFromParent();
			this.reuseCallback(this.node);
			this.reuseCallback = null;
		}
	}

	initialization () {
		// override by sub class
	}

	triggerOnSpawnComplete () {
		if (this.spawnCompleteCallback) {
			this.spawnCompleteCallback();
		}
	}
}