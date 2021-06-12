import { Asset } from 'cc';
import { SyncDeferredPipelineData } from '../../datas/asset/deferred-pipeline';
import { SyncMaterialData } from '../../datas/asset/material';
import { Editor, error, fse } from '../../utils/editor';
import { register } from '../register';
import { SyncAsset } from './asset';

@register
export class SyncDeferredPipleline extends SyncAsset {
    DATA = SyncDeferredPipelineData;

    async import (data: SyncDeferredPipelineData) {
        let tempUrl = 'db://internal/default_renderpipeline/builtin-deferred.rpp'
        const tempPath = await Editor.Message.request('asset-db', 'query-path', tempUrl);
        const contentJson = fse.readJsonSync(tempPath);
        if (!Array.isArray(contentJson)) {
            error('builtin-deferred.rpp should be Array');
            return;
        }

        if (data.deferredLightingMaterialUuid) {
            let deferredMaterialData = await CocosSync.get<SyncMaterialData>(data.deferredLightingMaterialUuid);
            let deferredCombineLutMaterialData = await CocosSync.get<SyncMaterialData>(data.deferredCombineLutMaterialUuid);
            let deferredPPMaterialData = await CocosSync.get<SyncMaterialData>(data.deferredPostProcessMaterialUuid);

            contentJson.forEach(content => {
                if (deferredMaterialData && deferredMaterialData.asset) {
                    if (content.__type__ === 'LightingStage') {
                        if (!content._deferredMaterial) content._deferredMaterial = {}
                        content._deferredMaterial.__uuid__ = (deferredMaterialData.asset! as Asset)._uuid;
                    }
                }

                if (deferredPPMaterialData && deferredPPMaterialData.asset) {
                    if (content.__type__ === 'PostprocessStage') {
                        if (!content._postprocessMaterial) content._postprocessMaterial = {}
                        content._postprocessMaterial.__uuid__ = (deferredPPMaterialData.asset! as Asset)._uuid;
                    }
                }
            })
        }

        this.save(data, JSON.stringify(contentJson, null, 4));
    }
}
