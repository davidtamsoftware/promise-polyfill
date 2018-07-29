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
                    entry.then((val) => resolve(val), (err) => reject(err));
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
                        (err) => {
                            reject(err);
                        });
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

    constructor(executor: (resolve: any, reject: any) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        try {
            executor(this.resolve, this.reject);
        } catch (error) {
            this.reject(error);
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
        if (value && value.then instanceof Function) {
            if (value === this) {
                throw new TypeError("circular reference detected");
            }
            value.then((val: any) => this.resolve(val), (err: any) => this.reject(err));
        } else if (this.state === "pending") {
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
            const handler = this.fulfillmentHandlers.shift().bind(this);
            setTimeout(handler, 0);
        }
    }

    private handleReject() {
        while (this.rejectionHandlers.length > 0) {
            const handler = this.rejectionHandlers.shift().bind(this);
            setTimeout(handler, 0);
        }
    }

    private createChainedPromise(
        onFulfillment?: SingleArgCallback, onRejection?: SingleArgCallback, onFinally?: NoArgCallback) {
        const p = new Promise((resolve, reject) => {
            this.fulfillmentHandlers.push(() => {
                try {
                    let value;
                    if (!onFulfillment) {
                        value = this.value;
                    } else if (onFulfillment instanceof Function) {
                        value = onFulfillment(this.value);
                    } else if ((onFulfillment as any).then instanceof Function) {
                        value = onFulfillment;
                    } else {
                        value = this.value;
                    }
                    resolve(value);
                } catch (error) {
                    reject(error);
                }
            });

            if (onRejection && onRejection instanceof Function) {
                this.rejectionHandlers.push(() => {
                    try {
                        const value = onRejection(this.error);
                        resolve(value);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                this.rejectionHandlers.push(() => reject(this.error));
            }

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
