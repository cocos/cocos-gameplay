import { SyncDataBase } from '../datas/data-base';

export abstract class SyncBase {
    abstract DATA: typeof SyncDataBase | string = '';

    private static _instance: SyncBase | undefined;
    static get instance () {
        if (!this._instance || this._instance.constructor !== this) {
            // @ts-ignore
            this._instance = new this;
        }
        return this._instance!
    }

    static get DATA () {
        return this.instance.DATA;
    }

    private static __TYPE__ = '';
    static get TYPE () {
        if (!Object.getOwnPropertyDescriptor(this, '__TYPE__')) {
            let name = ''
            if (this.DATA && typeof this.DATA !== 'string') {
                //@ts-ignore
                name = (new this.DATA()).__type__;
            }
            else {
                name = this.DATA;
            }
            this.__TYPE__ = name;
        }

        return this.__TYPE__;
    }

    abstract sync (data: SyncDataBase, ...args: any[]): Promise<any>;
}
