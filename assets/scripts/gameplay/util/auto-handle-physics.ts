import { _decorator, Component, Node, MeshRenderer, ColliderComponent, PhysicsMaterial, RigidBody, physics, Material } from 'cc';
import { ColliderGroup } from '../scene/define';
const { ccclass, property, type, executeInEditMode } = _decorator;

@ccclass('AutoHandlePhysics')
@executeInEditMode
export class AutoHandlePhysics extends Component {
    @property({type: Material})
    groundRenderMaterial: Material | null = null;

    @property({type: Material})
    wallRenderMaterial: Material | null = null;

    @property({type: Material})
    slopeRenderMaterial: Material | null = null;

    @property({type: Material})
    defaultRenderMaterial: Material | null = null;

    @property({serializable: true})
    _physicsMaterial: PhysicsMaterial | null = null;

    @property({type: PhysicsMaterial})
    set physicsMaterial (value: PhysicsMaterial | null) {
        this._physicsMaterial = value;
        this.handlePhysics();
    }

    get physicsMaterial (): PhysicsMaterial | null {
        return this._physicsMaterial;
    }

    handlePhysics (node: Node | null = null, parentGroup: number = -1) {
        node = node || this.node;

        let collider = node.getComponent(ColliderComponent);
        let rigidBody = node.getComponent(RigidBody);
        let currentGroup = -1;

        if (collider && rigidBody) {
            currentGroup = rigidBody.group;

            if (rigidBody.group == ColliderGroup.Wall) {
                collider.material = this._physicsMaterial;
            } else {
                collider.material = null;
            }
        } else {
            currentGroup = parentGroup; 
        }

        let meshRenderer = node.getComponent(MeshRenderer);
        if (meshRenderer) {
            switch (currentGroup) {
                case ColliderGroup.Wall:
                    meshRenderer.setMaterial(this.wallRenderMaterial, 0);
                    break;
                case ColliderGroup.Ground:
                    meshRenderer.setMaterial(this.groundRenderMaterial, 0);
                    break;
                case ColliderGroup.Bevel:
                    meshRenderer.setMaterial(this.slopeRenderMaterial, 0);
                    break;
                default:
                    meshRenderer.setMaterial(this.defaultRenderMaterial, 0);
                    break;
            }
        }

        let children = node.children;
        for (let i = 0, c = children.length; i < c; i++) {
            this.handlePhysics(children[i], currentGroup);
        }
    }


}