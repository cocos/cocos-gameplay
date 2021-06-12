import { _decorator, Component, Node, Vec3, log, warn, Camera, Quat, director } from 'cc';
const { ccclass, property} = _decorator;
import CinemachineVirtualCamera from './cinemachine-virtual-camera';
import Character from '../core/character';
import { GameEvent, GameEventType } from '../manager/event-manager';
import { ControlType, CameraRotateType } from '../scene/define';

let _tempVec3 = new Vec3;
let _tempQuat = new Quat;

@ccclass('CinemachineCameraController')
export default class CinemachineCameraController extends Component {
    @property({type: ControlType})
    controlType: ControlType = ControlType.None;

    @property
    rotateXEnable: boolean = false;

    @property
    rotateYEnable: boolean = false;

    @property
    scrollEnable: boolean = false;

    @property
    rotateFactor = 0.005;

    @property
    scrollFactor = 1;

    @property
    minXRotation = -80;

    @property
    maxXRotation = -10;

    @property
    minRadius = 0;

    @property
    maxRadius = 500;

    @property
    followCharacterIndex = 0;

	protected _virtualCamera: CinemachineVirtualCamera | null = null;

    protected _assistCameraNode: Node = new Node;

    protected _rotateType: CameraRotateType = CameraRotateType.None;
    get rotateType () {
        return this._rotateType;
    }
    set rotateType (value: CameraRotateType) {
        this._rotateType = value;
    }
    
	public targetCharacter: Character | null = null;

    constructor () {
        super();
        
        GameEvent.on(GameEventType.StartFollowing, this.onStartFollowing, this);
        GameEvent.on(GameEventType.SetTargetCharacter, this.onSetTargetCharacter, this);
    }

    start () {
        this._virtualCamera = this.getComponent(CinemachineVirtualCamera);
        this.startFollowing();
    }

    sync (other: CinemachineCameraController) {
        other.lateProcess(0);
        
        other._assistCameraNode.getWorldPosition(_tempVec3);
        other._assistCameraNode.setWorldRotation(_tempQuat);

        this._assistCameraNode.setWorldPosition(_tempVec3);
        this._assistCameraNode.setWorldRotation(_tempQuat);
    }

    rotateVirtualCamera () {
        let inputManager = this.targetCharacter?.linkedInputManager;
        if (!inputManager || !this._virtualCamera) return;

        let targetRotation = this._virtualCamera.targetRotation;
        let delta = inputManager.secondaryMovement;

        if (this.rotateXEnable) {
            targetRotation.y -= delta.x * this.rotateFactor;
        }
        
        if (this.rotateYEnable) {
            targetRotation.x -= delta.y * this.rotateFactor;
        }

        if (this.rotateXEnable || this.rotateYEnable) {
            this.limitRotation(targetRotation);
        }
        this._virtualCamera.targetRotation = targetRotation;
    }

    rotateCameraTarget () {
        let inputManager = this.targetCharacter?.linkedInputManager;
        if (!inputManager || !this._virtualCamera || !this.targetCharacter) return;

        let delta = inputManager.secondaryMovement;
        let cameraTargetRotator = this.targetCharacter.cameraTargetRotator;
        if (!cameraTargetRotator) return;

        Vec3.copy(_tempVec3, cameraTargetRotator.eulerAngles);

        if (this.rotateXEnable) {
            _tempVec3.y -= delta.x * this.rotateFactor;
        }

        if (this.rotateYEnable) {
            _tempVec3.x += delta.y * this.rotateFactor;
        }
        
        cameraTargetRotator!.setRotationFromEuler(_tempVec3);
    }

    rotateAssistNode () {
        // TODO
    }

    syncVirtualCameraToAssistNode () {
        if (!this._virtualCamera) return;

        let targetRotation = this._virtualCamera.targetRotation;
        this._assistCameraNode.getWorldRotation(_tempQuat);
        Quat.toEuler(targetRotation, _tempQuat);

        // virtual camera sync assist node transform 
        this._virtualCamera.targetRotation = targetRotation;
    }

