import { _decorator, Node, Component, Quat, Vec3, Material, MeshRenderer, BoxCollider, RigidBody, physics, SkinnedMeshRenderer, geometry, PhysicsMaterial, ColliderComponent, warn, Mesh } from 'cc';
import { ColliderGroup } from '../scene/define';
import { AutoHandlePhysics } from './auto-handle-physics';
const { ccclass, property, type, executeInEditMode } = _decorator;

let _tempVec3 = new Vec3;
let _tempQuat = new Quat;
let _tempVec3_2 = new Vec3;

@ccclass('AutoHandleScene')
@executeInEditMode
export class AutoHandleScene extends AutoHandlePhysics {
    @property({serializable: true})
    _showHuman = true;

    @property
    set showHuman (value: boolean) {
        this._showHuman = value;
        this.handleVisiable();
    }

    get showHuman () {
        return this._showHuman;
    }

    @property({serializable: true})
    _showGun = true;

    @property
    set showGun (value: boolean) {
        this._showGun = value;
        this.handleVisiable();
    }

    get showGun () {
        return this._showGun;
    }

    @property({serializable: true})
    _showCar = false;

    @property
    set showCar (value: boolean) {
        this._showCar = value;
        this.handleVisiable();
    }

    get showCar () {
        return this._showCar;
    }

    @property
    wallMinHeight = 0.7;

    completeMatchWall = ["SM_Building02_109", "SM_Building02_20", "SM_Building02_31", "SM_Building02_30", "SM_Building02_54", "SM_MetalBeam06_130", "SM_MetalBeam7", "SM_MetalBeam104", "SM_MetalBeam105", "SM_MetalBeam9", "SM_MetalBeam104", "SM_MetalBeam103_1345", "SM_WallTrim16", "SM_WallTrim15_84", "SM_CornerBuilding01_151", "SM_WallTrim25", "SM_WallTrim20", "SM_CornerBuilding01_1594", "SM_CornerBuilding01_1595", "SM_Platform_6", "SM_Platform_937", "SM_CornerBuilding01_10", "SM_PillarWithBreckets_313", "SM_CornerBuilding01_239", "SM_CornerBuilding01_210", "SM_CornerBuilding01_70", "Whitebox_Object008_384", "Whitebox_Shape010_506", "Whitebox_Shape002_496", "Whitebox_Shape041_564", "Whitebox_Shape003_498", "SM_CornerBuilding01_259", "SM_CornerBuilding01_153", "SM_CornerBuilding01_97", "SM_CornerBuilding01_287", "Whitebox_Shape013_512", "Whitebox_Shape013_512", "SM_MetalBeam10", "SM_CornerBuilding01_263", "SM_CornerBuilding01_231", "SM_CornerBuilding01_268", "SM_CornerBuilding01_233", "SM_Pipe67", "SM_Pipe68", "SM_CornerBuilding01_216", "SM_CornerBuilding01_212", "SM_Building02_45", "SM_Building02_168", "SM_Fence_332", "SM_Fence_21", "SM_Fence_19", "SM_Fence_17", "SM_Fence_15", "SM_Fence_14", "SM_Fence_13", "SM_CornerBuilding01_2", "SM_CornerBuilding01_124", "SM_CornerBuilding01_123", "SM_GasStat_Column12", "SM_CornerBuilding01_129", "SM_CornerBuilding01_46"];
    likeMatchWall = ["Box", "box"];
    completeMatchGround = ["SM_Building02_93", "SM_Building02_95", "SM_Building02_97", "SM_Building02_79", "SM_Building02_80", "SM_Building02_84", "SM_Building02_83", "SM_Building02_85", "SM_PlatformGrill_1050", "SM_PlatformGrill_14", "SM_PlatformGrill_15", "SM_PlatformGrill_16", "SM_PlatformGrill_17", "SM_CornerBuilding01_79", "SM_CornerBuilding01_292"];
    likeMatchGround = ["SM_GroundDetail", "SM_Ground", "SM_Pavement", "SM_Floor"];
    exceptGeometry = ["Whitebox"];

    likeHuman = ["Man", "Hero", "SM_CyborgEnemy"];
    likeGun = ["gun"];
    likeCar = ["Car", "car"];

    isInList (checkName: string, list: string[]) {
        for (let i = 0, c = list.length; i < c; i++) {
            if (checkName.indexOf(list[i]) != -1) {
                return true;
            }
        }
        return false;
    }

    handleVisiable (node: Node | null = null) {
        node = node || this._exportRootNode;
        if (!node) {
            warn("handleVisiable export root node is empty");
            return;
        }

        let name = node.name;
        let isMan = this.isInList(name, this.likeHuman);

        if (isMan) {
            node.active = this._showHuman;
        }

        let isGun = this.isInList(name, this.likeGun);
        if (isGun) {
            node.active = this._showGun;
        }

        let isCar = this.isInList(name, this.likeCar);
        if (isCar) {
            node.active = this._showCar;
        }

        let collider = node.getComponent(ColliderComponent);
        if (collider) {
            collider.destroy();
            collider = null;
        }

        let rigidbody = node.getComponent(RigidBody);
        if (rigidbody) {
            rigidbody.destroy();
            rigidbody = null;
        }

        let children = node.children;
        for (let i = 0, c = children.length; i < c; i++) {
            this.handleVisiable(children[i]);
        }
    }
    
