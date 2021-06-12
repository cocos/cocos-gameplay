import { Color, Vec4 } from 'cc';
import { ExponentialHeightFog, SecondExponentialHeightFog } from '../../../extend-components/exponential-height-fog';
import { SyncDataExponentialHeightFog } from '../../datas/component/exponential-height-fog';
import { register } from '../register';
import { SyncComponent } from './component';


@register
export class SyncExponentialHeightFog extends SyncComponent {
    DATA = SyncDataExponentialHeightFog;

    import (comp: ExponentialHeightFog, data: SyncDataExponentialHeightFog) {
        comp.secondFogData = new SecondExponentialHeightFog();
        comp.secondFogData.fogDensity = data.secondFogData!.fogDensity
        comp.secondFogData.fogHeightFalloff = data.secondFogData!.fogHeightFalloff
        comp.secondFogData.fogHeightOffset = data.secondFogData!.fogHeightOffset
        comp.fogDensity = data.fogDensity
        comp.fogHeightFalloff = data.fogHeightFalloff
        comp.fogInscatteringColor = new Vec4(data.fogInscatteringColor as any);
        comp.directionalInscatteringExponent = data.directionalInscatteringExponent
        comp.directionalInscatteringStartDistance = data.directionalInscatteringStartDistance
        comp.directionalInscatteringColor = new Vec4(data.directionalInscatteringColor as any);
        comp.fogMaxOpacity = data.fogMaxOpacity
        comp.startDistance = data.startDistance
        comp.fogCutoffDistance = data.fogCutoffDistance
        comp.volumetricFogScatteringDistribution = data.volumetricFogScatteringDistribution
        comp.volumetricFogAlbedo = new Color(data.volumetricFogAlbedo as any)
        comp.volumetricFogEmissive = new Vec4(data.volumetricFogEmissive as any)
        comp.volumetricFogExtinctionScale = data.volumetricFogExtinctionScale;
        comp.volumetricFogDistance = data.volumetricFogDistance;
        comp.volumetricFogStaticLightingScatteringIntensity = data.volumetricFogStaticLightingScatteringIntensity;
        comp.bOverrideLightColorsWithFogInscatteringColors = data.bOverrideLightColorsWithFogInscatteringColors;
    }

    setup () {

    }
}
