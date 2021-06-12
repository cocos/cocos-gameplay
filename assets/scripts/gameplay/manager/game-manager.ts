import { _decorator, Component, Node, game, warn, Quat, Vec3, geometry, Camera, math, Mat4 } from 'cc';
import MathUtil from '../util/math-util';
import { PathGraph } from '../util/path-graph';
import { ColliderGroup } from '../scene/define';
import { debug, DrawType } from '../../../lib/cocos-utils/draw';
const { ccclass, property } = _decorator;

let _up = new Vec3(0, 1, 0);
let _tempVec3: Vec3 = new Vec3;
let _tempQuat: Quat = new Quat;
let _tempAABB: geometry.AABB = new geometry.AABB();
let _tempMat: Mat4 = new Mat4();

@ccclass('GameManager')
export class GameManager extends Component {
	public static instance: GameManager;

    @property({type: PathGraph})
    pathGraph: PathGraph | null = null;

    public mainCamera: Camera | null = null;
    public skillLayer: Node = new Node;
    public targetAI: Node | null = null;
    public targetAIDistance = Number.MIN_VALUE;
    public currentFrustum: geometry.Frustum = new geometry.Frustum;

    protected _targets: Map<Node, boolean> = new Map();

    constructor () {
        super();
    	GameManager.instance = this;
    }

    start () {
        this.node.addChild(this.skillLayer);
        if (game.canvas) {
            game.canvas.style.cursor = 'none';
        }
    }

    hasTarget () {
        return this.targetAI && this.targetAI.isValid;
    }

    isTarget (ai: Node | null) {
        if (!ai) return false;
        return this._targets.has(ai);
    }

    process (dt: number) {
        this.targetAI = null;
        this.targetAIDistance = Number.MIN_VALUE;
        this._targets.clear();
    }

    updateTarget (ai: Node, distance: number, aabb: Readonly<geometry.AABB> | undefined) {
        if (aabb) {
            Vec3.copy(_tempAABB.center, aabb.center);
            Vec3.copy(_tempAABB.halfExtents, aabb.halfExtents);

            let result = geometry.intersect.aabbFrustum(_tempAABB, this.currentFrustum);
            if (!result) {
                return;
            }
        }

        this._targets.set(ai, true);

        if (!this.targetAI || !this.targetAI.isValid || distance < this.targetAIDistance) {
            this.targetAI = ai;
            this.targetAIDistance = distance;
        }
    }

    drawAABB (aabb: geometry.AABB) {
        this.drawPos(aabb.center);
    }

    // FIXME has some draw position issue
    drawFrustum (frustum: geometry.Frustum) {
        let planes = frustum.planes;
        for (let i = 0; i < planes.length; i++) {
            let plane = planes[i];
            this.drawPlane(plane);
        }
    }

    drawPlane (plane: geometry.Plane) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        let normal = new Vec3(plane.n);
        normal.normalize();
        let d = plane.d;
        Vec3.multiplyScalar(_tempVec3, normal, d);
        let center = new Vec3(_tempVec3);

        this.drawLineByPos(Vec3.ZERO, center);

        this.drawPos(center);

        Quat.rotationTo(_tempQuat, _up, normal);
        drawer.matrix.fromRTS(_tempQuat, center, Vec3.ONE);
        drawer.plane();
    }

    setFullscreen () {
        if (game.canvas) {
            game.canvas.requestFullscreen().catch(function () {
                warn("GameManager full screen failed");
            });
            game.canvas.requestPointerLock();
        }
    }

    getFieldViewPoint (targetNode: Node, resultPoints: Node[], pointMask = ColliderGroup.PathPointAim, resultPointsMap: Map<Node, boolean> | null = null, yEnoughDistance = 999999) {
        let pointNodes = this.pathGraph?.pointNodes;
        if (pointNodes) {
            MathUtil.getFieldViewPoint(pointNodes, targetNode, resultPoints, pointMask, resultPointsMap, yEnoughDistance);
        }
    }

    drawLines (begin: Node, ends: Node[]) {
        for (let i = 0, c = ends.length; i < c; i++) {
            GameManager.instance.drawLine(begin, ends[i]);
        }
    }

    drawLine (a: Node, b: Node) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        let length = MathUtil.getWorldLine(a, b, _tempQuat, _tempVec3);
        if (length > 0.001) {
            Quat.rotateX(_tempQuat, _tempQuat, 1.57);
            drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
            drawer.frameWireColor.set(255, 0, 255, 255);
            drawer.cylinder(
                0.01,
                0.01,
                length
            );
        }        
    }

    drawNode (node: Node) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        node.getWorldPosition(_tempVec3);
        node.getWorldRotation(_tempQuat);
        drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
        drawer.frameWireColor.set(0, 0, 255, 255);
        drawer.sphere(0.5);
    }

    drawPos (pos: Vec3) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        drawer.matrix.fromRTS(Quat.IDENTITY, pos, Vec3.ONE);
        drawer.frameWireColor.set(255, 255, 0, 255);
        drawer.sphere(0.2);
    }

    drawDirectionByPos (a: Vec3, b: Vec3, _r: number = 255, _g: number = 0, _b: number = 255, _a: number = 2) {
        let end = new Vec3;
        Vec3.add(end, a, b);
        this.drawLineByPos(a, end, _r, _g, _b, _a);
    }

    drawLineByPos (a: Vec3, b: Vec3, _r: number = 255, _g: number = 0, _b: number = 255, _a: number = 255) {
        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        let length = MathUtil.getWorldLineByPos(a, b, _tempQuat, _tempVec3);
        if (length > 0.001) {
            Quat.rotateX(_tempQuat, _tempQuat, 1.57);
            drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
            drawer.frameWireColor.set(_r, _g, _b, _a);
            drawer.cylinder(
                0.01,
                0.03,
                length
            );
        }
    }

    getPath (begin: Node, end: Node) {
        if (!this.pathGraph) return null;
        return this.pathGraph.getPath(begin, end);
    }

    getShortPath (begins: Node[], end: Node) {
        if (!this.pathGraph) return null;
        return this.pathGraph.getShortPath(begins, end);
    }

    drawPath (begin: Node, end: Node) {
        if (!this.pathGraph) return;
        this.pathGraph.drawPath(begin, end);
    }
}
