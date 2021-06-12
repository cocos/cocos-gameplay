import { PostProcessVolume } from '../../../extend-components/post-process-volume';
import { SyncPostProcessVolumeData } from '../../datas/component/post-process-volume';
import { register } from '../register';
import { SyncComponent } from './component';

@register
export class SyncPostProcessVolume extends SyncComponent {
    DATA = SyncPostProcessVolumeData;

    import (comp: PostProcessVolume, data: SyncPostProcessVolumeData) {
        comp.autoExposureBias = data.AutoExposureBias;
        comp.indirectLightingIntensity = data.IndirectLightingIntensity;
    }
}
