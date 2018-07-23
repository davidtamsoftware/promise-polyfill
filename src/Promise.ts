type State = "pending" | "fulfilled" | "rejected";

export class Promise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];

    public static race(promises: Promise[]) {
        return new Promise((resolve, reject) => {
            promises.forEach((promise) => {
                promise
                    .then((val: any) => {
                        resolve(val);
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
            });
        });
    }

    public static all(promises: Promise[]) {
        return new Promise((resolve, reject) => {
            const promiseCount = promises.length;
            let fulfilledPromises = 0;
            const completedPromiseValues: any[] = [];
            promises.forEach((promise, index) => {
                promise
                    .then((val: any) => {
                        completedPromiseValues[index] = val;
                        fulfilledPromises++;
                        if (fulfilledPromises === promiseCount) {
                            resolve(completedPromiseValues);
                        }
                    })
                    .catch((err: any) => {
                        reject(err);
                    });
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
        executor(this.resolve, this.reject);
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

    private resolve(val: any) {
        if (this.state === "pending") {
            this.value = val;
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

    private resolvePromiseChain(value: Promise, resolve: any) {
        if (value instanceof Promise) {
            value.then((val: any) => {
                this.resolvePromiseChain(val, resolve);
            });
        } else {
            resolve(value);
        }
    }

    private createChainedPromise(onFilfillment: any, onRejection: any, onFinally: any) {
        const p = new Promise((resolve, reject) => {
            this.fulfillmentHandler.push(() => {
                try {
                    const value = onFilfillment ? onFilfillment(this.value) : this.value;
                    this.resolvePromiseChain(value, resolve);
                } catch (error) {
                    reject(error);
                }
            });

            if (onRejection) {
                this.rejectionHandler.push(() => {
                    try {
                        onRejection(this.error);
                        resolve();
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

(window as any).Promise = Promise;
