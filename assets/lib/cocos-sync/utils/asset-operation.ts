import { Asset, assetManager, Mesh, Skeleton } from "cc";
import { EDITOR, Editor, fse, path, projectPath } from './editor';

export const AssetOpration = {

    async loadAssetByUrl (url: string): Promise<Asset | null> {
        return null;
    },

    async createMesh (url: string) {
        let mesh = new Mesh();
        mesh._setRawAsset('.bin');
        return mesh;
    },

    async saveMesh (url: string, mesh: Mesh) {
    },

    async saveDataAsMesh (url: string, data: Uint8Array) {
    },

    async saveSkeleton (url: string, skeleton: Skeleton) {
    },
}

if (EDITOR && typeof (window as any).BUILDER === 'undefined') {
    AssetOpration.loadAssetByUrl = async function loadAssetByUrl (url: string) {
        let assetUid = await Editor.Message.request('asset-db', 'query-uuid', url);

        return new Promise((resolve, reject) => {
            // setTimeout(() => {
            assetManager.loadAny(assetUid, (err: any, asset: Asset) => {
                if (err) {
                    return reject(err);
                }
                resolve(asset);
            });
            // }, 500);
        })
    }

    const { createReadStream, createWriteStream, ensureDirSync, existsSync, writeFileSync } = fse;
    const { dirname, join, parse } = path;
    const archiver = window.require('archiver');
    const os = window.require('os')

    const tmpdir = os.tmpdir();

    async function zip (target: string, files: string[]) {
        return new Promise((resolve, reject) => {
            const output = createWriteStream(target);
            const archive = archiver('zip');

            let data: number[] = [];
            output.on('error', (error: Error) => {
                reject(error);
            });

            output.on('close', () => {
                console.log('zip close');
                resolve(new Uint8Array(data))
            });

            archive.on('data', function (subdata: number[]) {
                for (let i = 0; i < subdata.length; i++) {
                    data.push(subdata[i]);
                }
            });

            archive.pipe(output);

            files.forEach((file: string) => {
                const nameItem = parse(file);
                archive.append(createReadStream(file), { name: nameItem.ext.substr(1) });
            });

            archive.finalize();
        })
    }

    AssetOpration.saveDataAsMesh = async function saveDataAsMesh (url: string, data: Uint8Array) {
        let mesh = new Mesh;
        mesh.reset({
            struct: {
                vertexBundles: [],
                primitives: [],
            },
            data: data
        })

        AssetOpration.saveMesh(url, mesh);
    }

    AssetOpration.saveMesh = async function saveMesh (url: string, mesh: Mesh) {
        const filePath = await Editor.Message.request('asset-db', 'query-path', url);

        mesh._setRawAsset('.bin');
        // @ts-ignore
        mesh._dataLength = mesh.data.byteLength;
        // @ts-ignore
        let meshJson = EditorExtends.serialize(mesh);
        let meshBin = mesh.data;

        let meshJsonPath = join(tmpdir, 'creator/SaveMesh/__meshJson__.json');
        let meshBinPath = join(tmpdir, 'creator/SaveMesh/__meshBin__.bin');
        let meshZipPath = join(tmpdir, 'creator/SaveMesh/__meshZip__.zip');
        ensureDirSync(dirname(meshJsonPath));

        writeFileSync(meshJsonPath, meshJson);
        writeFileSync(meshBinPath, meshBin);

        ensureDirSync(dirname(filePath));
        let data = await zip(meshZipPath, [meshJsonPath, meshBinPath]);

        let assetUid: string;
        if (existsSync(filePath)) {
            assetUid = await Editor.Message.request('asset-db', 'query-uuid', url);
            await Editor.Message.request('asset-db', 'save-asset', assetUid, data);
        } else {
            assetUid = await Editor.Message.request('asset-db', 'create-asset', url, data);
        }

        await Editor.Message.request('asset-db', 'refresh-asset', url);
    }

    AssetOpration.saveSkeleton = async function saveSkeleton (url: string, skeleton: Skeleton) {
        const filePath = await Editor.Message.request('asset-db', 'query-path', url);
        ensureDirSync(dirname(filePath));

        skeleton._setRawAsset('.json');
        // @ts-ignore
        let json = EditorExtends.serialize(skeleton);

        let jsonPath = join(tmpdir, 'creator/Sync_AssetOpration/__skeletonJson__.json');
        let zipPath = join(tmpdir, 'creator/Sync_AssetOpration/__skeletonZip__.zip');
        ensureDirSync(dirname(jsonPath));
        writeFileSync(jsonPath, json);

        let data = await zip(zipPath, [jsonPath]);

        let assetUid: string;
        if (existsSync(filePath)) {
            assetUid = await Editor.Message.request('asset-db', 'query-uuid', url);
            await Editor.Message.request('asset-db', 'save-asset', assetUid, data);
        } else {
            assetUid = await Editor.Message.request('asset-db', 'create-asset', url, data);
        }

        await Editor.Message.request('asset-db', 'refresh-asset', url);
    }
}
