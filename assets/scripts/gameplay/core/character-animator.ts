import { _decorator, Component, Animation, AnimationState, Vec3, AnimationClip, Node, Quat, lerp, log, director } from 'cc';
import "./animation-extension";
import { ControlType } from '../scene/define';
import { WeaponStates } from '../weapons/weapon';
import { CharacterAnimatorBase } from './character-animator-base';
import MathUtil from '../util/math-util';
import { CharacterConditions, CharacterMovementStates } from './character-states';
const { ccclass, property, type } = _decorator;

let _tempVec3 = new Vec3;
let _tempQuat = new Quat;
let _tempQuat2 = new Quat;
let _forwardDeg = 0;
let _backwardDeg = 180;
let _leftDeg = 90;
let _rightDeg = -90;

function CalcMoveWeight (localMoveAngle: number, originMoveAngle: number) {
	let diff = Math.abs(localMoveAngle - originMoveAngle)
	if (diff >= 90) return 0;
	return 1.0 - diff / 90;
}

@ccclass('CharacterAnimator')
export class CharacterAnimator extends CharacterAnimatorBase {

	@property({type: Node})
	rootBone: Node | null = null;

	@property({type: Node})
	upperBodyBone: Node | null = null;

	@property
	fadeDuration = 0.3;

	@property
	lowerBodySyncAngle = 80;

	@property({type: [Node]})
	upperIncludeBones: Node[] = [];

	@property
	controlSplitBodyRotate = true;

	@property
	splitBodyRotate = true;

	// current body state
	protected _idleState: AnimationState | null = null;
	protected _forwardState: AnimationState | null = null;
	protected _backwardState: AnimationState | null = null;
	protected _leftState: AnimationState | null = null;
	protected _rightState: AnimationState | null = null;

	protected _jumpBeginState: AnimationState | null = null;
	protected _jumpEndState: AnimationState | null = null;
	protected _jumpLoopState: AnimationState | null = null;

	// pre body state
	protected _preIdleState: AnimationState | null = null;
	protected _preForwardState: AnimationState | null = null;
	protected _preBackwardState: AnimationState | null = null;
	protected _preLeftState: AnimationState | null = null;
	protected _preRightState: AnimationState | null = null;

	protected _preJumpBeginState: AnimationState | null = null;
	protected _preJumpEndState: AnimationState | null = null;
	protected _preJumpLoopState: AnimationState | null = null;

	// current body state
	protected _preBodyState: AnimationState | null = null;
	protected _currentBodyState: AnimationState | null = null;

	// current up body state
	protected _preUpBodyState: AnimationState | null = null;
    protected _currentUpBodyState: AnimationState | null = null;

	protected _bestMoveState: AnimationState | null = null;
	protected _bestTargetWeight: number = 0;

	// damage state
	protected _damageState: AnimationState | null = null;
	protected _deadState: AnimationState | null = null;

	// born state
	protected _bornState: AnimationState | null = null;

	protected _lowerBodyTargetAngle = 0;
	protected _lowerBodyAngle = 0;
	protected _excludeBones: string[] | undefined;
	protected _includeBones: string[] | undefined;

	initialization () {
        if (this.upperIncludeBones.length > 0) {
            this._excludeBones = [];
			this._includeBones = [];
			for (let i = 0, c = this.upperIncludeBones.length; i < c; i++) {
				let nodeName = this.upperIncludeBones[i].name;
				this._excludeBones.push(nodeName);
            	this._includeBones.push(nodeName);
			}
		}
	}

	checkBestMoveState (localMoveAngle: number, originDeg: number, state: AnimationState | null) {
		let targetWeight = CalcMoveWeight(localMoveAngle, originDeg);
		if (this._bestTargetWeight < targetWeight && state) {
			this._bestTargetWeight = targetWeight;
			this._bestMoveState = state;
		}
	}

	updateBodyState () {
		return false;
	}

	clearBodyState () {
		this._idleState  		 =	null;
		this._forwardState    	 =	null;
		this._backwardState   	 =	null;
		this._leftState       	 =	null;
		this._rightState      	 =	null;
		this._jumpBeginState 	 =	null;
		this._jumpLoopState 	 =	null;
		this._jumpEndState 	 	 =	null;
	}
	
