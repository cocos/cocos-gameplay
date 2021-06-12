import { director, Vec2, Vec3, _decorator } from 'cc';
import { CharacterAbilityPriority } from '../scene/define';
import MathUtil from '../util/math-util';
const { ccclass, property } = _decorator;
import CharacterAbility from './character-ability';

let _tempVec3 = new Vec3;
let _tempVec3_2 = new Vec3;
let _tempVec2 = new Vec2;
let _halfPI = Math.PI * 0.5;

@ccclass('CharacterDrive')
export default class CharacterDrive extends CharacterAbility {

    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Drive;

    @property
    rotateSpeed = 10;

    protected _targetYaw = 0;
    public currentYaw = 0;

    public driveDirection: Vec3 = new Vec3(0, 0, 1);
    public signDirection = 1;

    initialization () {
        
    }

    handleInput () {
        let rotatorFollow = this._character!.driveRotatorFollow;

        if (!this._inputManager!.primaryEnable || !this.isNormal() || !rotatorFollow) {
            this._targetYaw = 0;
            return;
        }

        let primaryMovement =  Vec2.copy(_tempVec2, this._inputManager!.primaryMovement);
        if (primaryMovement.y > 0) {
            primaryMovement.x *= -1;
            primaryMovement.y *= -1;
            this.signDirection = -1;
        }  else {
            this.signDirection = 1;
        }

        this._targetYaw = MathUtil.getLocalDegree(primaryMovement, this.driveDirection,  rotatorFollow);
    }

    processAbility () {
        let rotatorFollow = this._character!.driveRotatorFollow;
        let directionNode = this._character!.driveForward;
        if (!rotatorFollow || !directionNode) return;

        let dt = director.getDeltaTime();
        let speed = this.rotateSpeed * dt;
        let absAngle = Math.abs(this._targetYaw);
        if (speed > absAngle) speed = absAngle;

        if (this._targetYaw > 0) {
            this.currentYaw += speed;
        } else {
            this.currentYaw -= speed;
        }

        Vec3.copy(_tempVec3, rotatorFollow.eulerAngles);
        _tempVec3.y = this.currentYaw;
        rotatorFollow.setRotationFromEuler(_tempVec3);

        directionNode.getWorldPosition(_tempVec3);
        rotatorFollow.getWorldPosition(_tempVec3_2);
        Vec3.subtract(this.driveDirection, _tempVec3, _tempVec3_2);
        this.driveDirection.normalize();
    }
}
