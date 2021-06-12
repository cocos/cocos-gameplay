import { _decorator, Component, Node, director, ccenum, Quat, Vec3 } from 'cc';
import { StateMachine } from '../util/state-machine'
import Character from '../core/character';
import { WeaponAim } from './weapon-aim';
import { WeaponType } from '../scene/define';
import { CharacterMovementStates } from '../core/character-states';
const { ccclass, property, type } = _decorator;

export enum WeaponStates {
	WeaponUnknow, WeaponIdle, WeaponStart, WeaponDelayBeforeUse, WeaponUse, WeaponDelayBetweenUses, WeaponStop, WeaponReloadNeeded, WeaponReloadStart, WeaponReload, WeaponReloadStop, WeaponInterrupted
};

enum TriggerModes {
	SemiAuto,
	Auto
};
ccenum(TriggerModes);

let _tempQuat = new Quat;

@ccclass('Weapon')
export class Weapon extends Component {
    @property({type: Node})
    rotatingModel: Node | null = null;

    @property({type: Node})
    idle_MoveRotatingModel: Node | null = null;

    @property({type: Node})
    idle_StandRotatingModel: Node | null = null;

    @property({type: Node})
    showModel: Node | null = null;

    @property({type: Node})
    aimPlane: Node | null = null;

    @property({type: Node})
    idle_MoveAimPlane: Node | null = null;

    @property({type: Node})
    idle_StandAimPlane: Node | null = null;

	@property({tooltip: 'weapon name'})
	weaponName: string = "";

    @property({type: WeaponType})
    weaponType: WeaponType = WeaponType.None;

	@property({tooltip: 'the multiplier to apply to movement while attacking'})
	movementMultiplier = 1.0;

	@property({tooltip: 'if this is true, a multiplier will be applied to movement while the weapon is active'})
	modifyMovementWhileAttacking: boolean = false;

	@property({tooltip: 'if this is true all movement will be prevented (even flip) while the weapon is active'})
	preventAllMovementWhileInUse: boolean = false;

	@property({tooltip: "whether or not the weapon is magazine based. If it's not, it'll just take its ammo inside a global pool"})
    magazineBased = false;

    @property({tooltip: 'the size of the magazine'})
    magazineSize = 30;

    @property({tooltip: "if this is true, pressing the fire button when a reload is needed will reload the weapon. Otherwise you'll need to press the reload button"})
    autoReload = true;

    @property({tooltip: 'the time it takes to reload the weapon'})
    reloadTime = 0.2

    @property({tooltip: 'the delay before use, that will be applied for every shot'})
    delayBeforeUse = 0.0

    @property({tooltip: 'whether or not the delay before used can be interrupted by releasing the shoot button (if true, releasing the button will cancel the delayed shot)'})
    delayBeforeUseReleaseInterruption = true;

    @property({tooltip: 'the time (in seconds) between two shots'})
    timeBetweenUses = 0.2

    @property({tooltip: 'whether or not the time between uses can be interrupted by releasing the shoot button (if true, releasing the button will cancel the time between uses)'})
    timeBetweenUsesReleaseInterruption = true;

    @property({tooltip: 'trigger mode'})
    @type(TriggerModes)
    triggerMode = TriggerModes.Auto;

    @property({type: Node})
    triggerEffect: Node | null= null;

    @property
    weaponRotationSpeed = 1;

    protected _aimableWeapon: WeaponAim | null = null;
    protected _delayBeforeUseCounter: number = 0.0;
    protected _delayBetweenUsesCounter: number = 0.0;
	protected _owner: Character | null = null;
	get owner () { return this._owner; }

	public weaponState: StateMachine<WeaponStates> = 
		new StateMachine<WeaponStates>(this, WeaponStates.WeaponIdle, WeaponStates.WeaponUnknow);

    public preWeaponState: WeaponStates = WeaponStates.WeaponUnknow;

	// reloading bullet, thats mean can't shoot
	protected _reloading: boolean = false;
	// release trigger to stop fire
	protected _triggerReleased: boolean = true;
    get shooting () {
        return !this._triggerReleased;
    }

	// store character origin movement multiply scalar
	protected _movementMultiplierStorage: number = 1.0;

    start () {
    	this.initialization();
    }

