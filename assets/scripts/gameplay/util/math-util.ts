import { _decorator, Vec3, Node, Mat4, Quat, geometry, PhysicsSystem, physics, Vec2, math } from 'cc';
import { ColliderGroup, ControlType, CameraRotateType } from '../scene/define'
const { ccclass, property } = _decorator;

let _tempVec3: Vec3 = new Vec3;
let _tempVec3_2: Vec3 = new Vec3;

let _tempMat: Mat4 = new Mat4;
let _tempMat_2: Mat4 = new Mat4;

let _forward: Vec3 = new Vec3(0, 0, 1);

let _ray: geometry.Ray = new geometry.Ray;

@ccclass('MathUtil')
export default class MathUtil {
	public static degreesToRadians (degValue: number): number {
		return degValue * (Math.PI / 180.0);
	}

	public static radiansToDegrees (radValue: number): number {
		return radValue * (180.0 / Math.PI);
	}

	public static clamp01 (value: number): number {
		if (value < 0) return 0;
		if (value > 1) return 1;
		return value;
	}

	public static clampDegrees (value: number, min: number = -180, max: number = 180): number {
		while(value < min) {
			value += 360;
		}
		while(value > max) {
			value -= 360;
		}
		return value;
	}

	public static transformDegreesToNear (value: number, target: number) {
		if (Math.abs(value - target) < 180) return value;
		if (value < target) {
			while (value < target) {
				value += 360;
			}
			return value;
		}
		while (value > target) {
			value -= 360;
		}
		return value;
	}

	public static clamp (value: number, min: number, max: number): number {
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}

	public static inverseLerp (a: number, b: number, v: number) {
		let ba = b - a;
		if (Math.abs(ba) < 0.000001) return 0;
		v = (v - a) / ba;
		return MathUtil.clamp01(v);
	}

	public static remap (x: number, a: number, b: number, c: number, d: number): number {
		let remappedValue: number = c + (x - a) / (b - a) * (d - c);
        return remappedValue;
	}

	public static convertToNodeSpace (out: Vec3, worldPosition: Vec3, node: Node) {
		node.getWorldMatrix(_tempMat);
		Mat4.invert(_tempMat_2, _tempMat);
		return Vec3.transformMat4(out, worldPosition, _tempMat_2);
	}

	public static convertToWorldSpace (out: Vec3, localPosition: Vec3, node: Node) {
		node.getWorldMatrix(_tempMat);
		return Vec3.transformMat4(out, localPosition, _tempMat);
	}

	public static randomInt (min: number, max: number) {
		if (min > max) return -1;
		return min + Math.round((max - min) * Math.random())
	}

	public static directionToNodeSpace (out: Vec3, worldDirection: Vec3, node: Node) {
        node.getWorldPosition(_tempVec3);
        _tempVec3.add(worldDirection);
        MathUtil.convertToNodeSpace(out, _tempVec3, node);
	}

	public static getWorldLine (beginNode: Node, endNode: Node, worldRotation: Quat, worldPosition: Vec3) {
		beginNode.getWorldPosition(_tempVec3);
		endNode.getWorldPosition(_tempVec3_2);

		Vec3.lerp(worldPosition, _tempVec3, _tempVec3_2, 0.5);

		_tempVec3_2.subtract(_tempVec3);
		let length = _tempVec3_2.length();
		_tempVec3_2.normalize();

		Quat.rotationTo(worldRotation, _forward, _tempVec3_2);
		return length;
	}

	public static getWorldLineByPos (beginPos: Vec3, endPos: Vec3, worldRotation: Quat, worldPosition: Vec3) {
		Vec3.copy(_tempVec3, beginPos);
		Vec3.copy(_tempVec3_2, endPos);

		Vec3.lerp(worldPosition, _tempVec3, _tempVec3_2, 0.5);

		_tempVec3_2.subtract(_tempVec3);
		let length = _tempVec3_2.length();
		_tempVec3_2.normalize();

		Quat.rotationTo(worldRotation, _forward, _tempVec3_2);
		return length;
	}

	public static getFieldViewPoint (points: Node[], testPoint: Node, resultPoints: Node[], pointMask = ColliderGroup.PathPointAim, resultPointsMap: Map<Node, boolean> | null = null, yEnoughDistance = 99999) {
		testPoint.getWorldPosition(_tempVec3);
		resultPoints.length = 0;
		if (resultPointsMap) {
			resultPointsMap.clear();
		}

		for (let i = 0; i < points.length; i++) {
			let point = points[i];
			if (testPoint == point) continue;

			point.getWorldPosition(_tempVec3_2);

			let yDistance = Math.abs(_tempVec3.y - _tempVec3_2.y);
			if (yDistance > yEnoughDistance) continue;

			Vec3.subtract(_tempVec3_2, _tempVec3_2, _tempVec3);
            _tempVec3_2.normalize();
			geometry.Ray.set(_ray,
				_tempVec3.x, _tempVec3.y, _tempVec3.z,
				_tempVec3_2.x, _tempVec3_2.y, _tempVec3_2.z);

			let hasHit = PhysicsSystem.instance.raycastClosest(_ray, pointMask);
			if (!hasHit) continue;
			let hitResult = PhysicsSystem.instance.raycastClosestResult;
			if (hitResult.collider.node != point) continue;

			(point as any).__distance = hitResult.distance;
			resultPoints.push(point);
			if (resultPointsMap) {
				resultPointsMap.set(point, true);
			}
		}
		
		resultPoints.sort((a, b) => (a as any).__distance - (b as any).__distance);
		return resultPoints;
	}

	public static distance (a: Node, b: Node) {
		a.getWorldPosition(_tempVec3);
		b.getWorldPosition(_tempVec3_2);
		return Vec3.distance(_tempVec3, _tempVec3_2);
	}

	public static hDistance (a: Vec3, b: Vec3) {
		Vec3.copy(_tempVec3, a);
		Vec3.copy(_tempVec3_2, b);
		_tempVec3.y = 0;
		_tempVec3_2.y = 0;
		return Vec3.distance(_tempVec3, _tempVec3_2);
	}

	public static getLocalDegree (rotateValue: Vec2, rotateVector: Vec3, node: Node) {
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
        let x = rotateValue.x;
        let y = rotateValue.y;
        let deg = Math.atan2(-y, x) - Math.PI * 0.5;
        
        Vec3.rotateY(_tempVec3, rotateVector, Vec3.ZERO, deg);            
        node.getWorldPosition(_tempVec3_2);
        _tempVec3_2.add(_tempVec3);
        MathUtil.convertToNodeSpace(_tempVec3, _tempVec3_2, node);
        _tempVec3.y = 0;
        _tempVec3.normalize();
        return MathUtil.radiansToDegrees(Math.atan2(_tempVec3.x, _tempVec3.z));
	}
}
