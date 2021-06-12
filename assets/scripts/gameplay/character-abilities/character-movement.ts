import { _decorator, Vec3, director, geometry, warn, ColliderComponent, ICollisionEvent, Quat, PhysicsSystem, Node } from 'cc';
const { ccclass, property } = _decorator;
import CharacterAbility from './character-ability';
import { CharacterMovementStates } from '../core/character-states';
import MathUtil from '../util/math-util';
import CinemachineCameraManager from '../cinemachine/cinemachine-camera-manager';
import CharacterHandleWeapon from './character-handle-weapon';
import CharacterDrive from './character-drive';
import { CharacterAbilityPriority, ColliderGroup, ControlType } from '../scene/define';
import { GameManager } from '../manager/game-manager';
import { StateEvent, StateEventType } from '../util/state-machine';

let _tempVec3 = new Vec3;
let _tempVec3_2 = new Vec3;
let _tempQuat = new Quat;
let _tempQuat_2 = new Quat;
let _halfPI = Math.PI * 0.5;
let _up = new Vec3(0, 1, 0);

let RayMask = ColliderGroup.Ground | ColliderGroup.Wall | ColliderGroup.Bevel;

@ccclass('CharacterMovement')
export default class CharacterMovement extends CharacterAbility {
    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Movment;

    // Normalized vector
    protected _movementDirection: Vec3 = new Vec3;
    get movementDirection () {
        return this._movementDirection;
    }

    protected _movementVector: Vec3 = new Vec3;

    protected _realtimeSpeed: number = 0;
    protected _speed: number = 0;
    protected _ySpeed: number = 0;

    protected _characterHandleWeapon: CharacterHandleWeapon | null = null;
    protected _characterDrive: CharacterDrive | null = null;
    protected _currentGroundDistance = 0;
    protected _currentGroundNormal: Vec3 = new Vec3;
    protected _currentBodyUpTarget: Vec3 = new Vec3;
    protected _ray: geometry.Ray = new geometry.Ray;
    protected _currentUp!: Vec3;
    protected _upNode!: Node;

    public sensitivity = 0;
    public accEnable = false;
    public movementSpeedMultiplier : number = 1.0;

    @property
    initSpeed: number = 2.0;

    @property
    maxSpeed: number = 5.0;

    @property
    accelerate: number = 1.0;

    @property
    jumpMinHeight = 0.4;

    @property
    jumpInitSpeed = 5;

    @property
    gravityAccelerate: number = -10.0;

    @property
    upRotateSpeed = 10;

    @property
    closeToGroundSpeed = 2;

    initialization () {
        super.initialization();

        this._currentUp = this._character!.currentUp;
        this._upNode = this._character!.upNode!;
        this._characterHandleWeapon = this.getComponent(CharacterHandleWeapon);
        this._characterDrive = this.getComponent(CharacterDrive);
        
        if (this._animator) {
            this._animator.initSpeed = this.initSpeed;
            this._animator.maxSpeed = this.maxSpeed;
        }
        this._speed = this.initSpeed;
    }

    lateProcessAbility () {
        super.lateProcessAbility();

        if (Math.abs(this.gravityAccelerate) > 0.00001) {
            this.handleGround();
            this.handleMidAir();
        } else {
            this._ySpeed = 0;
        }
        this.handleMovement();
    }

    handleGround () {
        let hitResult = this.getCurrentGroundHitResult();
        if (hitResult) {
            Vec3.copy(this._currentGroundNormal, hitResult.hitNormal);
            this._currentGroundDistance = hitResult.distance - this._upNode.position.y;

            if (this._currentGroundDistance < 0) {
                
                this.node.getWorldPosition(_tempVec3);
                let distance = Math.abs(this._currentGroundDistance);
                let totalTime = Math.abs(distance / this.closeToGroundSpeed);
                let dt = director.getDeltaTime();
                if (totalTime > dt) {
                    Vec3.lerp(_tempVec3, _tempVec3, hitResult.hitPoint, dt / totalTime);
                } else {
                    Vec3.copy(_tempVec3, hitResult.hitPoint);
                }
                this.node.setWorldPosition(_tempVec3);
                
                this._currentGroundDistance = 0;
            }

        } else {
            // warn("CharacterMovement handleGround has no ground");
            Vec3.set(this._currentGroundNormal, 0, 1, 0);
            this._currentGroundDistance = 0;
        }

        // debug direction line
        // this.node.getWorldPosition(_tempVec3);
        // GameManager.instance.drawDirectionByPos(_tempVec3, this._currentGroundNormal);
    }

