import { Mesh, TextureCube, _decorator } from "cc";
import { SyncComponent } from "./component";
import { register } from "../register";
import { SyncTextureData } from '../../datas/asset/texture';
import { SyncSkyLightData } from '../../datas/component/sky-light';
import { SkyLight } from '../../../extend-components/skylight';

@register
export class SyncSkylight extends SyncComponent {
    DATA = SyncSkyLightData;

    import (comp: SkyLight, data: SyncSkyLightData) {
        let texture = CocosSync.get<SyncTextureData>(data.cubemapUuid);
        let asset = texture.asset! as object;

        comp.mipmaps = [];
        comp.virtualMipmaps = [];
        if (Array.isArray(asset)) {
            if (asset[0] instanceof Mesh) {
                comp.virtualMipmaps = asset as any as Mesh[];
            }
            else if (asset[0] instanceof TextureCube) {
                comp.mipmaps = asset as any as TextureCube[];
            }
        }
        else if (asset instanceof TextureCube) {
            comp.mipmaps = [asset];
        }

        comp.width = texture.width;
        comp.height = texture.height;

        comp.averageBrightness = data.averageBrightness;
        comp.irradianceEnvironmentMap = data.irradianceEnvironmentMap;

        let skyColor = data.skyColor!;
        comp.skyColor.set(skyColor.r, skyColor.g, skyColor.b, skyColor.a);

        comp.intensity = data.intensity;
    }
}
