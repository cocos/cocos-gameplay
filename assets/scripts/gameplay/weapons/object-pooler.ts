import { _decorator, Component, Node, error, Prefab, instantiate } from 'cc';
const { ccclass, property, type } = _decorator;
import ObjectPool from './object-pool';
import PoolableObject from './poolable-object';
import { GameManager } from '../manager/game-manager';

@ccclass("ObjectPooler")
export default class ObjectPooler extends Component {
	@type(Prefab)
	public projectileTemplate: Prefab | null = null;
	protected _objectPool: ObjectPool | null = null;

	start () {
		this._objectPool = new ObjectPool;
	}

	getObject (): Node | null {
		if (!this.projectileTemplate) {
			error("ProjectileGenerate generate projectileTemplate is null");
			return null;
		}

		let objectPool = this._objectPool;
		let object: Node | null = objectPool!.pop();
		if (!object) {
			object = instantiate(this.projectileTemplate);
		}
		let poolableObject = object.getComponent(PoolableObject);
		if (!poolableObject) {
			error("SimpleObjectPooler getPooledGameObject poolableObject component is null");
			return null;
		}
		poolableObject.reuseCallback = function () {
			objectPool!.push(object!);
		};
		object.active = true;
		GameManager.instance.skillLayer.addChild(object);
		return object;
	}
}