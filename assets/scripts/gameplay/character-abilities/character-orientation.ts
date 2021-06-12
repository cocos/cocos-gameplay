import { _decorator, Node, ccenum, Vec3, Quat, director, geometry, PhysicsSystem, ColliderComponent, math } from 'cc';
const { ccclass, property, type } = _decorator;
import CharacterAbility from './character-ability'
import CharacterHandleWeapon from './character-handle-weapon'
import CharacterDrive from './character-drive'
import MathUtil from '../util/math-util'
import { ColliderGroup, ControlType, CameraRotateType, CharacterAbilityPriority } from '../scene/define'
import { AimControls, AimRotateType } from '../weapons/weapon-aim'
import CinemachineCameraManager from '../cinemachine/cinemachine-camera-manager';
import { GameManager } from '../manager/game-manager';

let _tempVec3: Vec3 = new Vec3;
let _tempVec3_2: Vec3 = new Vec3;
let _tempQuat: Quat = new Quat;
let _tempQuat2: Quat = new Quat;
let _halfPI = Math.PI * 0.5;

/// the possible rotation modes
export enum RotationModes { 
	None, ThirdPerson, FollowWeapon, Drive
}
ccenum(RotationModes);

@ccclass('CharacterOrientation')
export class CharacterOrientation extends CharacterAbility {
    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Orientation;

    public rotationMode: RotationModes = RotationModes.None;

    @property
    public yawRotateSpeed: number = 300;

    @property
    public pitchRotateSpeed: number = 300;

    @property({type:Node})
    public headModel: Node | null = null;

    @property
    applyOriginYaw = false;
    
    @property
    applyOriginPitch = false;

    @property
    toOriginPitchTime = 3;

    protected _toOriginPitchCount = 0;
    public characterHandleWeapon: CharacterHandleWeapon | null = null;
    protected _characterDrive: CharacterDrive | null = null;

    protected _targetYaw: number = 0;
    protected _currentYaw: number = 0;

    protected _targetPitch: number = 0;
    protected _currentPitch: number = 0;

    protected _currentForward: Vec3 | null = null;
    protected _currentUp: Vec3 | null = null;
    protected _currentRight: Vec3 | null = null;

    protected _yawModel: Node | null = null;
    protected _upNode: Node | null = null;
    protected _pitchModel: Node | null = null;
    protected _rightNode: Node | null = null;
    protected _forwardNode: Node | null = null;

    initialization () {
        super.initialization();
        this.characterHandleWeapon = this.getComponent(CharacterHandleWeapon);
        this._characterDrive = this.getComponent(CharacterDrive);

        this._yawModel = this._character!.yawModel;
        this._upNode = this._character!.upNode;
        this._pitchModel = this._character!.pitchModel;
        this._rightNode = this._character!.rightNode;
        this._forwardNode = this._character!.forwardNode;
        this._currentUp = this._character!.currentUp;
        this._currentRight = this._character!.currentRight;
        this._currentForward = this._character!.currentForward;

        if (this._animator) {
            this._animator.yawRotateSpeed = this.yawRotateSpeed;
            this._animator.currentUp = this._currentUp!;
            this._animator.currentRight = this._currentRight!;
        }
    }

    processAbility () {
        super.processAbility();

        let controlType = this._character!.controlType;
        if (this._animator) this._animator.setControlType(controlType);

        let cameraMgr = CinemachineCameraManager.instance;
        let shooting = this.characterHandleWeapon?.isShooting();
        let aimComp = this.characterHandleWeapon?.weaponAimComponent;
        let dt = director.getDeltaTime();

        let needRotateToTarget = false;
        switch (controlType) {
            case ControlType.TopDown:
                this.rotationMode = RotationModes.FollowWeapon;
                if (aimComp) aimComp.aimControl = aimComp.isAutoAim ? AimControls.Auto : AimControls.Mouse;
            break;
            case ControlType.ShoulderSurfing:
            case ControlType.FirstPerson:
                if (aimComp) aimComp.aimControl = AimControls.Center;
                this.rotationMode = RotationModes.FollowWeapon;
                needRotateToTarget = true;
                break;
            case ControlType.ThirdPerson:
                if (aimComp) aimComp.aimControl = AimControls.Center;
                if (shooting) {
                    this.rotationMode = RotationModes.FollowWeapon;
                    needRotateToTarget = true;
                } else {
                    this.rotationMode = RotationModes.ThirdPerson;
                    cameraMgr.cameraRotateType = CameraRotateType.ThridPerson;
                }
                break;
            case ControlType.Drive:
                if (aimComp) aimComp.aimControl = AimControls.Auto;
                this.rotationMode = RotationModes.Drive;
                break;
            default:
                 if (aimComp) aimComp.aimControl = AimControls.Auto;
                break;
        }

        if (controlType == ControlType.ThirdPerson && !shooting) {
            this._toOriginPitchCount += dt;
        } else {
            this._toOriginPitchCount = 0;
        }
        
        switch(this.rotationMode) {
            case RotationModes.ThirdPerson:
                this.handleThirdPerson();
                this.rotateToTargetDirection();
            break;
            case RotationModes.FollowWeapon:
                this.handleFollowWeapon();
                this.rotateToTargetDirection();
            break;
            case RotationModes.Drive:
                this.handleDrive();
            break;
        }

        if (needRotateToTarget) {
            let isRotateFinished = this.isRotateFinished();
            if (isRotateFinished) {
                cameraMgr.cameraRotateType = CameraRotateType.FirstPersonOrShoulderSurfing;
            }
        }
    }

