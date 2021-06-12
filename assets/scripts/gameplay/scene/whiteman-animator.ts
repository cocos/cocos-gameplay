import { _decorator, AnimationClip, AnimationState } from 'cc';
import { CharacterAnimator } from '../core/character-animator';
import { CharacterMovementStates, CharacterPoseStates } from '../core/character-states';
import { BodyStateType, ControlType, WeaponType } from '../scene/define';
import { WeaponStates } from '../weapons/weapon';
import FadeHandle from './fade-handle';
const { ccclass, property } = _decorator;

@ccclass('WhiteManAnimator')
export class WhiteManAnimator extends CharacterAnimator {
    // shoot
    @property({type: AnimationClip})
    assaultRifleShoot_Addtive_Hip: AnimationClip | null = null;
    _assaultRifleShoot_Addtive_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleShoot_Additive_Sight: AnimationClip | null = null;
    _assaultRifleShoot_Additive_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleShoot_Hip: AnimationClip | null = null;
    _assaultRifleShoot_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleShoot_Sight: AnimationClip | null = null;
    _assaultRifleShoot_Sight: AnimationState | null = null;

    // idle
    @property({type: AnimationClip})
    assaultRifleIdle_Stand_Hip: AnimationClip | null = null;
    _assaultRifleIdle_Stand_Hip: AnimationState | null = null;
    _assaultRifleIdle_Jump_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleIdle_Stand_Sight: AnimationClip | null = null;
    _assaultRifleIdle_Stand_Sight: AnimationState | null = null;
    _assaultRifleIdle_Jump_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleIdle_Crouch_Hip: AnimationClip | null = null;
    _assaultRifleIdle_Crouch_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleIdle_Crouch_Sight: AnimationClip | null = null;
    _assaultRifleIdle_Crouch_Sight: AnimationState | null = null;

    // @property({type: AnimationClip})
    // assaultRifleIdle_Stand_Hip_Shoot: AnimationClip | null = null;
    // _assaultRifleIdle_Stand_Hip_Shoot: AnimationState | null = null;

    // reload
    @property({type: AnimationClip})
    assaultRifleReload_Hip: AnimationClip | null = null;
    _assaultRifleReload_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleReload_Sight: AnimationClip | null = null;
    _assaultRifleReload_Sight: AnimationState | null = null;

    // jog jump
    @property({type: AnimationClip})
    jumpBegin_Jog: AnimationClip | null = null;
    _jumpBegin_Jog: AnimationState | null = null;

    @property({type: AnimationClip})
    jumpEnd_Jog: AnimationClip | null = null;
    _jumpEnd_Jog: AnimationState | null = null;

    @property({type: AnimationClip})
    jumpLoop_Jog: AnimationClip | null = null;
    _jumpLoop_Jog: AnimationState | null = null;

    // sight jump
    @property({type: AnimationClip})
    jumpBegin_Sight: AnimationClip | null = null;
    _jumpBegin_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    jumpEnd_Sight: AnimationClip | null = null;
    _jumpEnd_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    jumpLoop_Sight: AnimationClip | null = null;
    _jumpLoop_Sight: AnimationState | null = null;

    // stand hip move
    @property({type: AnimationClip})
    assaultRifleMove_Stand_Forward_Hip: AnimationClip | null = null;
    _assaultRifleMove_Stand_Forward_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Backward_Hip: AnimationClip | null = null;
    _assaultRifleMove_Stand_Backward_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Left_Hip: AnimationClip | null = null;
    _assaultRifleMove_Stand_Left_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Right_Hip: AnimationClip | null = null;
    _assaultRifleMove_Stand_Right_Hip: AnimationState | null = null;

    // stand sight move
    @property({type: AnimationClip})
    assaultRifleMove_Stand_Forward_Sight: AnimationClip | null = null;
    _assaultRifleMove_Stand_Forward_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Backward_Sight: AnimationClip | null = null;
    _assaultRifleMove_Stand_Backward_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Left_Sight: AnimationClip | null = null;
    _assaultRifleMove_Stand_Left_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Stand_Right_Sight: AnimationClip | null = null;
    _assaultRifleMove_Stand_Right_Sight: AnimationState | null = null;

