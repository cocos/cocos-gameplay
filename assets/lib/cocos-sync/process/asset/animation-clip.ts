import { animation, AnimationClip, Quat, Vec3 } from 'cc';
import { SyncAnimationClipData, SyncAnimationClipDetail } from '../../datas/asset/animation-clip';
import { SyncSceneData } from '../../datas/scene';
import { deserializeData } from '../../utils/deserialize';
import { path, projectAssetPath } from '../../utils/editor';
import { formatPath } from '../../utils/path';
import { register } from '../register';
import { SyncAsset } from './asset';

@register
export class SyncAnimationClip extends SyncAsset {
    DATA = SyncAnimationClipData;

    getDstRelPath (data: SyncAnimationClipData) {
        let dstRelPath = super.getDstRelPath(data);

        let extName = path.extname(dstRelPath)
        let basenameNoExt = path.basename(dstRelPath).replace(extName, '');
        if (extName != ".anim" && extName != ".uasset") {
            basenameNoExt += "/" + data.animName;
        }

        let subFolderName = "";
        if (data.folderName != "") {
            subFolderName = data.folderName + "/";
        }

        return path.join(path.dirname(dstRelPath), subFolderName + basenameNoExt + '.anim');
    }

    async import (data: SyncAnimationClipData) {
        let detail = data.detail = await CocosSync.getDetailData(data) as SyncAnimationClipDetail;

        var clip = new AnimationClip();
        clip.sample = data.sample;
        clip.duration = data.duration;
        clip.wrapMode = AnimationClip.WrapMode.Loop;

        let curves: AnimationClip.ICurve[] = clip.curves;

        let curveList = deserializeData(detail.curves);
        clip.keys = deserializeData(detail.keys);

        curveList.forEach(curveData => {
            let curve = deserializeData(curveData);

            let valuesData = curve.values;
            let values = [];
            if (curve.name == 'position' || curve.name == 'scale') {
                for (let i = 0; i < valuesData.length; i += 3) {
                    values.push(new Vec3(valuesData[i], valuesData[i + 1], valuesData[i + 2]));
                }
            }
            else if (curve.name == 'rotation') {
                for (let i = 0; i < valuesData.length; i += 4) {
                    values.push(new Quat(valuesData[i], valuesData[i + 1], valuesData[i + 2], valuesData[i + 3]));
                }
            }

            let modifiers = null;
            if (curve.path != "") {
                modifiers = [
                    new animation.HierarchyPath(curve.path.toLocaleLowerCase()),
                    curve.name,
                ];
            } else {
                modifiers = [
                    curve.name
                ];
            }

            curves.push({
                modifiers: modifiers,
                data: {
                    keys: curve.key,
                    values: values
                },
            })
        });

        await this.save(data, clip);
    }
}
