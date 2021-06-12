import { _decorator, Node, Component, Skeleton, Mat4 } from 'cc';
const { ccclass, property, type, executeInEditMode } = _decorator;

let _tempMat = new Mat4();

@ccclass('GenerateBoneNode')
@executeInEditMode
export default class GenerateBoneNode extends Component {
    @property({serializable: true})
    _skeleton: Skeleton | null = null;

    @property({type: Skeleton})
    set skeleton (value: Skeleton | null) {
        this._skeleton = value;
        this.generateBone(value);
    }

    get skeleton (): Skeleton | null {
        return this._skeleton;
    }

    generateBone (skel: Skeleton | null) {
        if (!skel) return;
        let joints = skel.joints;
        let bindposes = skel.bindposes;
        for (let i = 0, c = joints.length; i < c; i++) {
            this.generateNode(joints[i], bindposes[i]);
        }
    }

    generateNode (path: string, bindpose: Mat4) {
        let nodeNames = path.split("/");
        if (nodeNames.length == 0) return;

        let parent = this.node;

        for (let i = 0, c = nodeNames.length; i < c; i++) {
            let name = nodeNames[i];
            let childNode = parent.getChildByName(name);
            if (childNode) {
                parent = childNode;
                continue;
            }
            childNode = new Node(nodeNames[i]);
            childNode.parent = this.node;
            Mat4.invert(_tempMat, bindpose);
            childNode.matrix = _tempMat;
            childNode.updateWorldTransform();
            let worldPosition = childNode.worldPosition;
            let worldRotation = childNode.worldRotation;
            let worldScale = childNode.worldScale;

            childNode.parent = parent;
            childNode.setWorldPosition(worldPosition);
            childNode.setWorldRotation(worldRotation);
            childNode.setWorldScale(worldScale);
            parent = childNode;
        }
    }
}