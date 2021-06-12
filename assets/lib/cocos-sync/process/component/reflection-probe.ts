import { Mesh, TextureCube, _decorator } from "cc";
import { SyncComponent } from "./component";
import { ReflectionProbe } from '../../../extend-components/reflection-probe';
import { register } from "../register";
import { SyncReflectionProbeData } from "../../datas/component/reflecction-probe";
import { SyncTextureData } from '../../datas/asset/texture';

@register
export class SyncReflectionProbe extends SyncComponent {
    DATA = SyncReflectionProbeData;

    import (comp: ReflectionProbe, data: SyncReflectionProbeData) {
        let texture = CocosSync.get<SyncTextureData>(data.bakedTexture);
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

        comp.radius = data.radius;

        comp.brightness = data.brightness;
        comp.averageBrightness = data.averageBrightness;
    }
}
