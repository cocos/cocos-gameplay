import { Color, error, Material, renderer, Texture2D, Vec4 } from "cc";
import { SyncMaterialData, SyncMaterialPropertyType } from "../../datas/asset/material";
import { register } from "../register";
import { AssetOpration } from "../../utils/asset-operation";
import { Editor, fse, path, projectAssetPath } from "../../utils/editor";
import { SyncAsset } from "./asset";

import { ShaderType, SyncShaderData } from "../../datas/asset/shader";
import { SyncSceneData } from '../../datas/scene';
import { SyncTextureData } from '../../datas/asset/texture';
import { relpaceExt } from "../../utils/path";

const Property2Defines = {
    albedoMap: ['USE_ALBEDO_MAP'],
    metallicGlossMap: ['USE_METAL_SMOOTH_MAP'],
    normalMap: ['USE_NORMAL_MAP'],
    occlusionMap: ['USE_OCCLUSION_MAP'],
    emissiveMap: ['USE_EMISSIVE_MAP'],
} as Record<string, string[]>

@register
export class SyncMaterial extends SyncAsset {
    DATA = SyncMaterialData;

    getDstRelPath (data: SyncMaterialData) {
        let dstRelPath = super.getDstRelPath(data);
        return relpaceExt(dstRelPath, '.mtl');
    }

    async import (data: SyncMaterialData) {
        let mtlJson: any;

        // if (fse.existsSync(data.dstPath)) {
        //     mtlJson = fse.readJsonSync(data.dstPath);
        // }
        // else 
        {
            let url = ''
            if (data.shaderType === ShaderType.Standard) {
                url = 'db://assets/lib/cocos-sync/builtin/pbr-smoothness.mtl';
            }
            else {
                url = 'db://internal/default-material.mtl';
            }

            const mtlPath = await Editor.Message.request('asset-db', 'query-path', url);
            mtlJson = fse.readJsonSync(mtlPath);
        }

        let shaderData = CocosSync.get<SyncShaderData>(data.shaderUuid);
        let hasShader = shaderData && fse.existsSync(shaderData.dstPath);
        if (hasShader) {
            const shaderUuid = await Editor.Message.request('asset-db', 'query-uuid', shaderData!.dstUrl);
            if (!mtlJson._effectAsset) {
                mtlJson._effectAsset = {}
            }
            if (mtlJson._effectAsset.__uuid__ !== shaderUuid) {
                mtlJson._effectAsset.__uuid__ = shaderUuid;
                await this.save(data, mtlJson);
            }
        }

        if (!fse.existsSync(data.dstPath)) {
            await this.save(data, mtlJson);
        }

        let mtl: Material = await AssetOpration.loadAssetByUrl(data.dstUrl) as Material;

        let properties: any = {};
        let defines: Record<string, boolean> = {};

        for (let pname in Property2Defines) {
            let pdefines = Property2Defines[pname] as string[];
            if (pdefines) {
                pdefines.forEach((pd: string) => {
                    defines[pd] = false;
                })
            }
        }

        data.properties.forEach(p => {
            if (!p.value) {
                return;
            }

            let name = p.name;

            let value;
            if (p.type === SyncMaterialPropertyType.Float) {
                value = Number.parseFloat(p.value);
            }
            else if (p.type === SyncMaterialPropertyType.Texture) {
                value = (CocosSync.get<SyncTextureData>(p.value).asset! as Texture2D) || undefined;
            }
            else if (p.type === SyncMaterialPropertyType.Range) {
                value = Number.parseFloat(p.value);
            }
            else {
                try {
                    value = JSON.parse(p.value);
                }
                catch (err) {
                    error(err);
                    return;
                }

                if (p.type === SyncMaterialPropertyType.Color) {
                    let maxVal = Math.max(value.r, value.g, value.b, value.a);
                    let color;
                    if (maxVal > 1) {
                        // hdr color value will big than 1 
                        color = new Vec4() as any as Color;
                    }
                    else {
                        color = new Color();
                    }
                    color.x = value.r;
                    color.y = value.g;
                    color.z = value.b;
                    color.w = value.a;
                    color.r = value.r * 255;
                    color.g = value.g * 255;
                    color.b = value.b * 255;
                    color.a = value.a * 255;
                    value = color;
                }
            }

            if (value !== undefined) {
                Property2Defines[name] && Property2Defines[name].forEach((pd: string) => {
                    defines[pd] = true;
                })
                properties[name] = value;
            }
        })

        // technique
        let techIdx = mtl.effectAsset?.techniques.findIndex(t => {
            return t.name === data.technique;
        })
        if (techIdx === -1) {
            techIdx = 0;
        }
        (mtl as any)._techIdx = techIdx;

        if (data.passState) {
            // pipeline state
            renderer.MaterialInstance.prototype.overridePipelineStates.call(mtl, {
                rasterizerState: data.passState.rasterizerState,
                blendState: data.passState.blendState,
                depthStencilState: data.passState.depthStencilState
            });
        }


        // defines
        (mtl as any)._defines.forEach((d: any) => {

            // delete builtin defines
            for (let name in d) {
                if (name.toLowerCase().startsWith('cc_')) {
                    d[name] = undefined;
                }
            }

            for (let dn in defines) {
                d[dn] = defines[dn];
            }

            data.defines.forEach(dataDefine => {
                let splits = dataDefine.split('=');
                let key = splits[0].replace(/ /g, '');
                let value = splits[1].replace(/ /g, '');
                d[key] = value;
            })

            d['USE_LIGHTMAP'] = data.hasLightMap;
            d['HAS_SECOND_UV'] = data.hasLightMap;

            d['USE_INSTANCING'] = data.canInstancing && data.technique !== 'transparent';
            d['USE_ALPHA_TEST'] = false;
        })

        // properties
        for (let name in properties) {
            mtl.setProperty(name, properties[name]);
        }

        await this.save(data, mtl);
    }
}