    // crouch hip move
    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Forward_Hip: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Forward_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Backward_Hip: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Backward_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Left_Hip: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Left_Hip: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Right_Hip: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Right_Hip: AnimationState | null = null;

    // crouch hip move
    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Forward_Sight: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Forward_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Backward_Sight: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Backward_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Left_Sight: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Left_Sight: AnimationState | null = null;

    @property({type: AnimationClip})
    assaultRifleMove_Crouch_Right_Sight: AnimationClip | null = null;
    _assaultRifleMove_Crouch_Right_Sight: AnimationState | null = null;

    // @property({type: AnimationClip})
    // assaultRifleMove_Stand_Forward_Hip_Shoot: AnimationClip | null = null;
    // _assaultRifleMove_Stand_Forward_Hip_Shoot: AnimationState | null = null;

    // @property({type: AnimationClip})
    // assaultRifleMove_Stand_Backward_Hip_Shoot: AnimationClip | null = null;
    // _assaultRifleMove_Stand_Backward_Hip_Shoot: AnimationState | null = null;

    // @property({type: AnimationClip})
    // assaultRifleMove_Stand_Left_Hip_Shoot: AnimationClip | null = null;
    // _assaultRifleMove_Stand_Left_Hip_Shoot: AnimationState | null = null;

    // @property({type: AnimationClip})
    // assaultRifleMove_Stand_Right_Hip_Shoot: AnimationClip | null = null;
    // _assaultRifleMove_Stand_Right_Hip_Shoot: AnimationState | null = null;

    // sprint
    @property({type: AnimationClip})
    assaultRifleSprint: AnimationClip | null = null;
    _assaultRifleSprint: AnimationState | null = null;

    // no weapon move
    @property({type: AnimationClip})
    noWeaponMove_Stand_Forward: AnimationClip | null = null;
    _noWeaponMove_Stand_Forward: AnimationState | null = null;

    // no weapon sprint
    @property({type: AnimationClip})
    noWeaponSprint: AnimationClip | null = null;
    _noWeaponSprint: AnimationState | null = null;

    // no weapon idle
    @property({type: AnimationClip})
    noWeaponIdle: AnimationClip | null = null;
    _noWeaponIdle: AnimationState | null = null;

    protected _hasShootMoveState = false;

