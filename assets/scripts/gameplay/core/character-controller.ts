import { _decorator, Component, Node, Vec3, RigidBody, physics } from 'cc';
const { ccclass, property } = _decorator;

let _tempVec3 = new Vec3;
let _tempVec3_2 = new Vec3;

@ccclass('CharacterController')
export default class CharacterController extends Component {
    protected _rigidBody: RigidBody | null = null;
    protected _velocity: Vec3 = new Vec3;
    protected _angularVelocity: Vec3 = new Vec3;

    start () {
        // move by physics engine
        // this._rigidBody = this.getComponent(RigidBody);
    }

    update (dt: number) {
        this.handleMovement(dt);
    }

    setLinearVelocity (velocity: Vec3) {
        if (this._rigidBody) {
            this._rigidBody.setLinearVelocity(velocity);
        } else {
            Vec3.copy(this._velocity, velocity);
        }
    }

    setAngularVelocity (velocity: Vec3) {
        if (this._rigidBody) {
            this._rigidBody.setAngularVelocity(velocity);
        } else {
            Vec3.copy(this._angularVelocity, velocity);
        }
    }

    handleMovement (dt: number) {
        if (this._rigidBody) return;
        Vec3.copy(_tempVec3, this.node.position);
        Vec3.multiplyScalar(_tempVec3_2, this._velocity, dt);
        _tempVec3.add(_tempVec3_2);
        this.node.setPosition(_tempVec3);
    }
}
