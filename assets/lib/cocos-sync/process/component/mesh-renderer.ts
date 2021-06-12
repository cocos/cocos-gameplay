import { find, js, Material, Mesh, MeshRenderer, Texture2D, Vec4 } from "cc";
import { SyncComponent } from "./component";
import { ReflectionProbe } from '../../../extend-components/reflection-probe';
import { MeshRendererProbe, ReflectionProbeInfo } from '../../../extend-components/mesh-renderer-probe';
import { deserializeData } from '../../utils/deserialize';
import { LightmapSetting } from '../../../extend-components/lightmap-setting';
import { register } from "../register";
import { SyncMeshRendererData } from "../../datas/component/mesh-renderer";
import { SyncMaterialData } from '../../datas/asset/material';
import { SyncMeshData } from '../../datas/asset/mesh';
import { SyncTextureData } from '../../datas/asset/texture';
import { MeshRendererSetting, UELightmapSetting } from '../../../extend-components/mesh-renderer-setting';

@register
export class SyncMeshRenderer extends SyncComponent {
    DATA = SyncMeshRendererData;

    import (comp: MeshRenderer, data: SyncMeshRendererData) {
        let setting = comp.getComponent(MeshRendererSetting)!;
        if (!setting) {
            setting = comp.addComponent(MeshRendererSetting)!;
        }

        comp.shadowCastingMode = data.casterShadow ? MeshRenderer.ShadowCastingMode.ON : MeshRenderer.ShadowCastingMode.OFF;
        comp.receiveShadow = data.receiveShadow ? MeshRenderer.ShadowReceivingMode.ON : MeshRenderer.ShadowReceivingMode.OFF;

        let lightMapValid = false;
        // setting._ueLightmapSetting = null;
        setting._ueLightmapSetting = new UELightmapSetting();

        if (data.lightmapSetting) {
            let lightmapSetting = deserializeData(data.lightmapSetting);

            if (lightmapSetting) {
                comp.lightmapSettings.texture = CocosSync.get<SyncTextureData>(lightmapSetting.lightmapColor).asset! as Texture2D || null;
                comp.lightmapSettings.uvParam = new Vec4(lightmapSetting.uv as Vec4);
                (comp as any)._onUpdateLightingmap();

                if (comp.lightmapSettings.texture
                    && lightmapSetting.addVector
                    && lightmapSetting.addVector.length
                    && lightmapSetting.scaleVector
                    && lightmapSetting.scaleVector.length
                ) {
                    // setting._ueLightmapSetting = new UELightmapSetting();
                    setting._ueLightmapSetting.addVector = lightmapSetting.addVector.map(v => new Vec4(v as Vec4));
                    setting._ueLightmapSetting.scaleVector = lightmapSetting.scaleVector.map(v => new Vec4(v as Vec4));

                    lightMapValid = true;
                }
            }
        }

        // mesh vertex attribute
        if (data.autoCheckAttributes) {
            setting.autoCheckAttributes = true;
        }

        data.materilas.forEach((uuid, index) => {
            let m = CocosSync.get<SyncMaterialData>(uuid).asset;
            if (m) {
                comp.setMaterial(m as Material, index);
            }
        })

        let m = CocosSync.get<SyncMeshData>(data.mesh).asset! as Mesh;
        comp.mesh = m;

        if (comp.model && comp.model.subModels) {
            for (let i = data.materilas.length; i < comp.model!.subModels!.length; i++) {
                comp.setMaterial(comp.sharedMaterials[0], i);
            }
        }
    }

    postImport (comp: MeshRenderer, data: SyncMeshRendererData) {
        if (data.probes && data.probes.length) {
            let meshRendererProbe = comp.getComponent(MeshRendererProbe);
            if (!meshRendererProbe) {
                meshRendererProbe = comp.addComponent(MeshRendererProbe);
            }
            meshRendererProbe!.reflectionProbeInfos.length = 0;

            data.probes.forEach(probe => {
                probe = deserializeData(probe);

                let node = find(CocosSync.Export_Base + '/' + probe.probePath);
                if (node) {
                    let reflectionProbe = node.getComponent(js.getClassName(ReflectionProbe)) as ReflectionProbe;
                    if (!reflectionProbe) {
                        reflectionProbe = node.addComponent(js.getClassName(ReflectionProbe)) as ReflectionProbe;
                    }

                    let info = new ReflectionProbeInfo();
                    info.reflectionProbe = reflectionProbe;
                    info.weight = probe.weight;
                    meshRendererProbe!.reflectionProbeInfos.push(info);
                }
            })
        }
    }
}
