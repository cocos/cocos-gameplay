import { _decorator } from 'cc';
import { CharacterConditions } from '../core/character-states';
import { CharacterAbilityPriority } from '../scene/define';
const { ccclass, property } = _decorator;
import CharacterAbility from './character-ability';

@ccclass('CharacterHealth')
export default class CharacterHealth extends CharacterAbility {
	public priority: CharacterAbilityPriority = CharacterAbilityPriority.Health;

	@property
	health = 3;

	onDamage (damage: number) {
		this.health -= damage;
		if (this.health <= 0) {
			this._conditionState!.changeState(CharacterConditions.Dead);
		} else {
			this._conditionState!.changeState(CharacterConditions.Damage);
		}
	}
}