import { _decorator, Node, error } from 'cc';
const { ccclass, property, type } = _decorator;

@ccclass("ObjectPool")
export default class ObjectPool {
	public pooledGameObjects: Node[] = [];
	protected _pooledGameObjectsRecord: Map<string, Node> = new Map();

	push (object: Node) {
		if (this._pooledGameObjectsRecord.has(object.uuid)) {
			error("object has exist in pool");
			return;
		}

		this.pooledGameObjects.push(object);
		this._pooledGameObjectsRecord.set(object.uuid, object);
	}

	pop (): Node | null {
		if (this.pooledGameObjects.length > 0) {
			let object = this.pooledGameObjects.pop()!;
			this._pooledGameObjectsRecord.delete(object.uuid);
			return object;
		}
		return null;
	}
}