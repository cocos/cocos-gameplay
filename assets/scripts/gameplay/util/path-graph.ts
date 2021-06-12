import { _decorator, Node, Component, Quat, Vec3, Color } from 'cc';
import { EDITOR } from 'cc/env';
import { debug, DrawType } from '../../../lib/cocos-utils/draw';
import MathUtil from './math-util';
import { PathPoint } from './path-point';
const { ccclass, property, type, executeInEditMode } = _decorator;

let _tempVec3: Vec3 = new Vec3;
let _tempQuat: Quat = new Quat;
let _pathInfo: {path: PathPoint[] | null, distance: number, begin: PathPoint | null} = {path: null, distance: 0, begin: null};
let _shortPathInfo: {path: PathPoint[] | null, begin: PathPoint | null} = {path: null, begin: null};
let _emptyPath:  PathPoint[] = [];

@ccclass('PathGraph')
@executeInEditMode
export class PathGraph extends Component {
    public pointNodes: Node[] = [];
    public points: PathPoint[] = [];

    start () {

        let children = this.node.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let pointComp = child.getComponent(PathPoint);
            if (!pointComp) {
                pointComp = child.addComponent(PathPoint);
            }
            this.pointNodes.push(child);
            this.points.push(pointComp);
        }

        // if (EDITOR) {

            for (let i = 0; i < this.points.length; i++) {
                let point = this.points[i];
                point.rebuildPath(this.pointNodes);
            }

            for (let i = 0; i < this.points.length; i++) {
                let point = this.points[i];
                point.updatePath();
            }

        // }
    }

    getPath (begin: Node, end: Node) {
        let beginPoint = begin.getComponent(PathPoint);
        let endPoint = end.getComponent(PathPoint);

        _pathInfo.path = null;
        _pathInfo.distance = 0;

        if (!beginPoint || !endPoint) return _pathInfo;

        if (begin == end) {
            _pathInfo.path = _emptyPath;
            _pathInfo.distance = 0;
            _pathInfo.begin = beginPoint;
            return _pathInfo;    
        }

        let path = beginPoint.paths.get(endPoint) || null;
        _pathInfo.path = path;
        _pathInfo.distance = beginPoint.pathsDistance.get(endPoint) || 0;
        _pathInfo.begin = beginPoint;
        return _pathInfo;
    }

    update () {
        // if (EDITOR) {
        //     this.drawPaths();
        // }
    }

    getShortPath (begins: Node[], end: Node) {
        let path: PathPoint[] | null = null;
        let distance = Number.MAX_VALUE;
        let selectBegin: PathPoint | null = null;

        for(let i = 0; i < begins.length; i++) {
            let begin = begins[i];
            let pathInfo = this.getPath(begin, end);
            if (pathInfo.path && pathInfo.distance < distance) {
                path = pathInfo.path;
                distance = pathInfo.distance;
                selectBegin = pathInfo.begin;
            }
        }

        _shortPathInfo.path = path;
        _shortPathInfo.begin = selectBegin;
        return _shortPathInfo;
    }

    drawPath (begin: Node, end: Node) {
        let beginPoint = begin.getComponent(PathPoint);
        if (!beginPoint) return;
        beginPoint.drawPath(end);
    }

    drawPaths () {
        let drawer = debug.drawer;
        drawer.type = DrawType.Solid;

        for (let i = 0; i < this.pointNodes.length; i++) {
            let beginPoint = this.pointNodes[i];

            beginPoint.getWorldPosition(_tempVec3);
            beginPoint.getWorldRotation(_tempQuat);
            drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
            drawer.frameWireColor.set(0, 0, 255, 255);
            drawer.sphere(0.5);

            let ways = this.points[i].ways;
            for (let j = 0; j < ways.length; j++) {
                let endPoint = ways[j];
                let length = MathUtil.getWorldLine(beginPoint, endPoint, _tempQuat, _tempVec3);
                if (length > 0.001) {
                    Quat.rotateX(_tempQuat, _tempQuat, 1.57);
                    drawer.matrix.fromRTS(_tempQuat, _tempVec3, Vec3.ONE);
                    drawer.frameWireColor.set(255, 0, 0, 255);
                    drawer.cylinder(
                        0.2,
                        0.4,
                        length
                    );
                }
            }
        }
    }
}