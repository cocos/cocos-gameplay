import { Color, DirectionalLight, Light, SphereLight, SpotLight } from 'cc';
import { SyncDirectionLightData, SyncLightData, SyncSphereLightData, SyncSpotLightData } from '../../datas/component/light';
import { register } from '../register';
import { SyncComponent } from './component';

export abstract class SyncLight extends SyncComponent {
    import (comp: Light, data: SyncLightData) {
        comp.color = new Color(data.color[0] * 255, data.color[1] * 255, data.color[2] * 255, data.color[3] * 255);
    }
}

@register
export class SyncSphereLight extends SyncLight {
    DATA = SyncSphereLightData;

    import (comp: SphereLight, data: SyncSphereLightData) {
        super.import(comp, data);

        comp.range = data.range;
        comp.size = data.size;
        comp.term = Light.PhotometricTerm.LUMINANCE;
        comp.luminance = data.intensity;
    }
}

@register
export class SyncDirectionalLight extends SyncLight {
    DATA = SyncDirectionLightData;

    import (comp: DirectionalLight, data: SyncDirectionLightData) {
        super.import(comp, data);
        comp.illuminance = data.intensity;
    }
}

@register
export class SyncSpotLight extends SyncLight {
    DATA = SyncSpotLightData;

    import (comp: SpotLight, data: SyncSpotLightData) {
        super.import(comp, data);

        comp.range = data.range;
        comp.size = data.size;
        comp.term = Light.PhotometricTerm.LUMINANCE;
        comp.luminance = data.intensity;

        comp.spotAngle = data.spotAngle;
    }
}