    initialization () {
        super.initialization();
        
        // shoot additive
        this._assaultRifleShoot_Addtive_Hip = this.createUpBodyState(this.assaultRifleShoot_Addtive_Hip, this._includeBones);
        this._assaultRifleShoot_Additive_Sight = this.createUpBodyState(this.assaultRifleShoot_Additive_Sight, this._includeBones);

        // shoot no additive
        this._assaultRifleShoot_Hip = this.createUpBodyState(this.assaultRifleShoot_Hip, this._includeBones);
        this._assaultRifleShoot_Sight = this.createUpBodyState(this.assaultRifleShoot_Sight, this._includeBones);

        // reload
        this._assaultRifleReload_Hip = this.createUpBodyState(this.assaultRifleReload_Hip, this._includeBones);
        this._assaultRifleReload_Sight = this.createUpBodyState(this.assaultRifleReload_Sight, this._includeBones);

        // jump up body idle
        this._assaultRifleIdle_Jump_Hip = this.createUpBodyState(this.assaultRifleIdle_Stand_Hip, this._includeBones, "IdleJumpHip");
        this._assaultRifleIdle_Jump_Sight = this.createUpBodyState(this.assaultRifleIdle_Stand_Sight, this._includeBones, "IdleJumpSight");

        // jog jump
        this._jumpBegin_Jog = this.createBodyState(this.jumpBegin_Jog, this._excludeBones, BodyStateType.JumpBegin);
        this._jumpEnd_Jog = this.createBodyState(this.jumpEnd_Jog, this._excludeBones, BodyStateType.JumpEnd);
        this._jumpLoop_Jog = this.createBodyState(this.jumpLoop_Jog, this._excludeBones, BodyStateType.JumpLoop);
        if (this._jumpLoop_Jog) {
            (this._jumpLoop_Jog as any).pingpong = true;
        }

        // sight jump
        this._jumpBegin_Sight = this.createBodyState(this.jumpBegin_Sight, this._excludeBones, BodyStateType.JumpBegin);
        this._jumpEnd_Sight = this.createBodyState(this.jumpEnd_Sight, this._excludeBones, BodyStateType.JumpEnd);
        this._jumpLoop_Sight = this.createBodyState(this.jumpLoop_Sight, this._excludeBones, BodyStateType.JumpLoop);

        // idle
        this._assaultRifleIdle_Stand_Hip = this.createBodyState(this.assaultRifleIdle_Stand_Hip, this._excludeBones, BodyStateType.Idle);
        this._assaultRifleIdle_Stand_Sight = this.createBodyState(this.assaultRifleIdle_Stand_Sight, this._excludeBones, BodyStateType.Idle);
        this._assaultRifleIdle_Crouch_Hip = this.createBodyState(this.assaultRifleIdle_Crouch_Hip, this._excludeBones, BodyStateType.CrouchIdle);
        this._assaultRifleIdle_Crouch_Sight = this.createBodyState(this.assaultRifleIdle_Crouch_Sight, this._excludeBones, BodyStateType.CrouchIdle);
        // this._assaultRifleIdle_Stand_Hip_Shoot = this.createState(this.assaultRifleIdle_Stand_Hip_Shoot, undefined, this._excludeBones);

        // stand move hip
        this._assaultRifleMove_Stand_Forward_Hip = this.createBodyState(this.assaultRifleMove_Stand_Forward_Hip, this._excludeBones, BodyStateType.Forward);
        this._assaultRifleMove_Stand_Backward_Hip = this.createBodyState(this.assaultRifleMove_Stand_Backward_Hip, this._excludeBones, BodyStateType.Backward);
        this._assaultRifleMove_Stand_Left_Hip = this.createBodyState(this.assaultRifleMove_Stand_Left_Hip, this._excludeBones, BodyStateType.Left);
        this._assaultRifleMove_Stand_Right_Hip = this.createBodyState(this.assaultRifleMove_Stand_Right_Hip, this._excludeBones, BodyStateType.Right);

        // stand move sight
        this._assaultRifleMove_Stand_Forward_Sight = this.createBodyState(this.assaultRifleMove_Stand_Forward_Sight, this._excludeBones, BodyStateType.Forward);
        this._assaultRifleMove_Stand_Backward_Sight = this.createBodyState(this.assaultRifleMove_Stand_Backward_Sight, this._excludeBones, BodyStateType.Backward);
        this._assaultRifleMove_Stand_Left_Sight = this.createBodyState(this.assaultRifleMove_Stand_Left_Sight, this._excludeBones, BodyStateType.Left);
        this._assaultRifleMove_Stand_Right_Sight = this.createBodyState(this.assaultRifleMove_Stand_Right_Sight, this._excludeBones, BodyStateType.Right);

        // stand move hip shoot
        // this._assaultRifleMove_Stand_Forward_Hip_Shoot = this.createBodyState(this.assaultRifleMove_Stand_Forward_Hip_Shoot, this._excludeBones, BodyStateType.Forward);
        // this._assaultRifleMove_Stand_Backward_Hip_Shoot = this.createBodyState(this.assaultRifleMove_Stand_Backward_Hip_Shoot, this._excludeBones, BodyStateType.Backward);
        // this._assaultRifleMove_Stand_Left_Hip_Shoot = this.createBodyState(this.assaultRifleMove_Stand_Left_Hip_Shoot, this._excludeBones, BodyStateType.Left);
        // this._assaultRifleMove_Stand_Right_Hip_Shoot = this.createBodyState(this.assaultRifleMove_Stand_Right_Hip_Shoot, this._excludeBones, BodyStateType.Right);
        // this._hasShootMoveState = !!this._assaultRifleMove_Stand_Forward_Hip_Shoot;
        
        // crouch move hip
        this._assaultRifleMove_Crouch_Forward_Hip = this.createBodyState(this.assaultRifleMove_Crouch_Forward_Hip, this._excludeBones, BodyStateType.CrouchForward);
        this._assaultRifleMove_Crouch_Backward_Hip = this.createBodyState(this.assaultRifleMove_Crouch_Backward_Hip, this._excludeBones, BodyStateType.CrouchBackward);
        this._assaultRifleMove_Crouch_Left_Hip = this.createBodyState(this.assaultRifleMove_Crouch_Left_Hip, this._excludeBones, BodyStateType.CrouchLeft);
        this._assaultRifleMove_Crouch_Right_Hip = this.createBodyState(this.assaultRifleMove_Crouch_Right_Hip, this._excludeBones, BodyStateType.CrouchRight);

        // crouch move sight
        this._assaultRifleMove_Crouch_Forward_Sight = this.createBodyState(this.assaultRifleMove_Crouch_Forward_Sight, this._excludeBones, BodyStateType.CrouchForward);
        this._assaultRifleMove_Crouch_Backward_Sight = this.createBodyState(this.assaultRifleMove_Crouch_Backward_Sight, this._excludeBones, BodyStateType.CrouchBackward);
        this._assaultRifleMove_Crouch_Left_Sight = this.createBodyState(this.assaultRifleMove_Crouch_Left_Sight, this._excludeBones, BodyStateType.CrouchLeft);
        this._assaultRifleMove_Crouch_Right_Sight = this.createBodyState(this.assaultRifleMove_Crouch_Right_Sight, this._excludeBones, BodyStateType.CrouchRight);

        // full body
        this._assaultRifleSprint = this.createBodyState(this.assaultRifleSprint, this._excludeBones, BodyStateType.Forward);

        this._noWeaponMove_Stand_Forward = this.createBodyState(this.noWeaponMove_Stand_Forward, this._excludeBones, BodyStateType.Forward);
        this._noWeaponSprint = this.createBodyState(this.noWeaponSprint, this._excludeBones, BodyStateType.Forward);
        this._noWeaponIdle = this.createBodyState(this.noWeaponIdle, this._excludeBones, BodyStateType.Idle);
    }

