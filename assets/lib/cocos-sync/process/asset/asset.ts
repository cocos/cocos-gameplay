import { Asset } from 'cc';
import { EDITOR } from 'cc/env';
import { SyncAssetData } from '../../datas/asset/asset';
import { SyncSceneData } from '../../datas/scene';
import { AssetOpration } from '../../utils/asset-operation';
import { cce, Editor, error, fse, log, path, projectAssetPath, projectPath } from '../../utils/editor';
import { formatPath } from '../../utils/path';
import { SyncBase } from '../sync-base';

let mtimeConfigsPath: string;
let mtimeConfigs: any = {};

if (EDITOR) {
    mtimeConfigsPath = path.join(projectPath, 'temp/cocos-sync/mtime.json');
    if (fse.existsSync(mtimeConfigsPath)) {
        mtimeConfigs = fse.readJSONSync(mtimeConfigsPath);
    }
}

export abstract class SyncAsset extends SyncBase {
    abstract import (data: SyncAssetData): Promise<any>;

    // paths
    getRelPath (data: SyncAssetData) {
        return data.path;
    }
    getDstRelPath (data: SyncAssetData) {
        return path.join(CocosSync.sceneData!.exportBasePath, this.getRelPath(data));
    }
    getSrcPath (data: SyncAssetData) {
        return data.srcPath || path.join(CocosSync.sceneData!.assetBasePath, this.getRelPath(data));
    }
    getDstPath (data: SyncAssetData) {
        return path.join(projectAssetPath, this.getDstRelPath(data));
    }
    getDstUrl (data: SyncAssetData) {
        let relPath = path.relative(projectAssetPath, this.getDstPath(data));
        return `db://assets/${formatPath(relPath)}`;
    }

    calcPath (data: SyncAssetData, sceneData: SyncSceneData) {
        data.srcPath = this.getSrcPath(data);
        data.dstPath = this.getDstPath(data);
        data.dstUrl = this.getDstUrl(data);
    }

    // 

    async needSync (data: SyncAssetData) {
        let statsPath = '';
        if (data.virtualAsset) {
            if (data.virtualAssetPath) {
                statsPath = data.virtualAssetPath;
            }
            else {
                return true;
            }
        }

        if (!statsPath) {
            statsPath = data.srcPath;
        }

        if (data.shouldCheckSrc && !fse.existsSync(statsPath)) {
            throw 'asset not exists : ' + statsPath;
        }

        const srcStats = fse.statSync(statsPath);
        let mtime = srcStats.mtime.toJSON();

        if (mtimeConfigs[data.__uuid__] === mtime && fse.existsSync(data.dstPath)) {
            return false;
        }

        mtimeConfigs[data.__uuid__] = mtime;

        fse.ensureDirSync(path.dirname(mtimeConfigsPath));
        fse.writeJSONSync(mtimeConfigsPath, mtimeConfigs);

        return true;
    }

    async load (data: SyncAssetData) {
        data.asset = await AssetOpration.loadAssetByUrl(data.dstUrl) as any;
    }

    async save (data: SyncAssetData, asset: Asset | string) {
        if (asset instanceof Asset) {
            asset = cce.Utils.serialize(asset);
        }
        if (typeof asset !== 'string') {
            asset = JSON.stringify(asset, null, 4);
        }

        if (!fse.existsSync(data.dstPath)) {
            await Editor.Message.request('asset-db', 'create-asset', data.dstUrl, asset);
        }
        else {
            const uuid = await Editor.Message.request('asset-db', 'query-uuid', data.dstUrl);
            await cce.Ipc.send('save-asset', uuid, asset)
        }
    }

    async sync (data: SyncAssetData, sceneData: SyncSceneData) {
        // log(`Time 1: ${Date.now() / 1000}`);

        this.calcPath(data, sceneData);

        let forceSyncAsset = false;

        let regs = sceneData.forceSyncAsset.split(',');
        regs.forEach((reg: string) => {
            if (!reg) return;
            if (new RegExp(reg).test(data.srcPath.toLowerCase())) {
                forceSyncAsset = true;
            }
        })

        if (sceneData.forceSyncAssetTypes && sceneData.forceSyncAssetTypes.includes(data.__type__)) {
            forceSyncAsset = true;
        }

        // log(`Time 2: ${Date.now() / 1000}`);

        let needSync = await this.needSync(data) || forceSyncAsset;
        if (needSync) {
            try {
                log(`Syncing asset : ${data.path}`);
                await this.import(data);
            }
            catch (err) {
                error(err);
            }
        }

        // log(`Time 3: ${Date.now() / 1000}`);

        try {
            await this.load(data);
        }
        catch (err) {
            error(err);
        }

        return data;

        // log(`Time 4: ${Date.now() / 1000}`);
    }
}

