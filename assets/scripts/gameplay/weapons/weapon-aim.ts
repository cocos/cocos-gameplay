import { _decorator, Node, Component, ccenum, Quat, error, Vec3, view } from 'cc';
import  { Weapon } from './weapon';
import { CharacterTypes } from '../core/character'
import MathUtil from '../util/math-util';
import CinemachineCameraManager from '../cinemachine/cinemachine-camera-manager';
import { ColliderGroup, ControlType } from '../scene/define';
import { GameManager } from '../manager/game-manager';
const { ccclass, property, type } = _decorator;

/// the list of possible control modes
export enum AimControls { 
	Auto,
	Center, 
	Mouse
}
ccenum(AimControls);

export enum AimRotateType {
	ByNone,
	ByCharacter,
	ByWeapon
}
ccenum(AimRotateType);

@ccclass('WeaponAim')
export class WeaponAim extends Component {
	@type(AimRotateType)
	yawRotateType: AimRotateType = AimRotateType.ByCharacter;

	@type(AimRotateType)
	pitchRotateType: AimRotateType = AimRotateType.ByCharacter;

    public mask: number = ColliderGroup.All;
	public aimControl: AimControls = AimControls.Mouse;

	@property
	isAutoAim = false;

	@property
	public pitchWhenYawInRange = 10;

	@property
	public maxPitch = 80;

	@property
	public minPitch = -80;
	
	@property
	public aimReadyValue = 2;

	@property
	aimRange: number = 0.2;

    /// the weapon's current direction
    public get currentAim() { return this._currentAim; }
    /// the current angle the weapon is aiming at
	public currentYaw = 0;
	public currentPitch = 0;
    
    protected _weapon: Weapon | null = null;
    protected _currentAim: Vec3 = new Vec3;
	protected _lookRotation: Quat = new Quat;

	public aimWasReady = false;

	protected _currentTarget: Node | null = null;
	public set currentTarget (value: Node | null) {
		if (value == this._currentTarget) {
			return;
		}
		this.aimWasReady = false;
		this._currentTarget = value;
	}

	start () {
		this.initialization();
	}

	initialization () {
		this._weapon = this.getComponent(Weapon);
	}

	// Computes the current aim direction
	updateCurrentAim () {
		if (!this._weapon || !this._weapon.owner) return;
		let owner = this._weapon.owner;
		if (owner.characterType == CharacterTypes.Player && !owner.linkedInputManager) {
			return;
		}

		let controlType = owner.controlType;
		this.mask = controlType == ControlType.TopDown ? ColliderGroup.TopDownAim : ColliderGroup.ThirdPersonAim;
        
		switch (this.aimControl) {
			case AimControls.Center:
				this.updateCenterAim();
				break;
			case AimControls.Mouse:
				this.updateMouseAim();
				break;
			case AimControls.Auto:
				this.updateAutoAim();
				break;
		}
	}

	updateAutoAim () {
		if (this._currentTarget) {			
			this._currentTarget!.getWorldPosition(this._currentAim);

			// debug auto target
			// gameMgr.drawNode(this._currentTarget!);
			this.calculateCurrentAim();
		} else {
			this.currentYaw = 0;
			this.currentPitch = 0;
			this.aimWasReady = false;
		}
	}

	updateCenterAim () {
		let viewport = view.getViewportRect();
		let x = viewport.width / 2;
		let y = viewport.height / 2;
		let success = CinemachineCameraManager.instance.getScreenPointToWorldPosition(this._currentAim, x, y, this.mask);
		if (!success) {
			this.currentYaw = 0;
			this.currentPitch = 0;
			return;
		}
		this.calculateCurrentAim();
	}

	updateMouseAim () {
        if (!this._weapon || !this._weapon.owner || !this._weapon.owner.linkedInputManager) {
			this.currentYaw = 0;
			this.currentPitch = 0;
			return;
		}

        let mousePosition = this._weapon.owner.linkedInputManager.secondaryLocation;
		let success = CinemachineCameraManager.instance.getScreenPointToWorldPosition(this._currentAim, mousePosition.x, mousePosition.y, this.mask);
		if (!success) {
			this.currentYaw = 0;
			this.currentPitch = 0;
			return;
		}

		this.calculateCurrentAim();
	}

	calculateCurrentAim () {
		let refNode = this._weapon?.getRotatingModel() || this.node;

		// debug aim line
		// GameManager.instance.drawLineByPos(this._currentAim, refNode.getWorldPosition());

		MathUtil.convertToNodeSpace(this._currentAim, this._currentAim, refNode);
        if (this._currentAim.length() < this.aimRange) {
			this.currentYaw = 0;
			this.currentPitch = 0;
        	return;
        }

		this._currentAim.normalize();
		// vector rotate begin from z axis to x axis angle
		/*
		       z
		      / \
		       |     
        x /____|_____
          \    |      
               |
		*/
		this.currentYaw = MathUtil.radiansToDegrees(Math.atan2(this._currentAim.x, this._currentAim.z));
		this.currentPitch = -MathUtil.radiansToDegrees(Math.atan2(this._currentAim.y, this._currentAim.z));
		if (Math.abs(this.currentYaw) > this.pitchWhenYawInRange) this.currentPitch = 0;
		if (this.currentPitch > this.maxPitch || this.currentPitch < this.minPitch) this.currentPitch = 0;

		let aimReady = this.aimReady();
		if (aimReady) {
			this.aimWasReady = true;
		}
	}

	aimReady () {
		return Math.abs(this.currentYaw) < this.aimReadyValue && Math.abs(this.currentPitch) < this.aimReadyValue;
	}

	earlyProcess (dt:number) {
	}

	process (dt:number) {
		this.updateCurrentAim();
		this.determineWeaponRotation();
	}

	lateProcess (dt: number) {
	}

	determineWeaponRotation () {
		if (this.yawRotateType != AimRotateType.ByWeapon && this.pitchRotateType != AimRotateType.ByWeapon) {
			return;
		}

		let yaw = 0, pitch = 0;
		if (this.yawRotateType == AimRotateType.ByWeapon) {
			yaw = this.currentYaw;
		}

		if (this.pitchRotateType == AimRotateType.ByWeapon) {
			pitch = this.currentPitch;
		}

		Quat.fromEuler (this._lookRotation, pitch, yaw, 0);
		if (this._weapon) {
			this._weapon.rotateWeapon(this._lookRotation);
		}
	}
}