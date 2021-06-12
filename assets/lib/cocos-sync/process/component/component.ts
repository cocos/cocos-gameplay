import { Component, js, Node } from "cc";
import { SyncComponentData } from "../../datas/component/component";
import { SyncDataBase } from '../../datas/data-base';
import { error, warn } from "../../utils/editor";
import { SyncBase } from '../sync-base';

export abstract class SyncComponent extends SyncBase {
    async sync (data: SyncComponentData, node: Node) {
        if (!data.__type__) {
            return;
        }

        let comp = node.getComponent(data.__type__);
        if (!comp) {
            try {
                comp = node.addComponent(data.__type__);
            }
            catch (err) {
                error(err);
            }
            if (!comp) {
                warn(`CocosSync: failed to add component ${data.__type__}.`);
                return;
            }
        }

        this.import(comp, data);
        if (this.postImport) {
            CocosSync.FinishedEvent.on(() => {
                this.postImport!(comp!, data);
            })
        }
    }

    abstract import (comp: Component, data: SyncComponentData): any;

    postImport (comp: Component, data: SyncComponentData) { }
}

