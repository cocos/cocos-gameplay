import { _decorator, Component, Camera, geometry, error, Vec3, PhysicsSystem, Quat, Node } from 'cc';
import CinemachineVirtualCamera from './cinemachine-virtual-camera';
import CinemachineCameraController from './cinemachine-camera-controller';
import { ControlType, CameraRotateType } from '../scene/define';
import { globalKeyboardInput } from '../manager/input-manager';
import { GameManager } from '../manager/game-manager';
import { GameEvent, GameEventType } from '../manager/event-manager';
const { ccclass, property} = _decorator;

let _tempVec3 = new Vec3;
let _tempQuat = new Quat;

@ccclass('CinemachineCameraManager')
export default class CinemachineCameraManager extends Component {
    public static instance: CinemachineCameraManager;

	@property(Camera)
    public mainCamera: Camera | null = null;

    @property([CinemachineVirtualCamera])
    virtualCameras: CinemachineVirtualCamera[] = [];

    protected _currentNormalVirtualCamera: CinemachineVirtualCamera | null = null;
    protected _currentNormalCameraController: CinemachineCameraController | null = null;

    protected _currentVirtualCamera: CinemachineVirtualCamera | null = null;
    protected _currentCameraController: CinemachineCameraController | null = null;
    protected _ray: geometry.Ray = new geometry.Ray;
    protected _cameraIndex: number = 0;
    protected _debugCameraIndex: number = -1;
    protected _normalCameraIndex: number = 0;
    protected _preCameraIndex: number = -1;

    protected _thirdPersonCameraIndex: number = -1;
    protected _shoulderSurfingCameraIndex: number = -1;

    public set cameraRotateType (value: CameraRotateType) {
        if (this._currentNormalCameraController) {
            this._currentNormalCameraController.rotateType = value;
        }
    }

    public get rotateFactor () {
        if (this._currentNormalCameraController) {
            return this._currentNormalCameraController.rotateFactor;
        }
        return 1.0;
    } 

    constructor () {
    	super();
    	CinemachineCameraManager.instance = this;
    }

    init () {
    	if (!this.mainCamera) {
    		error("CinemachineCameraManager main camera is empty");
    		return;
        }
        
        GameManager.instance.mainCamera = this.mainCamera;

        for (let i = 0, c = this.virtualCameras.length; i < c; i++) {
            let controller = this.virtualCameras[i].getComponent(CinemachineCameraController);
            if (controller) {
                if (controller.controlType == ControlType.Debug) {
                    this._debugCameraIndex = i;
                }
                if (controller.controlType == ControlType.ShoulderSurfing) {
                    this._shoulderSurfingCameraIndex = i;
                }
                if (controller.controlType == ControlType.ThirdPerson) {
                    this._thirdPersonCameraIndex = i;
                }
            }
        }

        this.updateCamera();
    }

    getVirtualCameraByType (controlType: ControlType) {
        for (let i = 0, c = this.virtualCameras.length; i < c; i++) {
            let camera = this.virtualCameras[i];
            let controller = camera.getComponent(CinemachineCameraController);
            if (controller && controller.controlType == controlType) {
                return camera;
            }
        }
        return null;
    }

    getCameraControlByType (controlType: ControlType) {
        for (let i = 0, c = this.virtualCameras.length; i < c; i++) {
            let camera = this.virtualCameras[i];
            let controller = camera.getComponent(CinemachineCameraController);
            if (controller && controller.controlType == controlType) {
                return controller;
            }
        }
        return null;
    }

    getCurrentCameraRotateType () {
        if (!this._currentCameraController) return CameraRotateType.None;
        return this._currentCameraController.rotateType;
    }

    updateCamera () {
        if (this._preCameraIndex == this._cameraIndex) {
            return;
        }

        this._preCameraIndex = this._cameraIndex;
        this._currentVirtualCamera = null;
        this._currentCameraController = null;

        this._currentVirtualCamera = this.virtualCameras[this._cameraIndex];
        if (!this._currentVirtualCamera) return;

        let cameraController = this._currentCameraController = this._currentVirtualCamera.getComponent(CinemachineCameraController);
        if (!cameraController) return;

        let controlType = cameraController.controlType;
        GameEvent.emit(GameEventType.UpdateCurrentCharacter, cameraController.targetCharacter, controlType);

        switch (controlType) {
            case ControlType.Debug:
            case ControlType.TopDown:
                cameraController.rotateType = CameraRotateType.TopDown;
                break;
            case ControlType.ThirdPerson:
                cameraController.rotateType = CameraRotateType.ThridPerson;
                break;
            case ControlType.ShoulderSurfing:
            case ControlType.FirstPerson:
                cameraController.rotateType = CameraRotateType.None;
                break;
            case ControlType.Drive:
                cameraController.rotateType = CameraRotateType.Drive;
                break;
        }

        if (controlType != ControlType.Debug) {
            this._currentNormalCameraController = this._currentCameraController;
            this._currentNormalVirtualCamera = this._currentVirtualCamera;
        }
    }

