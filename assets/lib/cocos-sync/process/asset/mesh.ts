import { SyncMeshData, SyncMeshDataDetail } from '../../datas/asset/mesh';
import { SyncSceneData } from '../../datas/scene';
import { Editor, fse, path, projectAssetPath } from '../../utils/editor';
import { toGltfMesh } from '../../utils/gltf';
import { formatPath, relpaceExt } from '../../utils/path';
import { register } from '../register';
import { SyncAsset } from './asset';

@register
export class SyncMesh extends SyncAsset {
    DATA = SyncMeshData;

    getDstRelPath (data: SyncMeshData) {
        let dstRelPath = super.getDstRelPath(data);
        return relpaceExt(dstRelPath, `/${data.meshName}.gltf`);
    }
    getDstUrl (data: SyncMeshData) {
        let dstUrl = super.getDstUrl(data);
        return `${dstUrl}/${data.meshName}.mesh`;
    }

    async import (data: SyncMeshData) {
        data.detail = await CocosSync.getDetailData(data) as SyncMeshDataDetail;

        let gltf = toGltfMesh(data);

        fse.ensureDirSync(path.dirname(data.dstPath));
        fse.writeJSONSync(data.dstPath, gltf);

        await Editor.Message.request('asset-db', 'refresh-asset', data.dstUrl);
    }
}