    initialization () {
        this._aimableWeapon = this.getComponent(WeaponAim);
        if (!this.rotatingModel) this.rotatingModel = this.node;
        if (!this.idle_MoveRotatingModel) this.idle_MoveRotatingModel = this.rotatingModel;
        if (!this.idle_StandRotatingModel) this.idle_StandRotatingModel = this.rotatingModel;
        
        if (!this.idle_MoveAimPlane) this.idle_MoveAimPlane = this.aimPlane;
        if (!this.idle_StandAimPlane) this.idle_StandAimPlane = this.aimPlane;
    }

    isStateChanged () {
        return this.weaponState.currentState != this.preWeaponState;
    }

    setOwner (newOwner: Character | null) {
    	this._owner = newOwner;
    }

    take () {
        this.node.active = true;

        if (this.showModel) {
            this.showModel.active = true;
        }

        if (this.aimPlane) {
            this.aimPlane.active = true;
        }

        if (this.idle_MoveAimPlane) {
            this.idle_MoveAimPlane.active = true;
        }

        if (this.idle_StandAimPlane) {
            this.idle_StandAimPlane.active = true;
        }
    }

    stow () {
        this.node.active = false;

        if (this.showModel) {
            this.showModel.active = false;
        }

        if (this.aimPlane) {
            this.aimPlane.active = false;
        }

        if (this.idle_MoveAimPlane) {
            this.idle_MoveAimPlane.active = false;
        }

        if (this.idle_StandAimPlane) {
            this.idle_StandAimPlane.active = false;
        }
    }

    earlyProcess (dt: number) {
        this._aimableWeapon?.earlyProcess(dt);
    }

    process (dt: number) {
        this.weaponState.update(dt);
        this._aimableWeapon?.process(dt);
    }

    lateProcess (dt: number) {
        this.updateAimPlane();
        this.processWeaponState();
        this.preWeaponState = this.weaponState.currentState;
        this._aimableWeapon?.lateProcess(dt);
    }

    processWeaponState () {
        switch (this.weaponState.currentState) {
            case WeaponStates.WeaponIdle:
                this.caseWeaponIdle();
                break;

            case WeaponStates.WeaponStart:
                this.caseWeaponStart();
                break;

            case WeaponStates.WeaponDelayBeforeUse:
                this.caseWeaponDelayBeforeUse();
                break;

            case WeaponStates.WeaponUse:
                this.caseWeaponUse();
                break;

            case WeaponStates.WeaponDelayBetweenUses:
                this.caseWeaponDelayBetweenUses();
                break;

            case WeaponStates.WeaponStop:
                this.caseWeaponStop();
                break;

            case WeaponStates.WeaponReloadNeeded:
                this.caseWeaponReloadNeeded();
                break;

            case WeaponStates.WeaponReloadStart:
                this.caseWeaponReloadStart();
                break;

            case WeaponStates.WeaponReload:
                this.caseWeaponReload();
                break;

            case WeaponStates.WeaponReloadStop:
                this.caseWeaponReloadStop();
                break;

            case WeaponStates.WeaponInterrupted:
                this.caseWeaponInterrupted();
                break;
        }
    }

    updateAimPlane () {
        let weaponStateChanged = this.isStateChanged();
        let movementStateChanged = this.owner?.isStateChanged();
        if (!weaponStateChanged && !movementStateChanged) return;

        let weaponState = this.weaponState.currentState;
		let moveState = this.owner?.movementState.currentState;
		if (weaponState == WeaponStates.WeaponIdle) {
			if (moveState == CharacterMovementStates.Idle) {
                if (this.idle_MoveAimPlane) this.idle_MoveAimPlane.active = false;
                if (this.aimPlane) this.aimPlane.active = false;    
				if (this.idle_StandAimPlane) this.idle_StandAimPlane.active = true;
			} else {
                if (this.aimPlane) this.aimPlane.active = false;
				if (this.idle_StandAimPlane) this.idle_StandAimPlane.active = false;
				if (this.idle_MoveAimPlane) this.idle_MoveAimPlane.active = true;
			}
        } else {
            if (this.idle_StandAimPlane) this.idle_StandAimPlane.active = false;
            if (this.idle_MoveAimPlane) this.idle_MoveAimPlane.active = false;
            if (this.aimPlane) this.aimPlane.active = true;
        }
    }

