import { log } from 'cc';
import { EDITOR } from 'cc/env';
import { io } from '../utils/editor';

if (EDITOR) {
    let globalAny = (global as any);
    if (!globalAny._ioApp) {
        globalAny._ioSocket = undefined;
        globalAny._ioApp = io('8877')
        globalAny._ioApp!.on('connection', (socket: any) => {
            log('CocosSync SocketIO Connected!');

            socket.on('disconnect', () => {
                globalAny._ioSocket = undefined;
                log('CocosSync SocketIO Disconnected!');
            });

            socket.on('sync-datas-with-file', function (data: any) {
                CocosSync.syncDataFile(data);
            });
            socket.on('sync-datas', function (data: any) {
                CocosSync.sync(data);
            });

            socket['get-asset-detail'] = function (uuid: string, cb: Function) {
                _ioSocket!.emit('get-asset-detail', uuid);
                _ioSocket!.once('get-asset-detail', cb);
            }

            globalAny._ioSocket = socket;
        })
    }
}