	updateAnimation () {
		let upBodyChange = this._preUpBodyState != this._currentUpBodyState;
		let bodyChange = this._preBodyState != this._currentBodyState;
		if (!upBodyChange && !bodyChange) return;

		let duration = this.fadeDuration;
		let useMask = !!this._currentUpBodyState;
		if (!bodyChange || (!this._preUpBodyState && !this._preBodyState)) {
			duration = 0;
		}

		if (this._currentBodyState) {
			(this._currentBodyState as any).useMask(useMask);	
		}

		let bodyStateType = (this._currentBodyState as any)?.bodyStateType;
		let preBodyStateType = (this._preBodyState as any)?.bodyStateType;
		
		if (bodyChange) {
			if (this._currentBodyState) {
				if (bodyStateType == preBodyStateType) {
					let currentWeight = (this.animation! as any).getTotalWeight(this._bodyStateLayer, [this._currentBodyState.name, this._preBodyState?.name]);
					(this._currentBodyState as any).swap(this._preBodyState, 1 - currentWeight);
				} else {
					this.animation!.crossFade(this._currentBodyState.name, duration);
				}
			} else if (this._preBodyState) {
				(this._preBodyState as any).setWeightTarget(0, duration);
			}
		}

		if (upBodyChange) {
			if (this._currentUpBodyState) {
				this.animation!.crossFade(this._currentUpBodyState.name, duration);
			} else if (this._preUpBodyState) {
				(this._preUpBodyState as any).setWeightTarget(0, duration);
			}
		}
	}

	process (dt: number) {
		this.updateUpBodyState();
		this.updateBodyState();

		switch (this._currentConditionState) {
			case CharacterConditions.Normal:

				switch (this._currentMovementState) {
					case CharacterMovementStates.Walking:
						
						this._bestMoveState = null;
						this._bestTargetWeight = -1;
						// Calculate the most suitable direction animation.
						this.checkBestMoveState(this.localMoveAngle, _forwardDeg,  this._forwardState);
						this.checkBestMoveState(Math.abs(this.localMoveAngle), _backwardDeg,  this._backwardState);
						this.checkBestMoveState(this.localMoveAngle, _leftDeg,  this._leftState);
						this.checkBestMoveState(this.localMoveAngle, _rightDeg,  this._rightState);

						if (this._bestMoveState) {
							this._currentBodyState = this._bestMoveState;
						}

						break;
					case CharacterMovementStates.JumpBegin:
						if (this._jumpBeginState) {
							this._currentBodyState = this._jumpBeginState;
							this._movementStateMachine!.setStateTime(CharacterMovementStates.JumpBegin, this._jumpBeginState.duration);
						} else {
							this._movementStateMachine!.setStateTime(CharacterMovementStates.JumpBegin, 0);
						}
						break;
					case CharacterMovementStates.JumpEnd:
						if (this._jumpEndState) {
							this._currentBodyState = this._jumpEndState;
							this._movementStateMachine!.setStateTime(CharacterMovementStates.JumpEnd, this._jumpEndState.duration);
						} else {
							this._movementStateMachine!.setStateTime(CharacterMovementStates.JumpEnd, 0);
						}
						break;
					case CharacterMovementStates.JumpLoop:
						if (this._jumpLoopState) {
							this._currentBodyState = this._jumpLoopState;
						}
						break;
					case CharacterMovementStates.Idle:
						if (this._idleState) {
							this._currentBodyState = this._idleState;
						}
						break;
				}

				break;
			case CharacterConditions.Dead:

				if (this._deadState) {
					this._currentBodyState = this._deadState;
					this._conditionStateMachine!.setStateTime(CharacterConditions.Dead, this._deadState.duration);
				} else {
					this._conditionStateMachine!.setStateTime(CharacterConditions.Dead, 0);
				}

				break;
			case CharacterConditions.Damage:

				if (this._damageState) {
					this._currentBodyState = this._damageState;
					this._conditionStateMachine!.setStateTime(CharacterConditions.Damage, this._damageState.duration);
				} else {
					this._conditionStateMachine!.setStateTime(CharacterConditions.Damage, 0);
				}

				break;

			case CharacterConditions.Born:

				if (this._bornState) {
					this._currentBodyState = this._bornState;
					this._conditionStateMachine!.setStateTime(CharacterConditions.Born, this._bornState.duration);
				} else {
					this._conditionStateMachine!.setStateTime(CharacterConditions.Born, 0);
				}

				break;
		}

		this.updateAnimation();
		this.updateSplitBodyRotate();

		this._preUpBodyState = this._currentUpBodyState;
		this._preWeaponState = this._currentWeaponState;
		this._preWeaponType = this._currentWeaponType;
		this._preMovementState = this._currentMovementState;
		this._preConditionState = this._currentConditionState;
		this._preControlType = this._currentControlType;
		this._prePoseType = this._currentPoseType;
		this._preBodyState = this._currentBodyState;
	}

