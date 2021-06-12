import { _decorator, Mat4, Node, Vec3, Quat, error } from 'cc';
import  { Weapon } from './weapon';
import ObjectPooler from './object-pooler';
import Projectile from './projectile';
import MathUtil from '../util/math-util';
import PoolableObject from './poolable-object';
const { ccclass, property, type } = _decorator;

let _tempRot: Quat = new Quat();
let _tempVec3: Vec3 = new Vec3();
let _forward: Vec3 = new Vec3(0, 0, 1);

@ccclass('ProjectileWeapon')
export default class ProjectileWeapon extends Weapon {
	@property({type: Node})
	spawnAttachment: Node | null = null;

	@property({tooltip: 'the number of projectiles to spawn per shot'})
	projectilesPerShot = 1;

	@property({tooltip: 'the spread (in degrees) to apply randomly (or not) on each angle when spawning a projectile'})
	@type(Vec3)
	spread: Vec3 = new Vec3;

	@property({tooltip: "whether or not the spread should be random [if not it'll be equally distributed]"})
	randomSpread: boolean = true;

	/// the projectile's spawn position
	public spawnPosition: Vec3 = new Vec3;
	public objectPooler: ObjectPooler | null = null;
	protected _randomSpreadDirection: Vec3 = new Vec3;
	protected _worldDirection: Vec3 = new Vec3;
	get worldDirection () {
		return this._worldDirection;
	}
	
	protected _worldRotation: Quat = new Quat;
	protected _worldSpawnPosition: Vec3 = new Vec3;
	protected _directionPoint: Node | null | undefined = null;
	
	initialization () {
		super.initialization();

		this._directionPoint = this.rotatingModel?.getChildByName("DirectionPoint");
		if (!this._directionPoint) {
			this._directionPoint = new Node("DirectionPoint");
			this._directionPoint.parent = this.rotatingModel;
		}
        this._directionPoint.setPosition(new Vec3(0, 0, 1));

		this.objectPooler = this.getComponent(ObjectPooler);
		if (!this.objectPooler) {
			error("ProjectileWeapon initialization ObjectPooler component is null");
			return;
		}
	}

	process (dt: number) {
		super.process(dt);

		let rotatingModel = this.getRotatingModel();
		if (this._directionPoint!.parent != rotatingModel) {
			this._directionPoint!.parent = rotatingModel;
		}

		this._directionPoint!.getWorldPosition(this._worldDirection);
		rotatingModel!.getWorldPosition(_tempVec3);
		Vec3.subtract(this._worldDirection, this._worldDirection, _tempVec3);
		this._worldDirection.normalize();
		Quat.rotationTo(this._worldRotation, _forward, this._worldDirection);

		if (this.spawnAttachment) {
			this.spawnAttachment.getWorldPosition(this._worldSpawnPosition);	
		} else {
			Vec3.zero(this._worldSpawnPosition);
		}
    }

	spawnProjectile(projectileIndex: number, totalProjectiles: number, triggerObjectActivation: boolean = true): Node | null {
		if (!this.objectPooler) {
			error("ProjectileWeapon spawnProjectile failure, this.objectPooler is null");
			return null;
		}
		let nextGameObject = this.objectPooler.getObject();
		if (!nextGameObject) {
			error("ProjectileWeapon spawnProjectile failure, this.objectPooler.getPooledGameObject return null");
			return null;
		}

		nextGameObject.setPosition(this._worldSpawnPosition);
		let projectile = nextGameObject.getComponent(Projectile);
		if (projectile) {
			projectile.setWeapon(this);
			if (this._owner) {
				projectile.setOwner(this._owner.node);
			}
		}

		if (projectile) {
            if (this.randomSpread) {
                this._randomSpreadDirection.x = (Math.random() - 0.5) * 2 * this.spread.x;
                this._randomSpreadDirection.y = (Math.random() - 0.5) * 2 * this.spread.y;
                this._randomSpreadDirection.z = (Math.random() - 0.5) * 2 * this.spread.z;
            } else {
                if (totalProjectiles > 1) {
                    this._randomSpreadDirection.x = MathUtil.remap(projectileIndex, 0, totalProjectiles - 1, -this.spread.x, this.spread.x);
                    this._randomSpreadDirection.y = MathUtil.remap(projectileIndex, 0, totalProjectiles - 1, -this.spread.y, this.spread.y);
                    this._randomSpreadDirection.z = MathUtil.remap(projectileIndex, 0, totalProjectiles - 1, -this.spread.z, this.spread.z);
                } else {
                	Vec3.copy(this._randomSpreadDirection, Vec3.ZERO);
                }
            }

            let dir = this._randomSpreadDirection;
            let spread = Quat.fromEuler(_tempRot, dir.x, dir.y ,dir.z);

        	Vec3.transformQuat(_tempVec3, this._worldDirection, spread);
			projectile.direction  = _tempVec3;
			projectile.rotation = this._worldRotation;
        }

        if (triggerObjectActivation) {
        	let poolableObject = nextGameObject.getComponent(PoolableObject);
            if (poolableObject != null) {
                poolableObject.triggerOnSpawnComplete();
            }
        }

		return nextGameObject;
	}

	weaponUse () {
		super.weaponUse();
		for (let i = 0; i < this.projectilesPerShot; i++) {
			this.spawnProjectile(i, this.projectilesPerShot, true);
		}
	}
}