type State = "pending" | "fulfilled" | "rejected";
type SingleArgCallback<T, U> = (arg?: T) => U;
type NoArgCallback = () => any;

interface Thenable<T> {
    then<U>(resolve: SingleArgCallback<T, any>, reject?: SingleArgCallback<T, any>): U | Thenable<U>;
}

export class Promise<T> implements Thenable<T> {
    private state: State;
    private value: T | undefined;
    private error: any;
    private fulfillmentHandlers: Array<SingleArgCallback<T, any>> = [];
    private rejectionHandlers: Array<SingleArgCallback<T, any>> = [];

    public static race<T>(entries: Array<T | Thenable<T>>): Promise<T> {
        return new Promise((resolve, reject) => {
            entries.forEach((entry) => {
                if (entry instanceof Promise) {
                    entry.then(resolve, reject);
                } else if (Promise.isThenable(entry)) {
                    new Promise<T>(
                        (res, rej) => (entry as Thenable<T>).then(res, rej))
                        .then(resolve, reject);
                } else {
                    resolve(entry as T | undefined);
                }
            });
        });
    }

    public static all<T>(entries: Array<T | Thenable<T>>): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const count = entries.length;
            let fulfilledPromises = 0;
            const resolvedEntries: any[] = [];

            const resolveIfComplete = (index: number, val: any) => {
                resolvedEntries[index] = val;
                fulfilledPromises++;
                if (fulfilledPromises === count) {
                    resolve(resolvedEntries);
                }
            };

            entries.forEach((entry, index) => {
                if (entry instanceof Promise) {
                    entry.then((val) => resolveIfComplete(index, val), reject);
                } else if (Promise.isThenable(entry)) {
                    new Promise<T>(
                        (res, rej) => (entry as Thenable<T>).then(res, rej))
                        .then((val) => resolveIfComplete(index, val), reject);
                } else {
                    resolveIfComplete(index, entry);
                }
            });
        });
    }

    public static resolve<T>(value: T): Promise<T> {
        return new Promise((resolve, reject) => resolve(value));
    }

    public static reject<T>(err: T): Promise<T> {
        return new Promise((resolve, reject) => reject(err));
    }

    private static isThenable(value: any) {
        if (value instanceof Promise) {
            return true;
        }

        // custom thenable
        if (value && typeof value === "object" || typeof value === "function") {
            const prop = Object.getOwnPropertyDescriptor(value, "then");
            return !!prop && (typeof prop.get === "function" || typeof prop.value === "function");
        }

        return false;
    }

    constructor(executor: (resolve: SingleArgCallback<T, void>, reject: SingleArgCallback<any, void>) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);

        // indicator used to ignore subsequent calls to resolve or reject
        let resolveInProgress = false;

        try {
            executor(
                (val) => {
                    if (!resolveInProgress) {
                        resolveInProgress = true;
                        this.resolveChain(val, this.resolve, this.reject, [this]);
                    }
                },
                (val) => {
                    if (!resolveInProgress) {
                        this.reject(val);
                    }
                });
            } catch (error) {
                if (!resolveInProgress) {
                this.reject(error);
            }
        }
    }

    public then<U>(
        onFulfillment?: SingleArgCallback<T, U | Thenable<U>>,
        onRejection?: SingleArgCallback<any, U | Thenable<U>>): Promise<U> {
        return this.createChainedPromise(onFulfillment, onRejection, undefined);
    }

    public catch<U>(onRejection: SingleArgCallback<T, U>): Promise<U> {
        return this.createChainedPromise(undefined, onRejection, undefined);
    }

    public finally(onFinally: NoArgCallback): Promise<T> {
        return this.createChainedPromise(undefined, undefined, onFinally);
    }

    private resolve(value: T | undefined) {
        if (this.state === "pending") {
            this.value = value;
            this.state = "fulfilled";
            this.handleResolve();
        }
    }

    private reject(err: any) {
        if (this.state === "pending") {
            this.error = err;
            this.state = "rejected";
            this.handleReject();
        }
    }

    private handleResolve() {
        while (this.fulfillmentHandlers.length > 0) {
            const handler = this.fulfillmentHandlers.shift();
            setTimeout(handler, 0);
        }
    }

    private handleReject() {
        while (this.rejectionHandlers.length > 0) {
            const handler = this.rejectionHandlers.shift();
            setTimeout(handler, 0);
        }
    }


    private resolveChain<U, V>(
        value: U | Thenable<U> | undefined,
        resolve: SingleArgCallback<U, V>,
        reject: SingleArgCallback<any, void>,
        chain: any[]) {
        if (chain.indexOf(value) >= 0) {
            throw new TypeError("circular reference detected");
        }

        if (Promise.isThenable(value)) {
            chain.push(value);

            let p: Promise<U | Thenable<U>>;
            if (value instanceof Promise) {
                p = value;
            } else {
                // wrap custom thenable into a promise
                p = new Promise<U | Thenable<U>>((res, rej) => (value as Thenable<U>).then(res, rej));
            }

            p.then<void>((a) => this.resolveChain(a, resolve, reject, chain), reject);
        } else {
            resolve(value as U);
        }
    }

    private createChainedPromise<U>(
        onFulfillment?: SingleArgCallback<T, U | Thenable<U>>,
        onRejection?: SingleArgCallback<any, U | Thenable<U>>,
        onFinally?: NoArgCallback): Promise<U> {

        const p = new Promise<U>((resolve, reject) => {
            // add then handler to current promise handler array, and when it is executed, trigger the chained
            // promise's resolve which will trigger it's own handlers, and work its way through the chain
            this.fulfillmentHandlers.push(() => {
                try {
                    const value = onFulfillment instanceof Function ? onFulfillment(this.value) : this.value;
                    this.resolveChain(value as any, resolve, reject, [this, p]);
                } catch (error) {
                    reject(error);
                }
            });

            // add catch handler to current promise handler array, and when it is executed, trigger the chained
            // promise's resolve which will trigger it's own handlers, and work its way through the chain
            this.rejectionHandlers.push(() => {
                try {
                    if (onRejection instanceof Function) {
                        const value = onRejection(this.error);
                        this.resolveChain(value, resolve, reject, [this, p]);
                    } else {
                        reject(this.error);
                    }
                } catch (error) {
                    reject(error);
                }
            });

            if (onFinally) {
                this.fulfillmentHandlers.push(onFinally);
                this.rejectionHandlers.push(onFinally);
            }
        });

        if (this.state === "fulfilled") {
            this.handleResolve();
        } else if (this.state === "rejected") {
            this.handleReject();
        }

        return p;
    }
}
