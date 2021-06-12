import { _decorator, AnimationClip, AnimationState } from 'cc';
import { CharacterAnimator } from '../core/character-animator';
import { CharacterMovementStates } from '../core/character-states';
import { WeaponType } from '../scene/define';
const { ccclass, property } = _decorator;

@ccclass('HeroAnimator')
export class HeroAnimator extends CharacterAnimator {
    @property({type: AnimationClip})
    assaultRifleShoot_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    assaultRifleShoot_Move: AnimationClip | null = null;

    @property({type: AnimationClip})
    assaultRifleIdle_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    assaultRifleIdle_Move: AnimationClip | null = null;
    
    @property({type: AnimationClip})
    assaultRifleReload: AnimationClip | null = null;

    @property({type: AnimationClip})
    pistolShoot_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    pistolShoot_Move: AnimationClip | null = null;

    @property({type: AnimationClip})
    pistolIdle_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    pistolIdle_Move: AnimationClip | null = null;
    
    @property({type: AnimationClip})
    pistolReload: AnimationClip | null = null;

    @property({type: AnimationClip})
    swordShoot_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    swordShoot_Move: AnimationClip | null = null;

    @property({type: AnimationClip})
    swordIdle_Stand: AnimationClip | null = null;

    @property({type: AnimationClip})
    swordIdle_Move: AnimationClip | null = null;
    
    @property({type: AnimationClip})
    swordReload: AnimationClip | null = null;

    // weapon upper body state
    protected _assaultRifleShoot_Stand: AnimationState | null = null;
    protected _assaultRifleShoot_Move: AnimationState | null = null;
    protected _assaultRifleIdle_Stand: AnimationState | null = null;
    protected _assaultRifleIdle_Move: AnimationState | null = null;
    protected _assaultRifleReload: AnimationState | null = null;

    protected _pistolShoot_Stand: AnimationState | null = null;
    protected _pistolShoot_Move: AnimationState | null = null;
    protected _pistolIdle_Stand: AnimationState | null = null;
    protected _pistolIdle_Move: AnimationState | null = null;
    protected _pistolReload: AnimationState | null = null;

    protected _swordShoot_Stand: AnimationState | null = null;
    protected _swordShoot_Move: AnimationState | null = null;
    protected _swordIdle_Stand: AnimationState | null = null;
    protected _swordIdle_Move: AnimationState | null = null;
    protected _swordReload: AnimationState | null = null;

    initialization () {
        super.initialization();
        
        this._assaultRifleShoot_Stand = this.createUpBodyState(this.assaultRifleShoot_Stand, this._includeBones);
        this._assaultRifleIdle_Stand = this.createUpBodyState(this.assaultRifleIdle_Stand, this._includeBones);
        this._assaultRifleShoot_Move = this.createUpBodyState(this.assaultRifleShoot_Move, this._includeBones);
        this._assaultRifleIdle_Move = this.createUpBodyState(this.assaultRifleIdle_Move, this._includeBones);
        this._assaultRifleReload = this.createUpBodyState(this.assaultRifleReload, this._includeBones);

        this._pistolShoot_Stand = this.createUpBodyState(this.pistolShoot_Stand, this._includeBones);
        this._pistolIdle_Stand = this.createUpBodyState(this.pistolIdle_Stand, this._includeBones);
        this._pistolShoot_Move = this.createUpBodyState(this.pistolShoot_Move, this._includeBones);
        this._pistolIdle_Move = this.createUpBodyState(this.pistolIdle_Move, this._includeBones);
        this._pistolReload = this.createUpBodyState(this.pistolReload, this._includeBones);

        this._swordShoot_Stand = this.createUpBodyState(this.swordShoot_Stand, this._includeBones);
        this._swordIdle_Stand = this.createUpBodyState(this.swordIdle_Stand, this._includeBones);
        this._swordShoot_Move = this.createUpBodyState(this.swordShoot_Move, this._includeBones);
        this._swordIdle_Move = this.createUpBodyState(this.swordIdle_Move, this._includeBones);
        this._swordReload = this.createUpBodyState(this.swordReload, this._includeBones);
    }

    getWeaponShootState () {
        let isWalking = this._currentMovementState == CharacterMovementStates.Walking;
		switch (this._currentWeaponType) {
            case WeaponType.Pistol:
                if (isWalking) {
                    return this._pistolShoot_Move;
                } else {
                    return this._pistolShoot_Stand;
                }
            case WeaponType.AssaultRifle:
                if (isWalking) {
                    return this._assaultRifleShoot_Move;
                } else {
                    return this._assaultRifleShoot_Stand;
                }
            case WeaponType.Sword:
                if (isWalking) {
                    return this._swordShoot_Move;
                } else {
                    return this._swordShoot_Stand;
                }
            default:
                return null;
        }
	}

	getWeaponIdleState () {
        let isWalking = this._currentMovementState == CharacterMovementStates.Walking;
		switch (this._currentWeaponType) {
            case WeaponType.Pistol:
                if (isWalking) {
                    return this._pistolIdle_Move;
                } else {
                    return this._pistolIdle_Stand;
                }
            case WeaponType.AssaultRifle:
                if (isWalking) {
                    return this._assaultRifleIdle_Move;
                } else {
                    return this._assaultRifleIdle_Stand;
                }
            case WeaponType.Sword:
                if (isWalking) {
                    return this._swordIdle_Move;
                } else {
                    return this._swordIdle_Stand;
                }
            default:
                return null;
        }
	}

    getWeaponReloadState () {
        switch (this._currentWeaponType) {
            case WeaponType.Pistol:
                return this._pistolReload;
            case WeaponType.AssaultRifle:
                return this._assaultRifleReload;
            default:
                return null;
        }
    }
}