    handleMidAir () {
        let currentState = this._movementState!.currentState;
        Vec3.copy(this._currentBodyUpTarget, this._currentGroundNormal);

        let almostStay = Math.abs(this._ySpeed) < 0.00001;
        let toGround = this._ySpeed < 0;
        if ((toGround || almostStay) && this._currentGroundDistance <= 0.00001) {
            this._ySpeed = 0;
            if (currentState == CharacterMovementStates.JumpLoop) {
                this._movementState!.changeState(CharacterMovementStates.JumpEnd);
            }
            return;
        }

        let dt = director.getDeltaTime() || 1 / 60;
        this._ySpeed += this.gravityAccelerate * dt;
        if (toGround && -this._ySpeed * dt > this._currentGroundDistance) {
            this._ySpeed = -this._currentGroundDistance / dt;
        }

        if (this._currentGroundDistance < this.jumpMinHeight) {
            return;
        }

        Vec3.set(this._currentBodyUpTarget, 0, 1, 0);

        if (currentState != CharacterMovementStates.JumpLoop && currentState != CharacterMovementStates.JumpBegin) {
            this._movementState!.changeState(CharacterMovementStates.JumpLoop);
        }
    }

    getCurrentGroundHitResult () {
        this._upNode.getWorldPosition(_tempVec3);
        let currentUp = this._currentUp;
        geometry.Ray.set(this._ray, 
            _tempVec3.x, _tempVec3.y, _tempVec3.z,
            -currentUp.x, -currentUp.y, -currentUp.z);
        let hasHit = PhysicsSystem.instance.raycastClosest(this._ray, RayMask);
        if (!hasHit) {
            return null;
        }
        let hitResult = PhysicsSystem.instance.raycastClosestResult;
        return hitResult;
    }

    handleInput () {
        if (this._inputManager!.jumpEnable && Math.abs(this._ySpeed) < 0.00001) {
            this._ySpeed = this.jumpInitSpeed;
            this._movementState!.changeState(CharacterMovementStates.JumpBegin);
        }

        let controlType = this._character!.controlType;
        switch (controlType) {
            case ControlType.TopDown:
            case ControlType.ShoulderSurfing:
            case ControlType.FirstPerson:
            case ControlType.ThirdPerson:
            case ControlType.Debug:
                this.handleCameraDirection();
                break;
            case ControlType.Drive:
                this.handleDriveDirection();
                break;
        }
        this.accEnable = this._inputManager!.accEnable;
    }

    handleDriveDirection () {
        if (!this._inputManager || !this._inputManager.primaryEnable || !this.isNormal() || !this._characterDrive) {
            Vec3.zero(this._movementDirection);
            return;
        }
        Vec3.copy(this._movementDirection, this._characterDrive.driveDirection);
        Vec3.multiplyScalar(this._movementDirection, this._movementDirection, this._characterDrive.signDirection);
    }

    handleCameraDirection () {
        if (!this._inputManager || !this._inputManager.primaryEnable || !this.isNormal()) {
            Vec3.zero(this._movementDirection);
            return;
        }

        let x = this._inputManager!.primaryMovement.x;
        let y = this._inputManager!.primaryMovement.y;
        let deg = Math.atan2(-y, x) - _halfPI;

        CinemachineCameraManager.instance.getCameraDirection(_tempVec3);
        _tempVec3.y = 0;
        _tempVec3.normalize();
        
        Vec3.rotateY(_tempVec3, _tempVec3, Vec3.ZERO, deg);
        Vec3.copy(this._movementDirection, _tempVec3);
    }

