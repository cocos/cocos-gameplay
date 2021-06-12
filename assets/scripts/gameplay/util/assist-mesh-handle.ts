import { _decorator, Component, Node, MeshRenderer, ColliderComponent } from 'cc';
const { ccclass, property, type, executeInEditMode } = _decorator;

@ccclass('AssistMeshHandle')
@executeInEditMode
export class AssistMeshHandle extends Component {
    @property({serializable: true})
    _showMesh = true;

    @property
    set showMesh (value: boolean) {
        this._showMesh = value;
        this.handleMesh();
    }

    get showMesh () {
        return this._showMesh;
    }

    start () {
        this.handleMesh();
    }

    handleMesh (node: Node | null = null) {
        node = node || this.node;

        let meshRenderer = node.getComponent(MeshRenderer)
        if (meshRenderer) {
            meshRenderer.enabled = this._showMesh;
        }

        let children = node.children;
        for (let i = 0, c = children.length; i < c; i++) {
            this.handleMesh(children[i]);
        }
    }
}