    _inHip () {
        return this._currentControlType == ControlType.ThirdPerson || 
               this._currentControlType == ControlType.Drive || 
               this._currentControlType == ControlType.TopDown;
    }

    _isJumping () {
        let currentState = this._currentMovementState;
        return currentState == CharacterMovementStates.JumpBegin || 
            currentState == CharacterMovementStates.JumpLoop || 
            currentState == CharacterMovementStates.JumpEnd;
    }

    updateAssaultRifleBodyState (toShootState: boolean) {
        if (this._currentPoseType == CharacterPoseStates.Sprint) {
            this._forwardState      = this._assaultRifleSprint;
            return;
        }

        if (this._inHip()) {
            if (this._currentPoseType == CharacterPoseStates.Crouch) {
                this._idleState         = this._assaultRifleIdle_Crouch_Hip;
                this._forwardState      = this._assaultRifleMove_Crouch_Forward_Hip;
                this._backwardState     = this._assaultRifleMove_Crouch_Backward_Hip;
                this._leftState         = this._assaultRifleMove_Crouch_Left_Hip;
                this._rightState        = this._assaultRifleMove_Crouch_Right_Hip;
            } else {
                // if (toShootState) {
                //     this._idleWholeState            = this._idleLowerState          = this._assaultRifleIdle_Stand_Hip_Shoot;
                //     this._slowForwardWholeState     = this._slowForwardLowerState   = this._assaultRifleMove_Stand_Forward_Hip_Shoot;
                //     this._slowBackwardWholeState    = this._slowBackwardLowerState  = this._assaultRifleMove_Stand_Backward_Hip_Shoot;
                //     this._slowLeftWholeState        = this._slowLeftLowerState      = this._assaultRifleMove_Stand_Left_Hip_Shoot;
                //     this._slowRightWholeState       = this._slowRightLowerState     = this._assaultRifleMove_Stand_Right_Hip_Shoot;
                // } else {
                    this._idleState         = this._assaultRifleIdle_Stand_Hip;
                    this._forwardState      = this._assaultRifleMove_Stand_Forward_Hip;
                    this._backwardState     = this._assaultRifleMove_Stand_Backward_Hip;
                    this._leftState         = this._assaultRifleMove_Stand_Left_Hip;
                    this._rightState        = this._assaultRifleMove_Stand_Right_Hip;
                // }
            }

            this._jumpBeginState = this._jumpBegin_Jog;
            this._jumpEndState = this._jumpEnd_Jog;
            this._jumpLoopState = this._jumpLoop_Jog;
        } else {
            if (this._currentPoseType == CharacterPoseStates.Crouch) {
                this._idleState         = this._assaultRifleIdle_Crouch_Sight;
                this._forwardState      = this._assaultRifleMove_Crouch_Forward_Sight;
                this._backwardState     = this._assaultRifleMove_Crouch_Backward_Sight;
                this._leftState         = this._assaultRifleMove_Crouch_Left_Sight;
                this._rightState        = this._assaultRifleMove_Crouch_Right_Sight;
            } else {
                this._idleState          = this._assaultRifleIdle_Stand_Sight;
                this._forwardState       = this._assaultRifleMove_Stand_Forward_Sight;
                this._backwardState      = this._assaultRifleMove_Stand_Backward_Sight;
                this._leftState          = this._assaultRifleMove_Stand_Left_Sight;
                this._rightState         = this._assaultRifleMove_Stand_Right_Sight;
            }

            this._jumpBeginState = this._jumpBegin_Sight;
            this._jumpEndState = this._jumpEnd_Sight;
            this._jumpLoopState = this._jumpLoop_Sight;
        }
    }

