import { find, Mat4, Node, Quat, Vec3 } from 'cc';
import { SyncAssetData } from '../datas/asset/asset';
import { SyncSceneData } from '../datas/scene';
import { deserializeData } from '../utils/deserialize';
import { cce, Editor, log, warn } from '../utils/editor';
import { merge } from './merge-node';
import { PrivateSyncNodeData, PrivateSyncNodeData as SyncNodeData } from './node';
import { register } from './register';
import { SyncBase } from './sync-base';

class PrivateSyncSceneData extends SyncSceneData {
    children: SyncNodeData[] = [];
}


let _nodeList: SyncNodeData[] = [];
let _rootNodeList: SyncNodeData[] = [];
let _currentNodeIndex = 0;
function collectSceneData (data: PrivateSyncSceneData) {
    merge.clear();

    _nodeList.length = 0;
    _rootNodeList.length = 0;
    _currentNodeIndex = 0;

    CocosSync.sceneData = data;

    if (data.children) {
        for (let i = 0, l = data.children.length; i < l; i++) {
            let child = deserializeData(data.children[i]);
            if (!child) {
                continue;
            }
            child.parentIndex = -1;
            _rootNodeList.push(child);
            collectNodeData(child);
        }
    }
}

function calcMatrix (data: SyncNodeData) {
    let parentData = _nodeList[data.parentIndex];
    if (parentData && !parentData.matrix) {
        calcMatrix(parentData);
    }

    // Quat.fromEuler(_tempQuat, data.eulerAngles.x, data.eulerAngles.y, data.eulerAngles.z);
    // data.matrix = Mat4.fromRTS(new Mat4, _tempQuat, data.position, data.scale);
    data.matrix = Mat4.fromRTS(new Mat4, data.rotation as Quat, data.position as Vec3, data.scale as Vec3);

    if (parentData) {
        data.matrix = Mat4.multiply(data.matrix, parentData.matrix!, data.matrix);
    }
}
function collectNodeData (data: SyncNodeData) {
    let parentData = _nodeList[data.parentIndex];
    if (parentData) {
        if (parentData.needMerge) {
            data.mergeToNodeIndex = data.parentIndex;
        }
        else if (parentData.mergeToNodeIndex >= 0) {
            data.mergeToNodeIndex = parentData.mergeToNodeIndex;
        }

        if (data.mergeToNodeIndex >= 0) {
            calcMatrix(data);
        }
    }

    let index = _nodeList.length;
    _nodeList.push(data);

    if (data.children) {
        for (let i = 0, l = data.children.length; i < l; i++) {
            let child = deserializeData(data.children[i]);
            if (!child) {
                continue;
            }
            child.parentIndex = index;
            collectNodeData(child);
        }
    }
}


async function syncAssets () {
    CocosSync.clearUuid();

    let time = Date.now();
    log('Begin Sync assets...');
    if (!CocosSync.sceneData) {
        return;
    }

    let sceneData = CocosSync.sceneData! as SyncSceneData
    if (sceneData.asyncAssets) {
        let total = sceneData.asyncAssets.length;
        await Promise.all(sceneData.asyncAssets.map(async (data: SyncAssetData, i: number) => {
            let syncTime = Date.now();
            log(`------------------- Begin sync asset: ${i} - ${total} - ${data.path} -------------------`);
            await CocosSync.sync(data, sceneData);
            log(`------------------- End sync asset: ${i} - ${total} - ${data.path} : ${(Date.now() - syncTime) / 1000} s -------------------`);
            log(' ')
        }))
    }

    let total = sceneData.assets.length;
    for (let i = 0; i < total; i++) {
        let syncTime = Date.now();
        let data = deserializeData(sceneData.assets[i]);

        if (data) {
            log(`------------------- Begin sync asset: ${i} - ${total} - ${data.path} -------------------`);
            await CocosSync.sync(data, sceneData);
            log(`------------------- End sync asset: ${i} - ${total} - ${data.path} : ${(Date.now() - syncTime) / 1000} s -------------------`);
            log(' ')
        }
    }

    log(`End Sync assets: ${(Date.now() - time) / 1000} s`);
}

let _syncIntervalID = -1;
let _startTime = 0;
async function syncDatasFrame () {
    for (let i = 0; i < 1000; i++) {
        let node = _nodeList[_currentNodeIndex];
        if (node) {
            let parent: Node | undefined = undefined;
            if (node.mergeToNodeIndex >= 0) {
                merge.mergeNodeData(node, _nodeList);
            }
            else {
                let finded = true;
                if (node.parentIndex !== -1) {
                    let parentData = _nodeList[node.parentIndex];
                    if (!parentData) {
                        warn('Can not find parent node data with index : ' + node.parentIndex);
                        finded = false;
                    }
                    parent = parentData.node;
                }
                if (finded) {
                    await CocosSync.sync(node, parent);
                }
            }
        }
        else {
            warn('Can not find node data with index : ' + _currentNodeIndex);
        }

        if (++_currentNodeIndex >= _nodeList.length) {
            merge.finishMerge();

            CocosSync.FinishedEvent.invoke();

            setTimeout(() => {
                // Editor.Message.request('scene', 'soft-reload');
            }, 1000)

            log(`End sync Nodes: ${Date.now() - _startTime} ms`);

            clearInterval(_syncIntervalID);
            _syncIntervalID = -1;
            return;
        }
    }

    log(`Sync: Progress - ${_currentNodeIndex / _nodeList.length}, NodeCount - ${_currentNodeIndex} `);
    setTimeout(syncDatasFrame, 100);
}
function syncDatas () {
    if (_syncIntervalID !== -1) {
        clearInterval(_syncIntervalID);
    }

    log('Begin sync Nodes...');
    _startTime = Date.now();

    syncDatasFrame();
}


@register
export class SyncScene extends SyncBase {
    DATA = SyncSceneData;

    async sync (data: PrivateSyncSceneData) {
        let time = Date.now();
        log('******************** Begin Sync scene ********************')
        log(' ')

        if (data.editorView) {
            cce.Camera._camera.node.position = data.editorView.position;
            // cce.Camera._camera.node.eulerAngles = data.editorView.eulerAngles;
            // cce.Camera._camera.node.rotation = Quat.rotateY(new Quat, cce.Camera._camera.node.rotation, -Math.PI / 2);

            // var q = new Quat();
            // Quat.rotateAround(q, q, Vec3.UP, -Math.PI / 2);
            // Quat.rotateAround(q, q, Vec3.FORWARD, -data.editorView.eulerAngles.x / 180 * Math.PI);
            // Quat.rotateAround(q, q, Vec3.UP, -data.editorView.eulerAngles.y / 180 * Math.PI);

            if (data.editorView.rotation) {
                cce.Camera._camera.node.rotation = data.editorView.rotation;
            }
            else if (data.editorView.eulerAngles) {
                cce.Camera._camera.node.eulerAngles = data.editorView.eulerAngles;
            }

            cce.Engine.repaintInEditMode()
        }

        if (data.clearExported) {
            let rootNode = find(CocosSync.Export_Base);
            if (rootNode) {
                rootNode.parent = null;
            }
        }

        collectSceneData(data);

        await syncAssets();

        syncDatas();

        log(' ')
        log(`******************** End Sync scene : ${(Date.now() - time) / 1000} s ********************`)
    }
}