    public getBoundingBox(component: any) {
        let boundingBox = null;
        if (component instanceof MeshRenderer) {
            if (component instanceof SkinnedMeshRenderer) {
                boundingBox = component.model && component.model.worldBounds;
            } else {
                boundingBox = component.model && component.model.modelBounds;
                if (!boundingBox) {
                    const mesh = component.mesh;
                    if (mesh && mesh.struct.minPosition && mesh.struct.maxPosition) {
                        boundingBox = geometry.AABB.fromPoints(geometry.AABB.create(), mesh.struct.minPosition, mesh.struct.maxPosition);
                    }
                }
            }
        } else {
            console.error('target is not a cc.MeshRenderer');
        }

        return boundingBox;
    }

    _needCollider (name: string, height: number) {
        let isWall = this.completeMatchWall.indexOf(name) != -1;
        if (isWall) return ColliderGroup.Wall;

        let isGround = this.completeMatchGround.indexOf(name) != -1;
        if (isGround) return ColliderGroup.Ground;

        for (let i = 0, c = this.exceptGeometry.length; i < c; i++) {
            if (name.indexOf(this.exceptGeometry[i]) != -1) {
                return -1;
            }
        }

        for (let i = 0, c = this.likeMatchWall.length; i < c; i++) {
            if (name.indexOf(this.likeMatchWall[i]) != -1 ) {
                return ColliderGroup.Wall;
            }
        }

        for (let i = 0, c = this.likeMatchGround.length; i < c; i++) {
            if (name.indexOf(this.likeMatchGround[i]) != -1 ) {
                if (height > this.wallMinHeight) return ColliderGroup.Wall;
                return ColliderGroup.Ground;
            }
        }
        return -1;
    }

    @property({type: Mesh})
    mesh: Mesh | null = null;

    @property({serializable: true})
    _exportRootNode : Node | null = null;

    @property({type: Node})
    set exportRootNode (value : Node | null) {
        this._exportRootNode = value;
        this.node.removeAllChildren();
        this.handleVisiable();
        this.handleCollider();
        this.handlePhysics();
    }

    get exportRootNode () {
        return this._exportRootNode;
    }

    handleCollider (exportNode: Node | null = null) {
        exportNode = exportNode || this._exportRootNode;
        if (!exportNode) {
            warn("export node is empty");
            return;
        }

        let name = exportNode.name;
        if (name == "SM_Building02_109") { 
            let isStair = name.indexOf("Stair") != -1;
            isStair = isStair || name.indexOf("ladder") != -1;

            let meshRenderer = exportNode.getComponent(MeshRenderer);
            let xIsY = Math.abs(exportNode.eulerAngles.z) > 50;
            let zIsY = Math.abs(exportNode.eulerAngles.x) > 50;

            if (!isStair && meshRenderer) {
                let boundingBox = this.getBoundingBox(meshRenderer);
                let size = new Vec3();

                Vec3.multiplyScalar(size, boundingBox!.halfExtents, 2);
                let center = new Vec3(boundingBox!.center.x, boundingBox!.center.y, boundingBox!.center.z);
                if (xIsY) {
                    Vec3.set(_tempVec3, size.y, size.x, size.z);
                } else if (zIsY){
                    Vec3.set(_tempVec3, size.x, size.z, size.y);
                } else {
                    Vec3.set(_tempVec3, size.x, size.y, size.z);
                }

                let isWall = false;

                // auto test ground or wall
                // let yScale = _tempVec3.y * 10;
                // if ((_tempVec3.x > yScale && _tempVec3.z > yScale) && _tempVec3.y < this.wallMinHeight) {
                //     isWall = false;
                // } else {
                //     isWall = true;
                // }

                let groupType = this._needCollider(name, _tempVec3.y);
                switch (groupType) {
                    case ColliderGroup.Wall:
                        isWall = true;
                        break;
                    case ColliderGroup.Ground:
                        isWall = false;
                        break;
                }

                let needCollider = groupType != -1;
                if (needCollider) {
                    let logicNode = new Node(name);
                    logicNode.parent = this.node;
                    exportNode.getWorldPosition(_tempVec3);
                    exportNode.getWorldRotation(_tempQuat);
                    exportNode.getWorldScale(_tempVec3_2);

                    logicNode.setWorldPosition(_tempVec3);
                    logicNode.setWorldRotation(_tempQuat);
                    logicNode.setWorldScale(_tempVec3_2);

                    logicNode.getScale(_tempVec3);
                    let xSign = Math.sign(_tempVec3_2.x);
                    _tempVec3.x *= xSign;
                    
                    logicNode.setScale(_tempVec3);
                    
                    let meshNode = new Node(name);
                    meshNode.parent = logicNode;
                    let meshRenderer = meshNode.addComponent(MeshRenderer);
                    meshRenderer.mesh = this.mesh;
                    meshNode.setScale(size);
                    meshNode.setPosition(center);

                    let collider =  logicNode.addComponent(BoxCollider);
                    let rigidbody = logicNode.addComponent(RigidBody);

                    collider.center = center;
                    collider.size = size;

                    if (isWall) {
                        rigidbody.group = ColliderGroup.Wall;
                    } else {
                        rigidbody.group = ColliderGroup.Ground;
                    }
                    rigidbody.type = physics.ERigidBodyType.STATIC;
                }
            }
        }

        let children = exportNode.children;
        for (let i = 0, c = children.length; i < c; i++) {
            this.handleCollider(children[i]);
        }
    }
}