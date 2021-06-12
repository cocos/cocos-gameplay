import { _decorator, Vec3 } from 'cc';
import MathUtil from "./math-util"
const { ccclass, property } = _decorator;

@ccclass('Rotator')
export class Rotator {
	public pitch: number = 0;
	public yaw: number = 0;
	public roll: number = 0;

	private _vec: Vec3 = new Vec3();
	vector (): Vec3 {
		let degPitch = MathUtil.degreesToRadians(this.pitch);
		let degYaw = MathUtil.degreesToRadians(this.yaw);
		let cosPitch = Math.cos(degPitch);
		let sinPitch = Math.sin(degPitch);
		let cosYaw = Math.cos(degYaw);
		let sinYaw = Math.sin(degYaw);
		let vec = this._vec;
		vec.x = cosPitch * cosYaw;
		vec.y = cosPitch * sinYaw;
		vec.z = sinPitch;
		return vec;
	}
}