	lateProcess (dt: number) {
		let deltaAngle = -this.localAngle + this._lowerBodyAngle;

		if (this.speed > 0 || !this.splitBodyRotate) {
			deltaAngle = 0;
			this._lowerBodyAngle = this.localAngle;
			this._lowerBodyTargetAngle = this.localAngle;
		} else {
			let rotateAngle = this._lowerBodyTargetAngle - this._lowerBodyAngle;
			let absRotateAngle = Math.abs(rotateAngle);
			let rotateSpeed = this.yawRotateSpeed * dt;
			if (rotateSpeed > absRotateAngle) {
				rotateSpeed = absRotateAngle;
			}

			if (rotateAngle > 0) {
				this._lowerBodyAngle += rotateSpeed;
			} else if (rotateAngle < 0) {
				this._lowerBodyAngle -= rotateSpeed;
			}

			if (Math.abs(deltaAngle) > this.lowerBodySyncAngle) {
				this._lowerBodyTargetAngle = this.localAngle;
			}
		}

		if (this.rootBone) {
			this.rootBone.getParent()?.getWorldScale(_tempVec3);
			let sign = Math.sign(_tempVec3.x);

			MathUtil.directionToNodeSpace(_tempVec3, this.currentUp, this.rootBone);
			Vec3.multiplyScalar(_tempVec3, _tempVec3, sign * deltaAngle);
			
        	Quat.fromEuler (_tempQuat2, _tempVec3.x, _tempVec3.y, _tempVec3.z);
			this.rootBone.setRotation(_tempQuat2);
		}

		if (this.upperBodyBone) {
			this.upperBodyBone.getParent()?.getWorldScale(_tempVec3);
			let sign = Math.sign(_tempVec3.x);

			MathUtil.directionToNodeSpace(_tempVec3, this.currentUp, this.upperBodyBone);
			Vec3.multiplyScalar(_tempVec3, _tempVec3, -1 * sign * deltaAngle);
        	Quat.fromEuler (_tempQuat2, _tempVec3.x, _tempVec3.y, _tempVec3.z);
			this.upperBodyBone.getRotation(_tempQuat);
			Quat.multiply(_tempQuat2, _tempQuat, _tempQuat2);
			this.upperBodyBone.setRotation(_tempQuat2);
		}
	}

	updateSplitBodyRotate () {
		if (!this.controlSplitBodyRotate) return;

		// let shooting = this._currentWeaponState == WeaponStates.WeaponDelayBetweenUses || this._currentWeaponState == WeaponStates.WeaponUse;
		switch (this._currentControlType) {
            case ControlType.TopDown:
                this.splitBodyRotate = false;
            break;
            case ControlType.ShoulderSurfing:
            case ControlType.FirstPerson:
                this.splitBodyRotate = false;
                break;
            case ControlType.ThirdPerson:
				this.splitBodyRotate = false;
                break;
        }
	}

	getWeaponShootState (): AnimationState | null {
		return null;
	}

	getWeaponIdleState (): AnimationState | null {
		return null;
	}

	getWeaponReloadState (): AnimationState | null {
		return null;
	}

    updateUpBodyState () {
		let sameWeapon = this._currentWeaponType == this._preWeaponType;
		let sameWeaponState = this._currentWeaponState == this._preWeaponState;
		let sameMovementState = this._currentMovementState == this._preMovementState;
		if (sameWeapon && sameWeaponState && sameMovementState) {
			return;
		}

        switch (this._currentWeaponState) {
            case WeaponStates.WeaponReload:
				this._currentUpBodyState = this.getWeaponReloadState();
				break;
			case WeaponStates.WeaponDelayBetweenUses:
			case WeaponStates.WeaponDelayBeforeUse:
            case WeaponStates.WeaponUse:
				this._currentUpBodyState = this.getWeaponShootState();
				break;
			case WeaponStates.WeaponInterrupted:
				this._currentUpBodyState = null;
				break;
			default:
				this._currentUpBodyState = this.getWeaponIdleState();
				break;
        }
    }
}