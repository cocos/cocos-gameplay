import { Editor, fse } from "../../utils/editor";
import { SyncAsset } from "./asset";
import { SyncShaderData, ShaderType } from "../../datas/asset/shader";
import { register } from "../register";
import { relpaceExt } from "../../utils/path";

@register
export class SyncShader extends SyncAsset {
    DATA = SyncShaderData;

    getDstRelPath (data: SyncShaderData) {
        let dstRelPath = super.getDstRelPath(data);
        return relpaceExt(dstRelPath, '.effect');
    }
    getDstPath (data: SyncShaderData) {
        let dstPath = super.getDstPath(data);
        let proxyPath = dstPath.replace(CocosSync.sceneData!.exportBasePath, CocosSync.Export_Asset_Proxy);
        if (fse.existsSync(proxyPath)) {
            return proxyPath;
        }
        return dstPath;
    }

    async needSync (data: SyncShaderData) {
        if (data.shaderType === ShaderType.Standard) {
            return false;
        }

        return super.needSync(data);
    }

    async import (data: SyncShaderData) {
        if (data.shaderType === ShaderType.ShaderGraph) {
            await Editor.Message.request('shader-graph', 'convert', data.srcPath, data.dstPath);
        }
        else if (data.shaderType === ShaderType.Source) {
            await this.save(data, data.source);
        }
    }

    async load (data: SyncShaderData) {
        data.asset = data as any;
    }
}