    process (dt: number) {
        if (globalKeyboardInput.switchControl) {
            this._cameraIndex++;
            if (this._cameraIndex == this._debugCameraIndex) {
                this._cameraIndex++;
            }

            // control by aim if has thirdperson camera
            if (this._cameraIndex == this._shoulderSurfingCameraIndex && this._thirdPersonCameraIndex >= 0) {
                this._cameraIndex++;
            }

            if (this._cameraIndex >= this.virtualCameras.length) {
                this._cameraIndex = 0;
            }
            this._normalCameraIndex = this._cameraIndex;
            this.updateCamera();
        }

        if (globalKeyboardInput.switchDebug && this._debugCameraIndex >= 0) {
            if (this._cameraIndex == this._debugCameraIndex) {
                this._cameraIndex = this._normalCameraIndex;
            } else {
                this._cameraIndex = this._debugCameraIndex;
            }
            this.updateCamera();
        }

        // do blind to aim switch logic
        if (this._currentCameraController) {
            let controlType = this._currentCameraController.controlType;
            let preVirtualCamera = this._currentVirtualCamera;
            let preCameraController = this._currentCameraController;

            if (controlType == ControlType.ThirdPerson && globalKeyboardInput.switchAim && this._shoulderSurfingCameraIndex >= 0) {
                this._cameraIndex = this._shoulderSurfingCameraIndex;
            }
            if (controlType == ControlType.ShoulderSurfing && !globalKeyboardInput.switchAim && this._thirdPersonCameraIndex >= 0) {
                this._cameraIndex = this._thirdPersonCameraIndex;
            }
            this.updateCamera();

            if (preVirtualCamera != this._currentVirtualCamera) {
                this._currentVirtualCamera?.sync(preVirtualCamera, false);
                this._currentCameraController?.sync(preCameraController);
            }
        }

        if (this._currentCameraController) {
            this._currentCameraController.process(dt);
        }

        for (let i = 0, c = this.virtualCameras.length; i < c; i++) {
            let virtualCamera = this.virtualCameras[i];
            if (virtualCamera) virtualCamera.process(dt);
        }

        let renderCamera = this.mainCamera!.camera;

        if (this._cameraIndex != this._debugCameraIndex && renderCamera) {
            geometry.Frustum.copy(GameManager.instance.currentFrustum, renderCamera.frustum);
        }

        if (this._currentVirtualCamera) {
            let virtualCameraNode = this._currentVirtualCamera.node;
            virtualCameraNode.getWorldPosition(_tempVec3);
            virtualCameraNode.getWorldRotation(_tempQuat);
            if (this.mainCamera) {
                let mainCameraNode = this.mainCamera.node;
                mainCameraNode.setWorldPosition(_tempVec3);
                mainCameraNode.setWorldRotation(_tempQuat);

                renderCamera && renderCamera.update();
            }
        }
    }

    lateProcess (dt: number) {
        if (this._currentCameraController) {
            this._currentCameraController.lateProcess(dt);
        }
    }

    getScreenPointToWorldPosition (out: Vec3, x: number, y: number, mask: number | undefined): Vec3 | null {
        if (!this.mainCamera) return null;
        this.mainCamera.screenPointToRay(x, y, this._ray);

        let hasHit = PhysicsSystem.instance.raycastClosest(this._ray, mask);
        if (!hasHit) return null;
        const hitResult = PhysicsSystem.instance.raycastClosestResult;
        Vec3.copy(out, hitResult.hitPoint);
        return out;
    }

    // return camera observe direction
    getCameraDirection (out: Vec3): Vec3 {
        if (this._currentVirtualCamera) {
            // camera's world direction is opposite with obseve direction
            Vec3.copy(out, this._currentVirtualCamera.worldDirection);
            out.multiplyScalar(-1);
            return out;
        } else {
            return Vec3.zero(out);
        }
    }
}