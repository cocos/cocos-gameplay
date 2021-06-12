import { find, Skeleton, SkinnedMeshRenderer } from "cc";
import { SyncSkeletonData } from '../../datas/asset/skeleton';
import { SyncSkinnedMeshRendererData } from "../../datas/component/skinned-mesh-renderer";
import { register } from "../register";
import { SyncMeshRenderer } from "./mesh-renderer";

@register
export class SyncSkinnedMeshRenderer extends SyncMeshRenderer {
    DATA = SyncSkinnedMeshRendererData;

    import (comp: SkinnedMeshRenderer, data: SyncSkinnedMeshRendererData) {
        super.import(comp, data);

        comp.skeleton = CocosSync.get<SyncSkeletonData>(data.skeleton).asset! as Skeleton;
    }

    postImport (comp: SkinnedMeshRenderer, data: SyncSkinnedMeshRendererData) {
        let rootBone = find(CocosSync.Export_Base + '/' + data.rootBonePath);
        if (rootBone) {
            comp.skinningRoot = rootBone;
        }

        comp.skinningRoot = rootBone;

        super.postImport(comp, data);
    }
}
