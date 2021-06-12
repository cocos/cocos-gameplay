import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property, type } = _decorator;
import MathUtil from "../util/math-util"

let _tempVec3 = new Vec3;

@ccclass('MuzzleFlash')
export default class MuzzleFlash extends Component {
    update () {
        _tempVec3.x = Math.random();
        _tempVec3.y = Math.random();
        _tempVec3.z = Math.random();
        this.node.setScale(_tempVec3);
        this.node.angle = MathUtil.randomInt(0, 90);
    }
}