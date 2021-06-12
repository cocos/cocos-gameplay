import { error } from "cc";

import { EDITOR, fse, log, path } from "./utils/editor";
import Event from './utils/event';
import { SyncBase } from "./process/sync-base";
import { SyncAssetData } from './datas/asset/asset';
import { SyncSceneData } from './datas/scene';

// if (EDITOR) {
class CocosSyncClass implements ICocosSync {
    Export_Base = "Export_Base";
    Export_Asset_Proxy = "Export_Proxy"

    FinishedEvent = new Event()

    // register
    _registedClasses = new Map() as Map<string, typeof SyncBase>;
    _uuidMap = new Map() as Map<string, object>;

    sceneData: SyncSceneData | undefined;

    clearUuid () {
        this._uuidMap.clear();
    }
    register (dataName: string, syncClass: typeof SyncBase) {
        this._registedClasses.set(dataName, syncClass);
    }

    async sync (data: ISyncDataBase, ...args: any[]) {
        if (!data.__type__) {
            error('Should define __type__ for data : ' + data);
            return;
        }
        const cls = this._registedClasses.get(data.__type__);
        if (!cls) {
            error('Can not find data process for : ' + data.__type__);
            return;
        }

        let res;
        try {
            res = await cls.instance.sync(data, ...args)
        }
        catch (err) {
            error(err);
        }

        let uuid = (data as any as IUUIDBase).__uuid__;
        if (res && uuid) {
            this._uuidMap.set(uuid, res);
        }

        return res;
    }

    get<T> (uuid: string): T {
        let res = this._uuidMap.get(uuid);
        if (!res) {
            res = {};
        }
        return res as any as T;
    }

    async getDetailData (assetData: SyncAssetData): Promise<object | null> {
        log('Begin getDetailData : ' + assetData.path)

        let time = Date.now();

        if (!_ioSocket && !_wsSocket) {
            return null;
        }
        return new Promise((resolve, reject) => {
            function getAssetDetil (uuid: string, dataPath: string) {
                if (uuid !== assetData.__uuid__) {
                    reject(new Error('get-asset-detail failed: uuid not match.'));
                }
                let data: any;
                try {
                    if (!path.isAbsolute(dataPath)) {
                        dataPath = path.join(CocosSync.sceneData?.projectPath, dataPath)
                    }
                    data = fse.readJSONSync(dataPath);
                }
                catch (err) {
                    reject(err);
                    return;
                }

                log(`End getDetailData : ${assetData.path}  :  ${(Date.now() - time) / 1000} s`)

                resolve(data);
            }

            if (_ioSocket) {
                _ioSocket['get-asset-detail'](assetData.__uuid__, getAssetDetil);
            }
            else if (_wsSocket) {
                _wsSocket['get-asset-detail'](assetData.__uuid__, getAssetDetil);
            }
        })
    }

    async syncDataFile (dataPath: string) {
        let data: SyncSceneData;
        try {
            data = fse.readJSONSync(dataPath);
        }
        catch (err) {
            error(err);
            return;
        }

        await CocosSync.sync(data);
    }
}

// @ts-ignore
globalThis.CocosSync = new CocosSyncClass;
// }
