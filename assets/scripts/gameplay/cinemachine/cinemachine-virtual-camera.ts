import { _decorator, Component, Node, Vec3, Quat, lerp, geometry, PhysicsSystem, ColliderComponent } from 'cc';
const { ccclass, property, type } = _decorator;
import { ColliderGroup } from '../scene/define'
import FadeHandle from '../scene/fade-handle';
import MathUtil from '../util/math-util';

let _tempQuat: Quat = new Quat;
let _tempVec3: Vec3 = new Vec3;
let _tempVec3_2: Vec3 = new Vec3;
let _forward: Vec3 = new Vec3(0, 0, 1);
let _right: Vec3 = new Vec3(1, 0, 0);
let _up: Vec3 = new Vec3(0, 1, 0);

@ccclass('CinemachineVirtualCamera')
export default class CinemachineVirtualCamera extends Component {

    _follow: Node | null = null;
	@type(Node)
	set follow (value: Node | null) {
        this._follow = value;
        if (!this._follow) return;

        this._follow.getWorldPosition(_tempVec3);
        Vec3.copy(this._followPosition, _tempVec3);

        this.node.getWorldPosition(_tempVec3_2);
        _tempVec3.subtract(_tempVec3_2);

        this.targetRadius = _tempVec3.length();
        this._followRadius = this.targetRadius;
    }

    @property({type: Vec3})
    lookOffset: Vec3 = new Vec3;

    @property({type: Vec3})
    targetOffset: Vec3 = new Vec3;

    @property
    rotateSpeed = 7;
    @property
    followSpeed = 5;
    @property
    radiusSpeed = 5;
    @property
    closeEndRadius = 0;
    @property
    closeBeginRadius = 5;
    @property({type:Node})
    followFadeNode: Node | null = null;

    @property
    adjustRadiusWhenOcclusion: boolean = false;

    @property
    fadeWhenOcclusion: boolean = true;

    @property
    fadeWhenTooClose: boolean = true;

    public targetRotation: Vec3 = new Vec3;

    protected _targetRadius: number = 0;
    protected _originRadius: number = 0;
    public set targetRadius(value: number) {
        // forbit scroll far away when occlusion by wall, but can scroll near to target
        if (this._occlusionRadius > 0 && this._occlusionRadius < value) {
            // next time value must little than occlusion radius
            if (value < this._originRadius) {
                this._originRadius = this._occlusionRadius - (this._originRadius - value);
                return;
            }
            return;
        }
        this._originRadius = value;
    }

    public get targetRadius() {
        return this._originRadius;
    }

	protected _offsetVec: Vec3 = new Vec3;
    protected _followPosition: Vec3 = new Vec3;
    protected _followRotation: Quat = new Quat;
    protected _followRadius: number = 0;
    protected _occlusionRadius: number = -1;
    protected _ray: geometry.Ray = new geometry.Ray;
    protected _hitCollider: ColliderComponent | null = null;

    public worldRight: Vec3 = new Vec3;
    public worldUp: Vec3 = new Vec3;
    public worldDirection: Vec3 = new Vec3;

    start () {
        this.node.getWorldRotation(this._followRotation);
        Quat.toEuler(this.targetRotation, this._followRotation);
    }

    sync (other: CinemachineVirtualCamera | null, syncRadius: boolean) {
        if (!other) return;

        let otherNode = other.node;
        otherNode.getWorldPosition(_tempVec3);
        otherNode.getWorldRotation(_tempQuat);

        this.node.setWorldPosition(_tempVec3);
        this.node.setWorldRotation(_tempQuat);

        Vec3.copy(this.targetRotation, other.targetRotation);
        Vec3.copy(this._followPosition, other._followPosition);
        Vec3.copy(this._followRotation, other._followRotation);
        
        this._followRadius = other._followRadius;
        
        if (syncRadius) {
            this._originRadius = other._originRadius;
            this._targetRadius = other._targetRadius;
            this._occlusionRadius = other._occlusionRadius;
        }
    }

    open () {
        if (this.node) {
            this.node.active = true;
        }
    }

    close () {
        if (this.node) {
            this.node.active = false;
        }
    }

