import { _decorator, warn, AnimationClip } from 'cc';
import { CharacterAnimator } from '../core/character-animator';
const { ccclass, property, type } = _decorator;

@ccclass('AngrybotsAnimator')
export class AngrybotsAnimator extends CharacterAnimator {
    idleBeginFrame = 0;
    idleEndFrame = 10;

    turnBeginFrame = 0;
    turnEndFrame = 10;

    moveForwardBeginFrame = 76;
    moveForwardEndFrame = 95;

    moveBackwardBeginFrame = 96;
    moveBackwardEndFrame = 115;

    moveRightBeginFrame = 117;
    moveRightEndFrame = 135;

    moveLeftBeginFrame = 137;
    moveLeftEndFrame = 154;

    protected _commonClip: AnimationClip | null = null;
    protected _totalFrame: number = 0;

    initialization () {
        this._commonClip = this.animation!.clips[0];
        if (!this._commonClip) {
            warn("RobotAnimator initialization common clip is empty");
            return;
        }
        
        this._totalFrame = this.moveLeftEndFrame;

        this._idleState = this.createState(this._commonClip, "idle");
        // for test
        // (this._idleState as any).setWeightTarget(1.0);
        this._idleState!.wrapMode = AnimationClip.WrapMode.PingPong;
        this.setStateFrameRange(this._idleState, this.idleBeginFrame, this.idleEndFrame, this._totalFrame, true, 0.8);

        this._forwardState = this.createState(this._commonClip, "forward");
        this.setStateFrameRange(this._forwardState, this.moveForwardBeginFrame, this.moveForwardEndFrame, this._totalFrame);

        this._backwardState = this.createState(this._commonClip, "backward");
        this.setStateFrameRange(this._backwardState, this.moveBackwardBeginFrame, this.moveBackwardEndFrame, this._totalFrame);

        this._rightState = this.createState(this._commonClip, "right");
        this.setStateFrameRange(this._rightState, this.moveRightBeginFrame, this.moveRightEndFrame, this._totalFrame);

        this._leftState = this.createState(this._commonClip, "left");
        this.setStateFrameRange(this._leftState, this.moveLeftBeginFrame, this.moveLeftEndFrame, this._totalFrame);
    }

    
}