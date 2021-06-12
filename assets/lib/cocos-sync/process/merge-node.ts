import { Component, Material, Mesh, MeshRenderer } from 'cc';
import { SyncMaterialData } from '../datas/asset/material';
import { SyncMeshData } from '../datas/asset/mesh';
import { SyncMeshRendererData } from '../datas/component/mesh-renderer';
import { deserializeData } from '../utils/deserialize';
import { error } from '../utils/editor';
import { SyncMeshRenderer } from './component/mesh-renderer';
import { PrivateSyncNodeData } from './node';

let _mergeList: any[] = [];

export const merge = {
    clear () {
        _mergeList.length = 0;
    },

    push (comp: Component) {

    },


    finishMerge () {
        for (let i = 0; i < _mergeList.length; i++) {
            _mergeList[i].rebuild();
        }
    },

    mergeNodeData (data: PrivateSyncNodeData, nodeList: PrivateSyncNodeData[]) {

        if (!data.components) {
            return;
        }

        let root = nodeList[data.mergeToNodeIndex];
        let rootNode = root && root.node;
        if (!root || !rootNode) {
            error('Can not find node by mergeToNodeIndex : ', data.mergeToNodeIndex);
            return;
        }

        for (let i = 0, l = data.components.length; i < l; i++) {
            let cdata = deserializeData(data.components[i]);
            if (!cdata) {
                continue;
            }
            if (cdata.__type__ !== SyncMeshRenderer.TYPE) {
                continue;
            }

            let mrData = (cdata as SyncMeshRendererData);
            let materials = mrData.materilas.map(uuid => {
                return CocosSync.get<SyncMaterialData>(uuid).asset! as Material;
            })
            let m = CocosSync.get<SyncMeshData>(mrData.mesh).asset!;

            let instanceObject: any = rootNode.getComponent('InstanceObject');
            if (instanceObject) {
                instanceObject.addData({ mesh: m as Mesh, sharedMaterials: materials, shadowCastingMode: MeshRenderer.ShadowCastingMode.OFF }, data.matrix);
            }

            break;
        }
    }

}

