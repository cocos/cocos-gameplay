import { AnimationClip, AnimationState, _decorator } from 'cc';
import { CharacterAnimator } from '../core/character-animator';
import { BodyStateType, WeaponType } from './define';
const { ccclass, property } = _decorator;

@ccclass('ZombieAnimator')
export class ZombieAnimator extends CharacterAnimator {
    @property({type: AnimationClip})
	idleWholeAnimationClip: AnimationClip | null = null;

	@property({type: AnimationClip})
	slowForwardWholeAnimationClip: AnimationClip | null = null;

    @property({type: AnimationClip})
	idleLowerAnimationClip: AnimationClip | null = null;

	@property({type: AnimationClip})
	slowForwardLowerAnimationClip: AnimationClip | null = null;

    @property({type: AnimationClip})
	damageAnimationClip: AnimationClip | null = null;

	@property({type: AnimationClip})
	deadAnimationClip: AnimationClip | null = null;

	@property({type: AnimationClip})
	bornAnimationClip: AnimationClip | null = null;

    @property({type: AnimationClip})
    shoot_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    idle_Stand: AnimationClip | null = null;

    protected _shootStand: AnimationState | null = null;
    protected _idleStand: AnimationState | null = null;

    initialization () {
        super.initialization();

		// lower body state
		this._idleState = this.createBodyState(this.idleLowerAnimationClip, this._excludeBones, BodyStateType.Idle);
		this._forwardState = this.createBodyState(this.slowForwardLowerAnimationClip, this._excludeBones, BodyStateType.Forward);

		// damage state
		this._damageState = this.createBodyState(this.damageAnimationClip, undefined, BodyStateType.Damage);
		this._deadState = this.createBodyState(this.deadAnimationClip, undefined, BodyStateType.Dead);

		// born state
		this._bornState = this.createBodyState(this.bornAnimationClip, undefined, BodyStateType.Born);

        this._shootStand = this.createUpBodyState(this.shoot_Stand, this._includeBones);
        this._idleStand = this.createUpBodyState(this.idle_Stand, this._includeBones);
    }

    getWeaponShootState () {
		switch (this._currentWeaponType) {
            case WeaponType.Bat:
                return this._shootStand;
            default:
                return null;
        }
	}

	getWeaponIdleState () {
		switch (this._currentWeaponType) {
            case WeaponType.Bat:
                return this._idleStand;
            default:
                return null;
        }
	}
}