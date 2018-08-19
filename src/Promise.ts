type State = "pending" | "fulfilled" | "rejected";
type SingleArgCallback<T, U> = (arg: T) => U;
type NoArgCallback = () => any;
type FulfillmentHandler<T, U> = SingleArgCallback<T | Thenable<T>, U | Thenable<U>>;
type RejectionHandler<U> = SingleArgCallback<any, U | Thenable<U>>;

interface Thenable<T> {
    then<U>(resolve: FulfillmentHandler<T, U>, reject: RejectionHandler<U>): any;
}

export class Promise<T> implements Thenable<T> {
    private state: State;
    private value?: T;
    private error: any;
    private fulfillmentHandlers: Array<FulfillmentHandler<T, void>> = [];
    private rejectionHandlers: Array<RejectionHandler<void>> = [];

    public static race<T>(entries: Array<T | Thenable<T>>): Promise<T> {
        return new Promise(
            (resolve, reject) =>
                entries.forEach((entry) =>
                    Promise.resolveChain(entry, resolve, reject, [this])));
    }

    public static all<T>(entries: Array<T | Thenable<T>>): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const count = entries.length;
            let fulfilledPromises = 0;
            const resolvedEntries: T[] = [];

            const resolveIfComplete = (index: number, val: T) => {
                resolvedEntries[index] = val;
                fulfilledPromises++;
                if (fulfilledPromises === count) {
                    resolve(resolvedEntries);
                }
            };

            entries.forEach(
                (entry, index) =>
                    Promise.resolveChain(entry, (value) =>
                        resolveIfComplete(index, value as T), reject, []));
        });
    }

    public static resolve<T>(value: T | Thenable<T>): Promise<T> {
        return new Promise((resolve, reject) => resolve(value));
    }

    public static reject<T>(err: T | Thenable<T>): Promise<T> {
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

    constructor(
        executor: (resolve: FulfillmentHandler<T, void>, reject: RejectionHandler<void>) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);

        // indicator used to ignore subsequent calls to resolve or reject
        let executed = false;

        try {
            executor(
                (val) => {
                    if (!executed) {
                        executed = true;
                        Promise.resolveChain(val, this.resolve, this.reject, [this]);
                    }
                },
                (val) => {
                    if (!executed) {
                        executed = true;
                        this.reject(val);
                    }
                });
        } catch (error) {
            if (!executed) {
                this.reject(error);
            }
        }
    }

    public then<U>(
        onFulfillment?: FulfillmentHandler<T, U>,
        onRejection?: RejectionHandler<U>): Promise<U> {
        return this.createChainedPromise(onFulfillment, onRejection, undefined);
    }

    public catch<U>(onRejection: RejectionHandler<U>): Promise<U> {
        return this.createChainedPromise(undefined, onRejection, undefined);
    }

    public finally(onFinally: NoArgCallback): Promise<T> {
        return this.createChainedPromise(undefined, undefined, onFinally);
    }

    private resolve(value: T | undefined) {
        /* istanbul ignore next */
        if (this.state === "pending") {
            this.value = value;
            this.state = "fulfilled";
            this.handleResolve();
        }
    }

    private reject(err: any) {
        /* istanbul ignore next */
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

    private static resolveChain<U, V>(
        value: U | Thenable<U>,
        resolve: SingleArgCallback<U, void>,
        reject: SingleArgCallback<any, void>,
        chain: any[]) {

        if (chain.indexOf(value) >= 0) {
            throw new TypeError("circular reference detected");
        }

        if (Promise.isThenable(value)) {
            chain.push(value);

            let p: Promise<U>;
            if (value instanceof Promise) {
                p = value;
            } else {
                // wrap custom thenable into a promise
                p = new Promise<U>((res, rej) => (value as Thenable<U>).then(res, rej));
            }

            p.then<void>((a) => this.resolveChain(a, resolve, reject, chain), reject);
        } else {
            resolve(value as U);
        }
    }

    private createChainedPromise<U>(
        onFulfillment?: FulfillmentHandler<T, U>,
        onRejection?: RejectionHandler<U>,
        onFinally?: NoArgCallback): Promise<U> {

        const p = new Promise<U>((resolve, reject) => {
            // add then handler to current promise handler array, and when it is executed, trigger the chained
            // promise's resolve which will trigger it's own handlers, and work its way through the chain
            this.fulfillmentHandlers.push(() => {
                try {
                    const value = onFulfillment instanceof Function ? onFulfillment(this.value as T) : this.value;
                    Promise.resolveChain(value as any, resolve, reject, [this, p]);
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
                        Promise.resolveChain(value, resolve, reject, [this, p]);
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