    // If the weapon is idle, we reset the movement multiplier
    caseWeaponIdle () {
    }

    // When the weapon starts we switch to a delay or shoot based on our weapon's settings
    caseWeaponStart () {
    	if (this.delayBeforeUse > 0.0) {
    		this._delayBeforeUseCounter = this.delayBeforeUse;
    		this.weaponState.changeState(WeaponStates.WeaponDelayBeforeUse);
    	} else {
    		this.shootRequest();
    	}
    }

    // If we're in delay before use, we wait until our delay is passed and then request a shoot
    caseWeaponDelayBeforeUse () {
    	this._delayBeforeUseCounter -= director.getDeltaTime();
    	if (this._delayBeforeUseCounter <= 0) {
    		this.shootRequest();
    	}
    }

    // On weapon use we use our weapon then switch to delay between uses
    caseWeaponUse () {
    	this.weaponUse();
    	this._delayBetweenUsesCounter = this.timeBetweenUses;
    	this.weaponState.changeState(WeaponStates.WeaponDelayBetweenUses);
    }

    // When in delay between uses, we either turn our weapon off or make a shoot request
    caseWeaponDelayBetweenUses () {
    	this._delayBetweenUsesCounter -= director.getDeltaTime();
    	if (this._delayBetweenUsesCounter <= 0) {
    		if (this.triggerMode == TriggerModes.Auto && !this._triggerReleased) {
    			this.shootRequest();
    		} else {
    			this.turnWeaponOff();
    		}
    	}
    }

    // On weapon stop, we switch to idle
    caseWeaponStop () {
    	this.weaponState.changeState(WeaponStates.WeaponIdle);
    }

    // If a reload is needed, we mention it and switch to idle
    caseWeaponReloadNeeded () {}

    // on reload start, we reload the weapon and switch to reload
    caseWeaponReloadStart () {}

    // on reload, we reset our movement multiplier, and switch to reload stop once our reload delay has passed
    caseWeaponReload () {}

    // on reload stop, we swtich to idle and load our ammo
    caseWeaponReloadStop () {}

    // on weapon interrupted, we turn our weapon off and switch back to idle
    caseWeaponInterrupted () {}

    weaponUse () {

    }

    turnWeaponOff () {
        if (this.triggerEffect) {
            this.triggerEffect.active = false;
        }

    	let currentState = this.weaponState.currentState;
    	if (currentState == WeaponStates.WeaponIdle || currentState == WeaponStates.WeaponStop) {
    		return;
    	}
        this._triggerReleased = true;
    	this.weaponState.changeState(WeaponStates.WeaponStop);
    }

    turnWeaponOn () {
        this._triggerReleased = false;

        if (this.triggerEffect) {
            this.triggerEffect.active = true;
        }

    	this.weaponState.changeState(WeaponStates.WeaponStart);
    }

    weaponInputStart () {
    	if (this._reloading) {
    		return;
    	}
    	if (this.weaponState.currentState == WeaponStates.WeaponIdle) {	
    		this.turnWeaponOn();
    	}
    }

    shootRequest () {
    	if (this._reloading) {
    		return;
    	}

    	if (this.magazineBased) {
    		// TODO magazine base logic
    	} else {
    		// TODO ammo logic
    		this.weaponState.changeState(WeaponStates.WeaponUse);
    	}
    }

    rotateWeapon (newRotation: Quat) {
        if (!this.rotatingModel) return;
        
        // if the rotation speed is == 0, we have instant rotation
        if (this.weaponRotationSpeed == 0) {
            this.rotatingModel.setRotation(newRotation);
        } else {
            Quat.lerp(_tempQuat, this.rotatingModel.rotation, newRotation, this.weaponRotationSpeed * director.getDeltaTime());
            // otherwise we lerp the rotation
            this.rotatingModel.setRotation(_tempQuat);
        }
    }

    getRotatingModel () {
        let refNode = this.rotatingModel;
		let weaponState = this.weaponState.currentState;
		let moveState = this.owner?.movementState.currentState;
		if (weaponState == WeaponStates.WeaponIdle) {
			if (moveState == CharacterMovementStates.Idle) {
				refNode = this.idle_StandRotatingModel;
			} else {
				refNode = this.idle_MoveRotatingModel;
			}
		}
		return refNode;
    }
}