    lateProcessAbility () {
        if (this.applyOriginYaw) {
            this._yawModel!.getRotation(_tempQuat);
        } else {
            Quat.identity(_tempQuat);
        }
        
        this._upNode!.parent!.getWorldPosition(_tempVec3);
        this._upNode!.getWorldPosition(this._currentUp!);
        this._currentUp!.subtract(_tempVec3);
        this._currentUp!.normalize();

        MathUtil.directionToNodeSpace(_tempVec3_2, this._currentUp!, this._yawModel!);

        Vec3.multiplyScalar(_tempVec3, _tempVec3_2, this._currentYaw);
        Quat.fromEuler (_tempQuat2, _tempVec3.x, _tempVec3.y, _tempVec3.z);
        Quat.multiply(_tempQuat2, _tempQuat, _tempQuat2);
        this._yawModel!.setRotation(_tempQuat2);

        if (this.applyOriginPitch) {
            this._pitchModel!.getRotation(_tempQuat);
        } else {
            Quat.identity(_tempQuat);
        }

        this._rightNode!.parent!.getWorldPosition(_tempVec3);
        this._rightNode!.getWorldPosition(this._currentRight!);
        this._currentRight!.subtract(_tempVec3);
        this._currentRight!.normalize();

        MathUtil.directionToNodeSpace(_tempVec3_2, this._currentRight!, this._pitchModel!);

        this._pitchModel!.parent?.getWorldScale(_tempVec3);
        let sign = Math.sign(_tempVec3.x);
        Vec3.multiplyScalar(_tempVec3, _tempVec3_2, sign * this._currentPitch);
        Quat.fromEuler (_tempQuat2, _tempVec3.x, _tempVec3.y, _tempVec3.z);
        Quat.multiply(_tempQuat2, _tempQuat, _tempQuat2);
        this._pitchModel!.setRotation(_tempQuat2);
        
        let controlType = this._character?.controlType;
        if (this.headModel) {
            if (controlType == ControlType.FirstPerson) {
                this.headModel.setScale(Vec3.ZERO);
            } else {
                this.headModel.setScale(Vec3.ONE);
            }
        }

        this._forwardNode!.parent!.getWorldPosition(_tempVec3);
        this._forwardNode!.getWorldPosition(this._currentForward!);
        this._currentForward!.subtract(_tempVec3);
        this._currentForward!.normalize();
    }

    rotateToTargetDirection () {
        let dt = director.getDeltaTime();

        let absTargetYaw = Math.abs(this._targetYaw);
        let yawSpeed = this.yawRotateSpeed * dt;
        if (yawSpeed > absTargetYaw) {
            yawSpeed = absTargetYaw;
        }

        if (this._targetYaw > 0) {
            this._currentYaw += yawSpeed;
        } else if (this._targetYaw < 0) {
            this._currentYaw -= yawSpeed;
        } 

        let absTargetPitch = Math.abs(this._targetPitch);
        let pitchSpeed = this.pitchRotateSpeed * dt;
        if (pitchSpeed > absTargetPitch) {
            pitchSpeed = absTargetPitch;
        }

        if (this._targetPitch > 0) {
            this._currentPitch += pitchSpeed;
        } else if (this._targetPitch < 0) {
            this._currentPitch -= pitchSpeed;
        } 
    }

