import {path} from './editor'

export function formatPath (p: string) {
    return p.replace(/\\/g, '/');
}

export function relpaceExt (fspath: string, extname: string) {
    let basename = path.basename(fspath).replace(path.extname(fspath), extname)
    return path.join(path.dirname(fspath), basename);
}
