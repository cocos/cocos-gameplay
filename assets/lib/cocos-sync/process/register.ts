import { EDITOR } from 'cc/env';
import { error } from '../utils/editor';
import { SyncBase } from './sync-base';

export function register (syncClass: typeof SyncBase) {
    if (EDITOR) {
        if (!syncClass) {
            error('register syncClass failed : should pass a SyncBase.')
            return;
        }
        if (!syncClass.TYPE) {
            error('register syncClass failed : should declare the data name : ' + syncClass)
            return;
        }
        CocosSync.register(syncClass.TYPE, syncClass);
    }
}
