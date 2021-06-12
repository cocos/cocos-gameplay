import { _decorator } from 'cc';
import { CharacterAnimator } from '../core/character-animator';
const { ccclass } = _decorator;

@ccclass('SpiderAnimator')
export class SpiderAnimator extends CharacterAnimator {
    initialization () {
        super.initialization();
        if (this._forwardState) {
            (this._forwardState as any).setWeightTarget(1);
        }
    }

    update () {}
    lateUpdate () {}
}