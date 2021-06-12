import { _decorator, Node, Vec3, geometry, director, PhysicsSystem, ColliderComponent } from 'cc';
const { ccclass, property } = _decorator;
import { RotationModes, CharacterOrientation } from '../character-abilities/character-orientation';
import CharacterMovement from '../character-abilities/character-movement';
import LevelManager from '../manager/level-manager';
import CharacterAbility from './character-ability';
import CharacterInventory from './character-inventory';
import { CharacterAbilityPriority, ColliderGroup, WeaponType } from '../scene/define';
import CharacterHandleWeapon from './character-handle-weapon';
import { StateEvent, StateEventType } from '../util/state-machine';
import { CharacterConditions } from '../core/character-states';
import { PathPoint } from '../util/path-point';
import { GameManager } from '../manager/game-manager';
import MathUtil from '../util/math-util';

let _tempVec3 = new Vec3;
let _tempVec3_2 = new Vec3;
let _tempNearPoints: Node[] = [];

@ccclass('CharacterAI')
export default class CharacterAI extends CharacterAbility {

	@property
	attackDistance = 1;

	@property({type: WeaponType})
	weaponType: WeaponType = WeaponType.None;

	@property
	findYawRotateSpeed = 500;

	@property
	pathYawRotateSpeed = 20;

	public priority: CharacterAbilityPriority = CharacterAbilityPriority.AI;

	protected _characterOrientation: CharacterOrientation | null = null;
	protected _characterMovement: CharacterMovement | null = null;
	protected _characterInventory: CharacterInventory | null = null;
	protected _characterHandleWeapon: CharacterHandleWeapon | null = null;
	protected _path: PathPoint[] | null = null;
	protected _pathIndex = 0;
	protected _currentTargetPosition: Vec3 = new Vec3;
	protected _endPoint: Node | null = null;
	protected _collider: ColliderComponent | null = null;
    protected _ray: geometry.Ray = new geometry.Ray;

	initialization () {
		super.initialization();

		this._characterOrientation = this.getComponent(CharacterOrientation);
		if (this._characterOrientation) {
			this._characterOrientation.rotationMode = RotationModes.FollowWeapon;
		}

		this._characterMovement = this.getComponent(CharacterMovement);
		this._characterInventory = this.getComponent(CharacterInventory);
		this._characterHandleWeapon = this.getComponent(CharacterHandleWeapon);
		this._collider = this.getComponent(ColliderComponent);

		let self = this;
		this._conditionState!.on(StateEventType.StateChange, function (stateEvent: StateEvent<CharacterConditions>) {
			let newState = stateEvent.newState;
            if (newState == CharacterConditions.Damage || newState == CharacterConditions.Dead) {
				self.stopWalk();
            }
        });
	}

	earlyProcessAbility () {
		super.earlyProcessAbility();

		if (!this._characterOrientation || !this._characterMovement) return;

		if (!this.isNormal()) {
			this.stopWalk();
			return;
		}

		let playCharacter = LevelManager.instance.currentCharacter;
		if (!playCharacter) {
			this.stopWalk();
			return;
		}

		let playerUpNode = playCharacter.upNode!;
		let upNode = this._character!.upNode!;
		upNode.getWorldPosition(_tempVec3);
		playerUpNode.getWorldPosition(_tempVec3_2);

		Vec3.subtract(_tempVec3_2, _tempVec3_2, _tempVec3);
		_tempVec3_2.normalize();

		geometry.Ray.set(this._ray, 
			_tempVec3.x, _tempVec3.y, _tempVec3.z,
			_tempVec3_2.x, _tempVec3_2.y, _tempVec3_2.z);

		let hasHit = PhysicsSystem.instance.raycastClosest(this._ray, ColliderGroup.AIAim);
		let findTarget = false;
		let hitResult = PhysicsSystem.instance.raycastClosestResult;
		
		if (hasHit && hitResult.collider.getGroup() == ColliderGroup.Player) {
			findTarget = true;
			
			GameManager.instance.updateTarget(upNode, hitResult.distance, this._collider?.worldBounds);
			
			// ai attack player
			if (hitResult.distance < this.attackDistance) {
				this._characterOrientation.yawRotateSpeed = this.findYawRotateSpeed;
				this._characterMovement.setMovementDirection(0, 0, 0);
				if (this._characterInventory) this._characterInventory.switchToWeapon(this.weaponType);
				if (this._characterHandleWeapon) {
					this._characterHandleWeapon.currentTarget = playerUpNode;
				}
				return;	
			}
		}

		if (findTarget) {
			// find player and walk forward to player
			this.clearPath();
			this._characterOrientation.yawRotateSpeed = this.findYawRotateSpeed;
			this.walkTo(hitResult.hitPoint);

		} else {

			// have not find player and walk to find player
			let keepWalk = false;

			// has find rote and keep walk follow the road
			if (this._endPoint) {
				keepWalk = playCharacter.isNearPoint(this._endPoint);
			}
			
			// rode was empty and find road
			if (!keepWalk) {
				this._endPoint = playCharacter.getRandomNearPoint();
				if (!this._endPoint) {
					this.clearPath();
					this.stopWalk();
					return;
				}

				GameManager.instance.getFieldViewPoint(upNode, _tempNearPoints);

				// debug near path points
				GameManager.instance.drawLines(upNode, _tempNearPoints);

				let pathInfo = GameManager.instance.getShortPath(_tempNearPoints, this._endPoint);

				if (!pathInfo || !pathInfo.path) {
					this.clearPath();
					this.stopWalk();
					return;
				}

				this._path = pathInfo.path;
				let beginPoint = pathInfo.begin;
				beginPoint?.getRandomPosition(this._currentTargetPosition);
				this._pathIndex = -1;
			}

			if (!this._path) {
				this.clearPath();
				this.stopWalk();
				return;
			}

			this.node.getWorldPosition(_tempVec3);
			let distance = MathUtil.hDistance(_tempVec3, this._currentTargetPosition);
			if (Math.abs(distance) <= this._characterMovement.sensitivity) {
				this._pathIndex++;
				if (this._pathIndex >= this._path.length) {
					this.clearPath();
					this.stopWalk();
					return;
				}
				this._path![this._pathIndex]?.getRandomPosition(this._currentTargetPosition);
			}

			this._characterOrientation.yawRotateSpeed = this.pathYawRotateSpeed;
			this.walkTo(this._currentTargetPosition);
		}
	}

	clearPath () {
		this._endPoint = null;
		this._path = null;
		this._pathIndex = -1;
	}

	stopWalk () {
		this._characterMovement!.setMovementDirection(0, 0, 0);
		if (this._characterInventory) this._characterInventory.switchToWeapon(WeaponType.None);
		if (this._characterHandleWeapon) {
			this._characterHandleWeapon.currentTarget = null;
		}
	}

	walkTo (targetPosition: Vec3) {
		this._characterOrientation!.setTargetByPos(targetPosition);
		let dir = this._characterOrientation!.getCurrentForward();
		this._characterMovement!.setMovementDirection(dir.x, dir.y, dir.z);
		if (this._characterInventory) this._characterInventory.switchToWeapon(WeaponType.None);
		if (this._characterHandleWeapon) {
			this._characterHandleWeapon.currentTarget = null;
		}
	}
}