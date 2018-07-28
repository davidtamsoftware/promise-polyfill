type State = "pending" | "fulfilled" | "rejected";

export class Promise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];

    public static race(entries: any[]) {
        return new Promise((resolve, reject) => {
            entries.forEach((entry) => {
                if (entry instanceof Promise) {
                    entry
                        .then((val: any) => {
                            resolve(val);
                        })
                        .catch((err: any) => {
                            reject(err);
                        });
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
                    entry
                        .then((val: any) => {
                            resolvedEntries[index] = val;
                            fulfilledPromises++;
                            if (fulfilledPromises === count) {
                                resolve(resolvedEntries);
                            }
                        })
                        .catch((err: any) => {
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

    public then(onFilfillment: (val?: any) => any, onRejection?: (err?: any) => any) {
        return this.createChainedPromise(onFilfillment, onRejection, undefined);
    }

    public catch(onRejection: (err?: any) => any) {
        return this.createChainedPromise(undefined, onRejection, undefined);
    }

    public finally(onFinally: () => any) {
        return this.createChainedPromise(undefined, undefined, onFinally);
    }

    private resolve(value: any) {
        if (value instanceof Promise) {
            value.then((val: any) => {
                this.resolve(val);
            });
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
        while (this.fulfillmentHandler.length > 0) {
            const handler = this.fulfillmentHandler.shift().bind(this);
            setTimeout(handler, 0);
        }
    }

    private handleReject() {
        while (this.rejectionHandler.length > 0) {
            const handler = this.rejectionHandler.shift().bind(this);
            setTimeout(handler, 0);
        }
    }

    private createChainedPromise(onFilfillment: any, onRejection: any, onFinally: any) {
        const p = new Promise((resolve, reject) => {
            this.fulfillmentHandler.push(() => {
                try {
                    const value = (onFilfillment && onFilfillment instanceof Function) ?
                        onFilfillment(this.value) : this.value;
                    resolve(value);
                } catch (error) {
                    reject(error);
                }
            });

            if (onRejection && onRejection instanceof Function) {
                this.rejectionHandler.push(() => {
                    try {
                        const value = onRejection(this.error);
                        resolve(value);
                    } catch (error) {
                        reject(error);
                    }
                });
            } else {
                this.rejectionHandler.push(() => reject(this.error));
            }

            if (onFinally) {
                this.fulfillmentHandler.push(onFinally);
                this.rejectionHandler.push(onFinally);
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
