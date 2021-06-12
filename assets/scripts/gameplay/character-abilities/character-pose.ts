import { Vec3, _decorator } from 'cc';
import { CharacterPoseStates } from '../core/character-states';
import { CharacterAbilityPriority } from '../scene/define';
const { ccclass, property } = _decorator;
import CharacterAbility from './character-ability';

let _tempVec3 = new Vec3;

@ccclass('CharacterPose')
export default class CharacterPose extends CharacterAbility {

    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Pose;
    public rotatorFollowY_Stand = 0;

    @property
    rotatorFollowY_Crouch = 0;

    initialization () {
        super.initialization();

        let rotatorFollow = this._character!.rotatorFollow;
        if (rotatorFollow) {
            rotatorFollow.getPosition(_tempVec3);
            this.rotatorFollowY_Stand = _tempVec3.y;
        }
    }

    handleInput () {
        let crouch = this._inputManager!.crouchEnable;
        let acc = this._inputManager!.accEnable;

        let rotatorY = 0;
        let prePose = this._poseState!.currentState;

        if (crouch) {
            rotatorY = this.rotatorFollowY_Crouch;
            this._poseState!.changeState(CharacterPoseStates.Crouch);
        } else {
            rotatorY = this.rotatorFollowY_Stand;
            this._poseState!.changeState(CharacterPoseStates.Stand);
        }

        if (acc) {
            rotatorY = this.rotatorFollowY_Stand;
            this._poseState!.changeState(CharacterPoseStates.Sprint);
        }

        if (prePose != this._poseState!.currentState) {
            let rotatorFollow = this._character!.rotatorFollow;
            let driveFollow = this._character!.driveRotatorFollow;
            let cameraRotator = this._character!.cameraTargetRotator;
            if (rotatorFollow) {
                rotatorFollow.getPosition(_tempVec3);
                _tempVec3.y = rotatorY;
                rotatorFollow.setPosition(_tempVec3);
            }
            if (driveFollow) {
                driveFollow.getPosition(_tempVec3);
                _tempVec3.y = rotatorY;
                driveFollow.setPosition(_tempVec3);
            }
            if (cameraRotator) {
                cameraRotator.getPosition(_tempVec3);
                _tempVec3.y = rotatorY;
                cameraRotator.setPosition(_tempVec3);
            }
        }
    }

    updateAnimator () {
        this._animator!.setPoseState(this._poseState!.currentState);
    }
}
