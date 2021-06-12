import { director, find, js, Material, Node, Quat, Texture2D, Vec3 } from 'cc';
import { SyncNodeData } from '../datas/node';
import { DeferredRendering } from '../../extend-components/deferred-rendering';
import { deserializeData } from '../utils/deserialize';
import { merge } from './merge-node';
import { register } from './register';
import { SyncBase } from './sync-base';
import { GuidProvider } from '../../extend-components/guid-provider';
import { fse, path, projectPath } from '../utils/editor';
import { AssetOpration } from '../utils/asset-operation';
import { SyncDeferredPipelineData } from '../datas/asset/deferred-pipeline';
import { CombineLut } from '../../extend-components/combine-lut';
import { SyncMaterialData } from '../datas/asset/material';

export class PrivateSyncNodeData extends SyncNodeData {
    children: PrivateSyncNodeData[] = []

    parentIndex = -1;
    node: Node | undefined;

    mergeToNodeIndex = -1;
    matrix: IMat4 | undefined;
}

async function createRootNode () {
    let root = new Node(CocosSync.Export_Base);
    let rendering = root.addComponent(DeferredRendering);

    // hack
    let lutUrl = 'db://assets/Exported-unreal/__builtin__/unreal-deferred-lut.png/texture';
    let lut: Texture2D | null = null;
    try {
        lut = await AssetOpration.loadAssetByUrl(lutUrl) as Texture2D;
    }
    catch (err) { }
    rendering.colorGradingLUT = lut;

    let deferredData = CocosSync.get<SyncDeferredPipelineData>('__builtin__/unreal-deferred.rpp');
    if (deferredData) {
        let lutMaterialData = CocosSync.get<SyncMaterialData>(deferredData.deferredCombineLutMaterialUuid);
        if (lutMaterialData.asset) {
            let lut = root.addComponent(CombineLut);
            lut.material = lutMaterialData.asset as Material;
        }
    }

    root.parent = director.getScene() as any;
    return root;
}

@register
export class SyncNode extends SyncBase {
    DATA = SyncNodeData;

    async sync (data: PrivateSyncNodeData, parent: Node | null = null) {
        if (!parent) {
            parent = find(CocosSync.Export_Base);
            if (!parent) {
                parent = await createRootNode();
            }
        }

        let guid = data.uuid;
        let provider = GuidProvider.guids.get(guid);

        let node: Node;
        if (!provider || !provider.enabledInHierarchy) {
            node = new Node(data.name);
            provider = node.addComponent(GuidProvider);
            provider.guid = guid;
        }
        else {
            node = provider.node;
        }

        node.parent = parent;
        node.setRTS(data.rotation as Quat, data.position as Vec3, data.scale as Vec3);

        data.node = node;

        // clear all components
        let components = node.components;
        for (let i = components.length - 1; i >= 0; i--) {
            if (js.getClassName(components[i]) !== js.getClassName(GuidProvider)) {
                components[i].destroy();
                //@ts-ignore
                js.array.fastRemoveAt(components, i);
            }
        }

        if (data.components) {
            for (let i = 0, l = data.components.length; i < l; i++) {
                let cdata = deserializeData(data.components[i]);
                if (!cdata) {
                    continue;
                }

                await CocosSync.sync(cdata, node);
            }
        }

        if (data.needMerge) {
            let comp = node.getComponent('InstanceObject');
            if (comp) {
                merge.push(comp);
            }
        }

        return node;
    }
}
