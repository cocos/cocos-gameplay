import { _decorator, Node, Prefab, instantiate, warn, ColliderComponent } from 'cc';
const { ccclass, property, type } = _decorator;
import CharacterAbility from './character-ability';
import  { Weapon, WeaponStates } from '../weapons/weapon';
import { AimControls, WeaponAim } from '../weapons/weapon-aim';
import { CharacterAbilityPriority, WeaponType } from "../scene/define";
import { GameManager } from '../manager/game-manager';
import { CharacterPoseStates } from '../core/character-states';

@ccclass('CharacterHandleWeapon')
export default class CharacterHandleWeapon extends CharacterAbility {
    public priority: CharacterAbilityPriority = CharacterAbilityPriority.HandleWeapon;

    @type(Node)
    public weaponAttachment: Node | null = null;

    @property({serializable:true})
    protected _currentWeapon: Weapon | null = null;
    @type(Weapon)
    set currentWeapon (newWeapon: Weapon | null) {
        if (this._currentWeapon) {
            this.shootStop();
            this._currentWeapon.stow();
        }

        this._currentWeapon = newWeapon;
        if (!newWeapon) {
            if (this._animator) {
                this._animator.setWeaponType(WeaponType.None);
                this._animator.setWeaponState(WeaponStates.WeaponUnknow);
            }
            return;
        }

        newWeapon.take();
        newWeapon.setOwner(this._character);
        this._weaponAim = newWeapon.getComponent(WeaponAim);

        // we turn off the gun's emitters.
        newWeapon.initialization();

        if (this._animator) {
            this._animator.setWeaponType(newWeapon.weaponType);
            this._animator.setWeaponState(newWeapon.weaponState.currentState);
        }
    }
    
    get currentWeapon (): Weapon | null {
        return this._currentWeapon;
    }

    protected _weaponAim: WeaponAim | null = null; 
    get weaponAimComponent () { return this._weaponAim; } 

    protected _currentTarget: Node | null = null;
    set currentTarget (value: Node | null) {
        this._currentTarget = value;
    }

	initialization () {
        super.initialization();
        // init weapon
        this.currentWeapon = this._currentWeapon;

        if (!this.weaponAttachment) {
    		this.weaponAttachment = this.node;
    	}
    }

    processAbility () {
        super.processAbility();
        this.handleAutoFire();
    }

    earlyProcessAbility () {
        super.earlyProcessAbility();
        
        if (this._weaponAim && this._weaponAim.aimControl == AimControls.Auto) {
            this._weaponAim.currentTarget = this._currentTarget;
        }
    }

    lateProcessAbility () {
    }

    changeWeapon (newWeaponPrefab: Prefab | null) {
        if (newWeaponPrefab) {
            this.instantiateWeapon(newWeaponPrefab);
        } else {
            this.currentWeapon = null;
        }
    }

    changeWeaponState (weaponState: WeaponStates) {
        if (this._currentWeapon) {
            this._currentWeapon.weaponState.changeState(weaponState);
        }
    }

    isForbidShoot () {
        return this._poseState!.currentState == CharacterPoseStates.Sprint;
    }

    handleAutoFire () {
        if (!this._weaponAim || this._weaponAim.aimControl != AimControls.Auto) {
            return;
        }

        if (!this.isNormal() || this.isForbidShoot()) {
            this.changeWeaponState(WeaponStates.WeaponInterrupted);
            return;
        }

        if (this._weaponAim.aimWasReady) {
            this.shootStart();
        } else {
            this.shootStop();    
        }
    }

    handleInput () {
        if (this._weaponAim && this._weaponAim.aimControl == AimControls.Auto) {
            let gameMgr = GameManager.instance;
            if (gameMgr.hasTarget()) {
                let isTarget = gameMgr.isTarget(this._currentTarget);
                if (!isTarget) {
                    this._currentTarget = gameMgr.targetAI;
                }   
            } else {
                this._currentTarget = null;
            }
            return;
        }

        if (!this.isNormal() || this.isForbidShoot()) {
            this.changeWeaponState(WeaponStates.WeaponInterrupted);
            return;
        }

    	if (this._inputManager!.shootEnable) {
    		this.shootStart();
    	} else {
    		this.shootStop();
    	}
    }

    isShooting () {
        if (this.currentWeapon) {
    		return this.currentWeapon.shooting;
    	}
        return false;
    }

    shootStart () {
    	if (this.currentWeapon) {
    		this.currentWeapon.weaponInputStart();
    	}
    }

    shootStop () {
    	this.forceStop();
    }

    forceStop () {
    	if (this.currentWeapon) {
    		this.currentWeapon.turnWeaponOff();
    	}
    }

    instantiateWeapon (newWeaponPrefab: Prefab) {
        let newWeaponNode = instantiate(newWeaponPrefab);
        this.weaponAttachment!.addChild(newWeaponNode);
        
        let newWeapon = newWeaponNode.getComponent(Weapon);
        if (!newWeapon) {
            warn("instantiateWeapon failed, can't get weapon component from weapon prefab");
            return;
        }

        this.currentWeapon = newWeapon;
    }

    updateAnimator () {
        if (this.currentWeapon) {
            this._animator!.setWeaponState(this.currentWeapon.weaponState.currentState);
        }
    }
}
