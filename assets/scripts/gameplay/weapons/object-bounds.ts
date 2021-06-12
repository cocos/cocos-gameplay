import { _decorator, Component, ccenum, Vec3, ColliderComponent, ICollisionEvent } from 'cc';
const { ccclass, property, type } = _decorator;
import CharacterHealth from '../character-abilities/character-health';

enum WaysToDetermineBounds {
	Unknow, Collider, Collider2D, Renderer
};
ccenum(WaysToDetermineBounds);

@ccclass("ObjectBounds")
export default class ObjectBounds extends Component{

    @property
    needDestroy = true;

	start () {
		let collider = this.getComponent(ColliderComponent);
        if (collider) {
            collider.on('onCollisionEnter', this.onCollision, this);
            collider.on('onCollisionStay', this.onCollision, this);
            collider.on('onCollisionExit', this.onCollision, this);
        }
	}

	onCollision (event: ICollisionEvent) {
        if (this.needDestroy) {
            this.node.active = false;
        }
        if (!event.otherCollider) return;
        let characterHealth = event.otherCollider.getComponent(CharacterHealth);
        if (characterHealth) {
        	characterHealth.onDamage(1);
        }
    }
};