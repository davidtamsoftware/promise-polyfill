type State = "pending" | "fulfilled" | "rejected";
type SingleArgCallback = (arg?: any) => any;
type NoArgCallback = () => any;

export class Promise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandlers: any[] = [];
    private rejectionHandlers: any[] = [];

    public static race(entries: any[]) {
        return new Promise((resolve, reject) => {
            entries.forEach((entry) => {
                if (entry instanceof Promise) {
                    entry.then(resolve, reject);
                } else {
                    resolve(entry);
                }
            });
        });
    }

    public static all(entries: any[]) {
        return new Promise((resolve, reject) => {
            const count = entries.length;
            let fulfilledPromises = 0;
            const resolvedEntries: any[] = [];
            entries.forEach((entry, index) => {
                if (entry instanceof Promise) {
                    entry.then(
                        (val) => {
                            resolvedEntries[index] = val;
                            fulfilledPromises++;
                            if (fulfilledPromises === count) {
                                resolve(resolvedEntries);
                            }
                        },
                        reject);
                } else {
                    resolvedEntries[index] = entry;
                    fulfilledPromises++;
                    if (fulfilledPromises === count) {
                        resolve(resolvedEntries);
                    }
                }
            });
        });
    }

    public static resolve(value: any) {
        return new Promise((resolve, reject) => resolve(value));
    }

    public static reject(err: any) {
        return new Promise((resolve, reject) => reject(err));
    }

    constructor(executor: (resolve: SingleArgCallback, reject: SingleArgCallback) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        let resolveInProgress = false;
        try {
            const chain: any[] = [];
            chain.push(this);
            executor((val: any) => {
                if (!resolveInProgress) {
                    resolveInProgress = true;
                    this.resolveChain(val, this.resolve, this.reject, chain);
                }
            }, ((val: any) => {
                if (!resolveInProgress) {
                    this.reject(val);
                }
            }));
        } catch (error) {
            if (!resolveInProgress) {
                this.reject(error);
            }
        }
    }

    public then(onFulfillment?: SingleArgCallback, onRejection?: SingleArgCallback) {
        return this.createChainedPromise(onFulfillment, onRejection, undefined);
    }

    public catch(onRejection: SingleArgCallback) {
        return this.createChainedPromise(undefined, onRejection, undefined);
    }

    public finally(onFinally: NoArgCallback) {
        return this.createChainedPromise(undefined, undefined, onFinally);
    }

    private resolve(value: any) {
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

    private isThenable(value: any) {
        let isThenable = false;

        if (value && typeof value === "object" || typeof value === "function") {
            const prop = Object.getOwnPropertyDescriptor(value, "then");
            isThenable = value instanceof Promise ||
                (!!prop && (typeof prop.get === "function" ||
                    typeof prop.value === "function"));
        }

        return isThenable;
    }

    private resolveChain(value: any, resolve: any, reject: any, chain: any[]) {
        try {
            if (chain.indexOf(value) >= 0) {
                throw new TypeError("circular reference detected");
            }
            if (this.isThenable(value)) {
                chain.push(value);

                if (value instanceof Promise) {
                    value.then(
                        (a: any) => this.resolveChain(a, resolve, reject, chain),
                        (a: any) => reject(a));
                } else {
                    const p = new Promise((res, rej) => value.then(res, rej));
                    p.then(
                        (a: any) => this.resolveChain(a, resolve, reject, chain),
                        (a: any) => reject(a));
                }
            } else {
                resolve(value);
            }
        } catch (error) {
            reject(error);
        }
    }

    private createChainedPromise(
        onFulfillment?: SingleArgCallback, onRejection?: SingleArgCallback, onFinally?: NoArgCallback) {
        const p = new Promise((resolve, reject) => {
            this.fulfillmentHandlers.push(() => {
                try {
                    const chain = [];
                    chain.push(p);
                    const value = onFulfillment instanceof Function ? onFulfillment(this.value) : this.value;
                    this.resolveChain(value, resolve, reject, chain);
                } catch (error) {
                    reject(error);
                }
            });

            this.rejectionHandlers.push(() => {
                try {
                    if (onRejection instanceof Function) {
                        const chain = [];
                        chain.push(p);
                        const value = onRejection(this.error);
                        this.resolveChain(value, resolve, reject, chain);
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
