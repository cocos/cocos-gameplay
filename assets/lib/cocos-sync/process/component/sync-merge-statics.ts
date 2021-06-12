import { SyncInstanceObjectData } from "../../datas/component/instance-object";
import { register } from "../register";
import { SyncComponent } from "./component";

@register
export class SyncInstanceObject extends SyncComponent {
    DATA = SyncInstanceObjectData;

    import (comp: any, data: SyncInstanceObjectData) {
        comp.clear();
        comp.mergeSize = data.mergeSize;
    }
}