    process (dt: number) {
    	if (!this._follow) return;

        // get target node position with local offset
        this._follow.getPosition(_tempVec3_2);
        Vec3.add(_tempVec3, _tempVec3_2, this.targetOffset);
        this._follow.setPosition(_tempVec3);
        this._follow.getWorldPosition(_tempVec3);

        this._follow.setPosition(_tempVec3_2);

        // calculate target world position
        this.handleIfSightOcclusion(_tempVec3);
        Vec3.lerp(this._followPosition, this._followPosition, _tempVec3, MathUtil.clamp01(dt * this.followSpeed));

        // cacluate target world rotation
        Quat.fromEuler(_tempQuat, this.targetRotation.x, this.targetRotation.y, this.targetRotation.z);
        Quat.slerp(this._followRotation, this._followRotation, _tempQuat, MathUtil.clamp01(dt * this.rotateSpeed));

        this._followRadius = lerp(this._followRadius, this._targetRadius, MathUtil.clamp01(dt * this.radiusSpeed));

        if (this.fadeWhenTooClose && this.followFadeNode) {
            if (this._followRadius < this.closeEndRadius) {
                this.followFadeNode.emit(FadeHandle.Fade, 0);
            } else if (this._followRadius > this.closeBeginRadius) {
                this.followFadeNode.emit(FadeHandle.Recover);
            } else {
                let fadeFactor = (this._followRadius - this.closeEndRadius) / this.closeBeginRadius;
                this.followFadeNode.emit(FadeHandle.Fade, fadeFactor);
            }
        }

        Vec3.transformQuat(this.worldRight, _right, this._followRotation);
        Vec3.transformQuat(this.worldUp, _up, this._followRotation);
        Vec3.transformQuat(this.worldDirection, _forward, this._followRotation);

        // calculate target in look direction offset
        Vec3.multiplyScalar(_tempVec3_2, this.worldDirection, this.lookOffset.z);
        Vec3.copy(_tempVec3, _tempVec3_2);

        Vec3.multiplyScalar(_tempVec3_2, this.worldRight, this.lookOffset.x);
        _tempVec3.add(_tempVec3_2);

        Vec3.multiplyScalar(_tempVec3_2, this.worldUp, this.lookOffset.y);
        _tempVec3.add(_tempVec3_2);
        
        // offset target world position
        _tempVec3.add(this._followPosition);
        Vec3.copy(_tempVec3_2, _tempVec3);

        // move with radius
        Vec3.multiplyScalar(_tempVec3, this.worldDirection, this._followRadius);
        _tempVec3.add(_tempVec3_2);

        this.node.setWorldPosition(_tempVec3);
        
        // look at target
        this.node.lookAt(_tempVec3_2);
    }

    handleIfSightOcclusion (followWorldPosition: Vec3) {
        let curWorldPosition = this.node.getWorldPosition();

        Vec3.subtract(_tempVec3_2, curWorldPosition, followWorldPosition);
        _tempVec3_2.normalize();
        geometry.Ray.set(this._ray, 
            followWorldPosition.x, followWorldPosition.y, followWorldPosition.z,
            _tempVec3_2.x, _tempVec3_2.y, _tempVec3_2.z);
        let hasHit = PhysicsSystem.instance.raycastClosest(this._ray, ColliderGroup.CameraAim);
        if (!hasHit) {
            this.sightVisible();
            return;
        }

        let hitResult = PhysicsSystem.instance.raycastClosestResult;
        let hitGround = hitResult.collider.getGroup();
        if (hitGround != ColliderGroup.Wall && hitGround != ColliderGroup.Ground) {
            this.sightVisible();
            return;
        }

        Vec3.subtract(_tempVec3_2, followWorldPosition, hitResult.hitPoint);
        this.sightOcclusion(_tempVec3_2.length(), hitResult.collider);
    }

    sightOcclusion (newRadius: number, hitCollider: ColliderComponent) {
        if (this.adjustRadiusWhenOcclusion) {
            this._occlusionRadius = newRadius;
            if (this._originRadius > newRadius) {
                this._targetRadius = newRadius;
            } else {
                this._targetRadius = this._originRadius;
            }
            if (this._followRadius > newRadius) {
                this._followRadius = this._targetRadius;
            }
        } else {
            this._occlusionRadius = -1;
            this._targetRadius = this._originRadius;    
        }
        
        if (this._hitCollider) {
            this._hitCollider.node.emit(FadeHandle.Recover);
            this._hitCollider = null;
        }

        if (this.fadeWhenOcclusion) {
            this._hitCollider = hitCollider;
            this._hitCollider.node.emit(FadeHandle.Fade);
        }
    }

    sightVisible () {
        this._targetRadius = this._originRadius;
        this._occlusionRadius = -1;

        if (this.fadeWhenOcclusion) {
            if (this._hitCollider) {
                this._hitCollider.node.emit(FadeHandle.Recover);
                this._hitCollider = null;
            }
        }
    }
}
