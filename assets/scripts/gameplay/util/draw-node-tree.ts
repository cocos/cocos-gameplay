import { _decorator, Node, Component, Quat, Vec3 } from 'cc';
import { debug, DrawType } from '../../../lib/cocos-utils/draw';
import MathUtil from './math-util';
const { ccclass, property, type, executeInEditMode } = _decorator;

let _tempVec3: Vec3 = new Vec3;
let _tempQuat: Quat = new Quat;

@ccclass('DrawNodeTree')
@executeInEditMode
export class DrawNodeTree extends Component {
    @property
    hideSubTree = true;

    start () {

    }

    update () {
        this.drawTree(this.node);
    }

    drawTree (rootNode: Node) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        let children = rootNode.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];

            // Don't draw sub tree when it's hidden
            if (!child.active) {
                if (!this.hideSubTree) {
                    this.drawTree(child);
                }
                continue;
            }
            
            // Caculation line's rotation and position
            let length = MathUtil.getWorldLine(rootNode, child, _tempQuat, _tempVec3);
            if (length > 0.001) {
                Quat.rotateX(_tempQuat, _tempQuat, Math.PI / 2);
                drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
                
                drawer.cylinder(
                    0.001, // cylinder's top radius
                    0.01, // cylinder's bottom radius
                    length // cylinder's height
                );
            }
            this.drawTree(child);
        }
    }
}