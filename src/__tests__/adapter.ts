import { Promise } from "../Promise";

const adapter = {
    resolved: Promise.resolve,
    rejected: Promise.reject,
    deferred: () => {
        const temp = {} as any;
        return {
            promise: new Promise((resolve: any, reject: any) => {
                temp.resolve = resolve;
                temp.reject = reject;
            }),
            resolve: temp.resolve,
            reject: temp.reject,
        };
    },
};

export = adapter;