    setMovementDirection (x: number, y: number, z: number) {
        this._movementDirection.x = x;
        this._movementDirection.y = y;
        this._movementDirection.z = z;
        this._movementDirection.normalize();
    }

    isJumping () {
        let currentState = this._movementState!.currentState;
        return currentState == CharacterMovementStates.JumpBegin || 
            currentState == CharacterMovementStates.JumpLoop || 
            currentState == CharacterMovementStates.JumpEnd;
    }

    handleMovement () {
        let dt = director.getDeltaTime();

        // Rotates body so that it is perpendicular to the ground

        // let angle = Vec3.angle(this._currentUp, this._currentBodyUpTarget);
        // angle = MathUtil.radiansToDegrees(angle);
        // let totalTime = Math.abs(angle / this.upRotateSpeed);

        // Quat.rotationTo(_tempQuat_2, this._currentUp, this._currentBodyUpTarget);
        // this.node!.getRotation(_tempQuat);

        // Quat.multiply(_tempQuat_2, _tempQuat, _tempQuat_2);

        // if (totalTime > dt) {
        //     Quat.lerp(_tempQuat_2, _tempQuat, _tempQuat_2, dt / totalTime);
        // }
        // this.node!.setRotation(_tempQuat_2);

        Quat.rotationTo(_tempQuat_2, _up, this._currentGroundNormal);
        Vec3.transformQuat(this._movementDirection, this._movementDirection, _tempQuat_2);

        let directionLen = this._movementDirection.length();
        if (directionLen < 0.0001) {
            if (!this.isJumping()) {
                this._movementState!.changeState(CharacterMovementStates.Idle);
            }
            Vec3.copy(this._movementVector, Vec3.ZERO);
            this._realtimeSpeed = 0;
            this._speed = this.initSpeed;
        } else {
            // debug direction line
            // this.node.getWorldPosition(_tempVec3);
            // GameManager.instance.drawDirectionByPos(_tempVec3, this._movementDirection);

            if (!this.isJumping()) {
                this._movementState!.changeState(CharacterMovementStates.Walking);
            }

            Vec3.copy(this._movementVector, this._movementDirection);

            if (this.accEnable) {
                this._speed += this.accelerate * dt;
            } else {
                this._speed -= this.accelerate * dt;
            }

            if (this._speed > this.maxSpeed) {
                this._speed = this.maxSpeed;
            }

            if (this._speed < this.initSpeed) {
                this._speed = this.initSpeed;
            }

            if (this._characterHandleWeapon) {
                let currentWeapon = this._characterHandleWeapon.currentWeapon;
                if (currentWeapon) {
                    this.movementSpeedMultiplier = currentWeapon.movementMultiplier;
                } else {
                    this.movementSpeedMultiplier = 1.0;
                }
            } else {
                this.movementSpeedMultiplier = 1.0;
            }

            this._realtimeSpeed = this._speed * this.movementSpeedMultiplier;
            this.sensitivity = this._realtimeSpeed * dt;
        
            this._movementVector.multiplyScalar(this._realtimeSpeed);
        }

        // vertical speed
        Vec3.multiplyScalar(_tempVec3, _up, this._ySpeed);
        this._movementVector.add(_tempVec3);
        this._controller!.setLinearVelocity(this._movementVector);
    }

    updateAnimator () {
        this._animator!.speed = this._realtimeSpeed;
        this._animator!.setMovementState(this._movementState!.currentState);

        let yawModel = this._character!.yawModel;
        if (this._characterHandleWeapon) {
            let currentWeapon = this._characterHandleWeapon.currentWeapon;
            if (currentWeapon) {
                yawModel = currentWeapon.rotatingModel;
            }
        }
        MathUtil.directionToNodeSpace(_tempVec3, this._movementDirection, yawModel!);
        this._animator!.localMoveAngle = MathUtil.radiansToDegrees(Math.atan2(_tempVec3.x, _tempVec3.z));
    }
}
