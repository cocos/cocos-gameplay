import { ImageDataFormat, SyncTextureData, SyncTextureDataDetail, TextureType } from '../../datas/asset/texture';
import { AssetOpration } from '../../utils/asset-operation';
import { deserializeData } from '../../utils/deserialize';
import { Buffer, Editor, fse, log, path, Sharp } from "../../utils/editor";
import { relpaceExt } from '../../utils/path';
import { register } from '../register';
import { SyncAsset } from "./asset";


@register
export class SyncTexture extends SyncAsset {
    DATA = SyncTextureData;

    getDstRelPath (data: SyncTextureData) {
        let dstPath = super.getDstRelPath(data);
        if (!this.supportFormat(data.srcPath)) {
            dstPath = relpaceExt(dstPath, '.png')
        }
        return dstPath;
    }

    getDstUrl (data: SyncTextureData) {
        let dstUrl = super.getDstUrl(data);

        let subfix = 'texture';
        if (data.type === TextureType.Cube) {
            subfix = 'textureCube';
        }

        return `${dstUrl}/${subfix}`;
    }

    supportFormat (path: string) {
        return path.endsWith('.png') || path.endsWith('.tga');
    }

    getMipmapDstPath (data: SyncTextureData, mipIdx: number) {
        let subfix = `/mipmap_${mipIdx}.png`;
        let dstPath = data.dstPath;
        let dstUrl = data.dstUrl;
        if (data.mipmapCount > 1) {
            dstPath += subfix;
            if (data.type === TextureType.Cube) {
                dstUrl = dstUrl.replace('/textureCube', subfix + '/textureCube');
            }
        }

        if (data.format === ImageDataFormat.LINEAR) {
            dstPath += '.mesh'
            dstUrl = dstUrl.replace('.png/textureCube', '.png.mesh')
        }

        return {
            dstPath,
            dstUrl
        }
    }

    async import (data: SyncTextureData) {
        if (!this.supportFormat(data.srcPath)) {
            data.detail = await CocosSync.getDetailData(data) as SyncTextureDataDetail;
        }

        let mipmapCount = 1;
        if (data.detail && data.detail.mipmaps) {
            mipmapCount = data.detail.mipmaps.length;
        }

        let detail = data.detail!;
        if (detail) {
            // await Promise.all(detail.mipmaps.map(async (mipmapData, index) => {
            for (let index = 0; index < detail.mipmaps.length; index++) {
                let mipmapData = detail.mipmaps[index];
                mipmapData = deserializeData(mipmapData);

                const { dstPath, dstUrl } = this.getMipmapDstPath(data, index);

                fse.ensureDirSync(path.dirname(dstPath));

                // let time1 = Date.now();

                if (mipmapData.dataPath) {
                    let scale = Math.min(1, detail.maxSize / Math.max(mipmapData.width, mipmapData.height));
                    let width = Math.floor(mipmapData.width * detail.scale * scale);
                    let height = Math.floor(mipmapData.height * detail.scale * scale);

                    if (width !== mipmapData.width || height !== mipmapData.height) {
                        await new Promise((resolve, reject) => {
                            Sharp(mipmapData.dataPath)
                                .resize({ width, height })
                                .toFile(dstPath, (err: any) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(null);
                                })
                        })
                    }
                    else {
                        fse.copyFileSync(mipmapData.dataPath, dstPath);
                    }
                }
                else {
                    let datas;
                    if (mipmapData.rawDataPath) {
                        datas = fse.readFileSync(mipmapData.rawDataPath);
                    }
                    else if (mipmapData.datas) {
                        datas = mipmapData.datas;
                    }

                    if (data.format === ImageDataFormat.LINEAR) {
                        await AssetOpration.saveDataAsMesh(dstUrl, new Uint8Array(datas));
                    }
                    else {
                        const channels = 4;
                        const rgbaPixel = 0x00000000;
                        const opts = { raw: { width: mipmapData.width, height: mipmapData.height, channels } };

                        let buffer = Buffer.alloc(mipmapData.width * mipmapData.height * channels, rgbaPixel);

                        for (let i = 0; i < datas.length; i++) {
                            buffer[i] = datas[i];
                        }

                        await new Promise((resolve, reject) => {
                            Sharp(buffer, opts)
                                .resize({ width: mipmapData.width * detail!.scale, height: mipmapData.height * detail!.scale })
                                .toFile(dstPath, (err: any) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(null);
                                })
                        })
                    }

                }

                // let time2 = Date.now();
                // console.warn(`Process Texture : ${(time2 - time1) / 1000} s`)

                let metaPath = dstPath + '.meta';
                if (!fse.existsSync(metaPath)) {
                    // to generate the meta file
                    await Editor.Message.request('asset-db', 'refresh-asset', dstUrl);
                }

                if (data.type === TextureType.Cube || (data.type === TextureType.Texture && mipmapCount === 1)) {
                    let meta = fse.readJSONSync(metaPath);

                    if (data.type === TextureType.Cube) {
                        if (!meta.userData) {
                            meta.userData = {};
                        }
                        meta.userData.type = 'texture cube';
                    }

                    if (meta.subMetas) {
                        for (let id in meta.subMetas) {
                            meta.subMetas[id].userData.mipfilter = mipmapData.mipFilter;
                            meta.subMetas[id].userData.minfilter = mipmapData.minFilter;
                            meta.subMetas[id].userData.magfilter = mipmapData.magFilter;
                        }
                    }

                    fse.writeJSONSync(metaPath, meta);

                }

                await Editor.Message.request('asset-db', 'refresh-asset', dstUrl);

                // let time3 = Date.now();
                // console.warn(`Refresh Texture : ${(time3 - time2) / 1000} s`)

            }// }));
        }
        else {
            fse.ensureDirSync(path.dirname(data.dstPath));
            fse.copyFileSync(data.srcPath, data.dstPath);
            await Editor.Message.request('asset-db', 'refresh-asset', data.dstUrl);
        }
    }

    async load (data: SyncTextureData) {
        let time = Date.now();
        log('Begin load asset : ' + data.path);

        let mipmapCount = data.mipmapCount;
        if (data.detail && data.detail.mipmaps) {
            mipmapCount = data.detail.mipmaps.length;
        }

        if (data.type === TextureType.Cube) {
            data.asset = await Promise.all(new Array(mipmapCount).fill(0).map(async (_, index) => {
                const { dstUrl } = this.getMipmapDstPath(data, index);
                return await AssetOpration.loadAssetByUrl(dstUrl)
            })) as any;
        }
        else {
            data.asset = await AssetOpration.loadAssetByUrl(data.dstUrl) as any;
        }

        log(`End load asset : ${data.path} : ${(Date.now() - time) / 1000} s`);
    }
}

