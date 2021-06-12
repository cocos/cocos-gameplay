import { Mat4, Skeleton } from 'cc';
import { SyncSkeletonData } from '../../datas/asset/skeleton';
import { SyncSceneData } from '../../datas/scene';
import { AssetOpration } from '../../utils/asset-operation';
import { path, projectAssetPath } from '../../utils/editor';
import { formatPath, relpaceExt } from '../../utils/path';
import { register } from '../register';
import { SyncAsset } from './asset';

@register
export class SyncSkeleton extends SyncAsset {
    DATA = SyncSkeletonData;

    getDstRelPath(data: SyncSkeletonData) {
        let dstPath = super.getDstRelPath(data);
        return relpaceExt(dstPath, '.skeleton');
    }

    async import (data: SyncSkeletonData) {
        let skeleton = new Skeleton;

        data.bindposes.forEach(mat => {
            let mats = mat.split(',').map(m => parseFloat(m));
            skeleton.bindposes.push(Mat4.fromArray(new Mat4, mats));
        })
        data.bones.forEach(bone => {
            skeleton.joints.push(bone.toLocaleLowerCase());
        })

        // this.save(data, skeleton);

        await AssetOpration.saveSkeleton(data.dstUrl, skeleton);
    }
}
