import { _decorator, Vec3, director, Quat, Node, RigidBody } from 'cc';
const { ccclass, property, type } = _decorator;
import PoolableObject from './poolable-object'
import  { Weapon } from './weapon'

let _tempVec3: Vec3 = new Vec3;

@ccclass("Projectile")
export default class Projectile extends PoolableObject {
	/// the speed of the object (relative to the level's speed)
	@property({tooltip: "the init speed of the object (relative to the level's speed)"})
	public initSpeed = 150;
	/// the acceleration of the object over time. Starts accelerating on enable.
	@property({tooltip: "the acceleration of the object over time. Starts accelerating on enable."})
	public acceleration = 100;

    protected _rotation: Quat = new Quat;
    set rotation (value: Quat) {
        Quat.copy(this._rotation, value);
        if (this.node) {
            this.node.setWorldRotation(this._rotation);
        }
    }

    protected _direction: Vec3 = new Vec3;
    set direction (value: Vec3) {
        Vec3.copy(this._direction, value);
    }

	protected _weapon: Weapon | null = null;
	protected _owner: Node | null = null;
	protected _movement: Vec3 = new Vec3;
    protected _speed = 0;
    protected _rigidBody: RigidBody | null = null;

    start () {
    	super.start();
        this._rigidBody = this.getComponent(RigidBody);
    }

    initialization () {
        super.initialization();
        this.node.setWorldRotation(this._rotation);
        this._speed = this.initSpeed;
        if (this._rigidBody) {
            this._rigidBody.setLinearVelocity(Vec3.ZERO);
        }
    }

    update (dt: number) {
        super.update(dt);
    	this.movement();
    }

    setWeapon (newWeapon: Weapon) {
    	this._weapon = newWeapon;
    }

    setOwner (newOwner: Node) {
    	this._owner = newOwner;
    }

    movement () {
        if (this.initSpeed == 0 && this.acceleration == 0) return;

    	let dt = director.getDeltaTime();
    	let scale = this._speed * dt;
        this._speed += this.acceleration * dt;
    	Vec3.multiplyScalar(this._movement, this._direction, scale);

        // change position directly
    	// this.node.getPosition(_tempVec3);
    	// _tempVec3.add(this._movement);
    	// this.node.setPosition(_tempVec3);

    	// move by physics engine
        if (this._rigidBody) {
            this._rigidBody.setLinearVelocity(this._movement);
        }
    }
}