    syncCameraTargetRotatorToRotatorFollow () {
        if (!this.targetCharacter) return;

        let cameraTargetRotator = this.targetCharacter.cameraTargetRotator;
        if (!cameraTargetRotator) return;

        let rotatorFollow = this.targetCharacter.rotatorFollow;
        if (this.rotateType == CameraRotateType.Drive) {
            rotatorFollow = this.targetCharacter.driveRotatorFollow;
        }
        if (!rotatorFollow) return;

        rotatorFollow.getWorldPosition(_tempVec3);
        rotatorFollow.getWorldRotation(_tempQuat);

        cameraTargetRotator.setWorldPosition(_tempVec3);
        cameraTargetRotator.setWorldRotation(_tempQuat);
    }

    syncCameraAssistNodeToVirtualCamera () {
        if (!this._virtualCamera) return;

        let cameraNode = this._virtualCamera.node;
        cameraNode.getWorldPosition(_tempVec3);
        cameraNode.getWorldRotation(_tempQuat);

        // sync assit node rotation and position
        this._assistCameraNode.setWorldRotation(_tempQuat);
        this._assistCameraNode.setWorldPosition(_tempVec3);
    }

    process (dt: number) {
        let inputManager = this.targetCharacter?.linkedInputManager;
        if (!inputManager) return;
        if (!this._virtualCamera) return;

        switch (this.rotateType) {
            case CameraRotateType.TopDown:
                this.syncCameraTargetRotatorToRotatorFollow();
                if (inputManager.touchEnable) {
                    this.rotateVirtualCamera();
                }
                break;
            case CameraRotateType.ThridPerson:
                this.syncCameraTargetRotatorToRotatorFollow();
                this.rotateVirtualCamera();
                break;
            case CameraRotateType.FirstPersonOrShoulderSurfing:
                this.rotateCameraTarget();
                this.syncVirtualCameraToAssistNode();
                break;
            case CameraRotateType.Drive:
                this.syncCameraTargetRotatorToRotatorFollow();
                if (inputManager.touchEnable) {
                    this.rotateAssistNode();
                }
                this.syncVirtualCameraToAssistNode();
                break;
        }

        if (this.scrollEnable) {
             let targetRadius = this._virtualCamera.targetRadius;
            targetRadius += this.scrollFactor * -Math.sign(inputManager.scroll.y);
            targetRadius = Math.min(this.maxRadius, Math.max(this.minRadius, targetRadius));
            this._virtualCamera.targetRadius = targetRadius;
        }
    }

    lateProcess (dt: number) {
        // only rotate virtual camera need to sync camera assit node
        switch (this.rotateType) {
            case CameraRotateType.TopDown:
            case CameraRotateType.ThridPerson:
                this.syncCameraAssistNodeToVirtualCamera();
                break;
        }
    }

    limitRotation (rotation: Vec3) {
        if (rotation.x < this.minXRotation) {
            rotation.x = this.minXRotation;
        } else if (rotation.x > this.maxXRotation) {
            rotation.x = this.maxXRotation
        }
        rotation.z = 0;
    }

    setTarget (character: Character | null) {
    	this.targetCharacter = character;
    }

    startFollowing () {
    	if (!this._virtualCamera) {
            return;
        }
        if (!this.targetCharacter) {
            return;
        }
        let cameraTarget = this.targetCharacter.cameraTarget;
        if (!cameraTarget) {
            warn("CinemachineCameraController:startFollowing character camera target is empty");
            return;
        }
        this._assistCameraNode.parent = cameraTarget;
        
        let cameraNode = this._virtualCamera.node;
        cameraNode.getWorldPosition(_tempVec3);
        cameraNode.getWorldRotation(_tempQuat);

        this._assistCameraNode.setWorldRotation(_tempQuat);
        this._assistCameraNode.setWorldPosition(_tempVec3);

        this._virtualCamera.followFadeNode = this.targetCharacter.cameraCloseFadeNode;
    	this._virtualCamera.follow = cameraTarget;
    	this._virtualCamera.enabled = true;
        log("CinemachineCameraController:startFollowing success");
    }

    stopFollowing () {
    	if (!this._virtualCamera) return;
    	this._virtualCamera.enabled = false;
        this._virtualCamera.follow = null;
    }

    onStartFollowing () {
        this.startFollowing();
    }

    onSetTargetCharacter (characters: Character[]) {
    	this.setTarget(characters[this.followCharacterIndex]);
    }
}
