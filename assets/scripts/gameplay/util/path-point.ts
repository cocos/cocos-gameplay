import { _decorator, Node, Component, Vec3, Quat } from 'cc';
import MathUtil from './math-util';
import { EDITOR } from 'cc/env';
import { ColliderGroup } from '../scene/define';
import { debug, DrawType } from '../../../lib/cocos-utils/draw';
const { ccclass, property, executeInEditMode } = _decorator;

let _tempVec3: Vec3 = new Vec3;
let _tempQuat: Quat = new Quat;

@ccclass('PathPoint')
@executeInEditMode
export class PathPoint extends Component {
    @property({type:[Node]})
    ways: Node[] = [];

    @property({type:Vec3})
    randomRange: Vec3 = new Vec3;

    @property
    yDistanceRange = 1.5;

    @property
    byManual = false;

    public wayPoints: PathPoint[] = [];
    public distances: number[] = [];

    public paths: Map<PathPoint, PathPoint[]> = new Map();
    public pathsDistance: Map<PathPoint, number> = new Map();

    @property({type: Node, serializable: true})
    _targetPoint: Node | null = null;

    @property({type: Node})
    set targetPoint (value: Node | null) {
        this._targetPoint = value;
        this.drawPath(this._targetPoint);
    }

    get targetPoint (): Node | null {
        return this._targetPoint;
    }

    onLoad () {
        if (super.onLoad) {
            super.onLoad();
        }

        this.initPath();
    }

    start ()  {
        this.updatePath();
    }

    rebuildPath (allPoints: Node[]) {
        if (this.byManual) return;
        
        if (!EDITOR) {
            let configWays = this.ways.concat();
            MathUtil.getFieldViewPoint(allPoints, this.node, this.ways, ColliderGroup.PathPointAim, null, this.yDistanceRange);
            for (let i  = 0; i < configWays.length; i++) {
                let configWay = configWays[i];
                if (this.ways.indexOf(configWay) == -1) {
                    this.ways.push(configWay);
                }
            }
            this.initPath();
        }
    }

    initPath () {
        this.distances.length = 0;
        this.wayPoints.length = 0;

        for (let i = 0; i < this.ways.length; i++) {
            let wayNode = this.ways[i];
            let pathPoint = wayNode.getComponent(PathPoint);
            if (pathPoint) {
                this.wayPoints.push(pathPoint);
                let dis = MathUtil.distance(this.node, wayNode);
                this.distances.push(dis);
            }
        }
    }

    updatePath () {
        this.paths.clear();
        this.pathsDistance.clear();

        for (let i = 0; i < this.wayPoints.length; i++) {
            let targetPoint = this.wayPoints[i];
            let path = [targetPoint];
            this.paths.set(targetPoint, path);
            this.pathsDistance.set(targetPoint, this.distances[i]);
            this.searchPath(targetPoint, path, this.distances[i]);
        }
    }

    searchPath (currentPoint: PathPoint, currentPath: PathPoint[], distance: number) {
        let wayPoints = currentPoint.wayPoints;
        let distances = currentPoint.distances;

        for (let i = 0; i < wayPoints.length; i++) {
            let targetPoint = wayPoints[i];
            let newDistance = distances[i] + distance;

            if (targetPoint == this) continue;

            let oldDistance = this.pathsDistance.get(targetPoint);
            if (oldDistance == undefined || oldDistance > newDistance) {
                let path = currentPath.slice();
                path.push(targetPoint);
                this.paths.set(targetPoint, path);
                this.pathsDistance.set(targetPoint, newDistance);
                this.searchPath(targetPoint, path, newDistance);
            }
        }
    }

    update () {
        this.drawPath(this._targetPoint);
    }

    drawPath (targetPoint: Node | null) {
        if (!targetPoint) return;

        let point = targetPoint.getComponent(PathPoint);
        if (!point) return;

        let paths = this.paths.get(point);
        if (!paths) return;

        let drawer = debug.drawer;
        drawer.type = DrawType.FrameWire;

        let beginPoint = this.node;
        for (let i = 0; i < paths.length; i++) {
            let endPoint = paths[i].node;

            let length = MathUtil.getWorldLine(beginPoint, endPoint, _tempQuat, _tempVec3);
            if (length > 0.001) {
                Quat.rotateX(_tempQuat, _tempQuat, 1.57);
                drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
                drawer.frameWireColor.set(0, 255, 0, 255);
                drawer.cylinder(
                    0.1,
                    0.1,
                    length
                );
            }
            
            beginPoint = endPoint;
        }
    }

    getRandomPosition (out: Vec3) {
        let x = (Math.random() * 2 - 1) * this.randomRange.x;
        let y = (Math.random() * 2 - 1) * this.randomRange.y;
        let z = (Math.random() * 2 - 1) * this.randomRange.z;
        this.node.getWorldPosition(out);
        out.x += x;
        out.y += y;
        out.z += z;
    }
}