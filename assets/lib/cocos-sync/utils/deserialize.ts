import { error } from "cc";

export function deserializeData<T>(data: string | T): T {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data) as T;
        }
        catch (err) {
            error(err);
        }
    }

    return data as any as T;
}