    updateNoWeaponBodyState () {
        if (this._currentPoseType == CharacterPoseStates.Sprint) {
            this._forwardState      = this._noWeaponSprint;
            return;
        }

        this._idleState = this._noWeaponIdle;
        this._forwardState = this._noWeaponMove_Stand_Forward;
    }

    updateBodyState () {
        let toShootState = false;
        let specialState = false;

        // if (this._hasShootMoveState) {
        //     // check need to change to shoot move state
        //     if (this._currentWeaponState == WeaponStates.WeaponDelayBeforeUse) {
        //         toShootState = true;
        //         specialState = true;
        //     } else if (this._currentWeaponState == WeaponStates.WeaponIdle) {
        //         toShootState = false;
        //         specialState = true;
        //     }
        // }

        if (this._preWeaponType == this._currentWeaponType && 
            this._currentControlType == this._preControlType && 
            this._currentPoseType == this._prePoseType
            ) {
            return false;
            // let weaponStateChange = this._currentWeaponState != this._preWeaponState;
            // if (!weaponStateChange || !specialState) {
            //     return false;
            // }
        }

        switch (this._currentWeaponType) {
            case WeaponType.AssaultRifle:
                this.clearBodyState();
                this.updateAssaultRifleBodyState(toShootState);
                return true;
            case WeaponType.None:
                this.clearBodyState();
                this.updateNoWeaponBodyState();
                return true;
        }

        return false;
    }

    getWeaponShootState () {
        let isJumping = this._isJumping();
		switch (this._currentWeaponType) {
            case WeaponType.AssaultRifle:

                if (isJumping) {

                    if (this._inHip()) {
                        return this._assaultRifleShoot_Hip;
                    } else {
                        return this._assaultRifleShoot_Sight;
                    }

                } else {

                    if (this._inHip()) {
                        return this._assaultRifleShoot_Addtive_Hip;
                    } else {
                        return this._assaultRifleShoot_Additive_Sight;
                    }

                }
            default:
                return null;
        }
	}

	getWeaponIdleState () {
        let isJumping = this._isJumping();
		switch (this._currentWeaponType) {
            case WeaponType.AssaultRifle:

                if (isJumping) {
                    if (this._inHip()) {
                        return this._assaultRifleIdle_Jump_Hip;
                    } else {
                        return this._assaultRifleIdle_Jump_Sight;
                    }

                } else {
                    return null;
                }
            default:
                return null;
        }
	}

    getWeaponReloadState () {
        switch (this._currentWeaponType) {
            case WeaponType.AssaultRifle:
                if (this._inHip()) {
                    return this._assaultRifleReload_Hip;
                } else {
                    return this._assaultRifleReload_Sight;
                }
            default:
                return null;
        }
    }
}