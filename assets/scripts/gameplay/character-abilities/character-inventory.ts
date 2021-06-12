import { _decorator, error, director } from 'cc';
import { CharacterAbilityPriority, WeaponType } from '../scene/define';
import  { Weapon } from '../weapons/weapon';
import CharacterAbility  from "./character-ability"
import CharacterHandleWeapon  from './character-handle-weapon';
const { ccclass, property, type } = _decorator;

@ccclass('CharacterInventory')
export default class CharacterInventory extends CharacterAbility {
    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Inventory;

    @property({type: [Weapon]})
    weaponList: Weapon[] = [];

    @property({type: Weapon})
    currentWeapon: Weapon | null = null;

    private _handleWeapon: CharacterHandleWeapon | null = null;
    private _currentWeaponIdx = -1;

    initialization () {
        super.initialization();
        this._handleWeapon = this.getComponent(CharacterHandleWeapon);

        for (let i = 0; i < this.weaponList.length; i++) {
            let weapon = this.weaponList[i];
            weapon.stow();
            if (weapon == this.currentWeapon) {
                this._currentWeaponIdx = i;
            }
        }

        if (this._currentWeaponIdx == -1 && this.currentWeapon) {
            this.weaponList.push(this.currentWeapon);
            this._currentWeaponIdx = this.weaponList.length - 1;
        }

        if (this._handleWeapon) {
            this._handleWeapon.currentWeapon = this.currentWeapon;
        } else {
            error("CharacterInventory:initialization CharacterHandleWeapon Component is empty");
        }
    }

    switchWeapon () {
        this._currentWeaponIdx++;
        if (this._currentWeaponIdx >= this.weaponList.length) {
            this._currentWeaponIdx = 0;
        }
        this.currentWeapon = this.weaponList[this._currentWeaponIdx];
        this._handleWeapon!.currentWeapon = this.currentWeapon;
    }

    switchToWeapon (weaponType: WeaponType) {
        if (this.currentWeapon?.weaponType == weaponType) {
            return;
        }

        for (let i = 0; i < this.weaponList.length; i++) {
            let weapon = this.weaponList[i];
            if (weapon.weaponType == weaponType) {
                this.currentWeapon = weapon;
                this._handleWeapon!.currentWeapon = weapon;
                this._currentWeaponIdx = i;
                break;
            }
        }
    }

    handleInput () {
        if (!this.isNormal()) {
            return;
        }

        if (this._inputManager!.switchWeapon) {
            this.switchWeapon();
        }
    }

    earlyProcessAbility () {
        super.earlyProcessAbility();
        this.currentWeapon?.earlyProcess(director.getDeltaTime());
    }

    processAbility () {
        this.currentWeapon?.process(director.getDeltaTime());
    }

    lateProcessAbility () {
        this.currentWeapon?.lateProcess(director.getDeltaTime());
    }
}