    setTargetByPos (pos: Vec3) {
        this._targetYaw = 0;
        this._targetPitch = 0;

        // debug target ray
        // this.node.getWorldPosition(_tempVec3_2);
        // GameManager.instance.drawLineByPos(_tempVec3_2, pos);
        // GameManager.instance.drawPos(pos);

        // convert to root node to get absolute angle from origin
        MathUtil.convertToNodeSpace(_tempVec3_2, pos, this.node);
        _tempVec3_2.y = 0;
        _tempVec3_2.normalize();

        let targetYaw = MathUtil.radiansToDegrees(Math.atan2(_tempVec3_2.x, _tempVec3_2.z));
        let dt = director.getDeltaTime();
        let yawSpeed = this.yawRotateSpeed * dt;
        this._currentYaw = MathUtil.transformDegreesToNear(this._currentYaw, targetYaw);

        if (this._currentYaw > targetYaw) {
            this._currentYaw -= yawSpeed;
            if (this._currentYaw < targetYaw) this._currentYaw = targetYaw;
        } else if (this._currentYaw < targetYaw) {
            this._currentYaw += yawSpeed;
            if (this._currentYaw > targetYaw) this._currentYaw = targetYaw;
        }
    }

    setTarget (target: Node) {
        target.getWorldPosition(_tempVec3);
        this.setTargetByPos(_tempVec3);
    }

    getCurrentForward () {
        return this._currentForward!;
    }

    handleThirdPerson() {
        if (!this._inputManager) return;

        if (this._toOriginPitchCount > this.toOriginPitchTime) {
            this._targetPitch = -this._currentPitch;
        } else {
            this._targetPitch = 0;
        }

        if(!this._inputManager.primaryEnable) {
            this._targetYaw = 0;
            return;
        }

        // because input is base on engine z and x axis, so it's like
        /*
            |     
        ____|_____\ x
            |     / 
            |
           \ /
           z
        */
        // now we need to handle direction with the camera observe direction, so we need to reversal the z axis, the z is primary movement's y axis
        // the x and y is zero when beginning, that's mean it point to x axis, but camera point to -z direction, so need to minus 90

        CinemachineCameraManager.instance.getCameraDirection(_tempVec3);
        _tempVec3.y = 0;
        _tempVec3.normalize();

        this._targetYaw = MathUtil.getLocalDegree(this._inputManager!.primaryMovement, _tempVec3,  this._yawModel!);
    }

    handleFollowWeapon () {
        if (!this.characterHandleWeapon) {
            this._targetYaw = 0;
            this._targetPitch = 0;
            return;
        }

        let aimComp = this.characterHandleWeapon.weaponAimComponent;
        if (!aimComp) {
            this._targetYaw = 0;
            this._targetPitch = 0;
            return;
        }
    
        if (aimComp.yawRotateType == AimRotateType.ByCharacter) {
            this._targetYaw = aimComp.currentYaw;
        } else {
            this._targetYaw = 0;
        }

        if (aimComp.pitchRotateType == AimRotateType.ByCharacter) {
            this._targetPitch = aimComp.currentPitch;
        } else {
            this._targetPitch = 0;
        }
    }

    handleDrive () {
        let hasTarget = GameManager.instance.hasTarget();
        if (!hasTarget && this._characterDrive) {
            
            this._targetYaw = 0;
            this._targetPitch = 0;

            let dt = director.getDeltaTime();
            let yawSpeed = this.yawRotateSpeed * dt;
            let targetYaw = this._characterDrive.currentYaw;
            this._currentYaw = MathUtil.transformDegreesToNear(this._currentYaw, targetYaw);

            if (this._currentYaw > targetYaw) {
                this._currentYaw -= yawSpeed;
                if (this._currentYaw < targetYaw) this._currentYaw = targetYaw;
            } else if (this._currentYaw < targetYaw) {
                this._currentYaw += yawSpeed;
                if (this._currentYaw > targetYaw) this._currentYaw = targetYaw;
            }   

            return;
        }

        this.handleFollowWeapon();
        this.rotateToTargetDirection();
    }

    isRotateFinished () {
        return Math.abs(this._targetYaw) < 0.05 && Math.abs(this._targetPitch) < 0.05;
    }

    updateAnimator () {
        this._animator!.localAngle = this._currentYaw;
    }
}