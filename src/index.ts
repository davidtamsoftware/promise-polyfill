type State = "pending" | "fulfilled" | "rejected";

class MyPromise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];
    private finallyHandler: any[] = [];
    private postFinallyHandler: any[] = [];

    public static all(promises: MyPromise[]) {
        const p = new MyPromise((resolve, reject) => {
            const promiseCount = promises.length;
            let fulfilledPromises = 0;
            let err: any;
            const completedPromiseValues: any[] = [];
            promises.forEach((entry, index) => {
                entry.then((val: any) => {
                    completedPromiseValues[index] = val;
                    fulfilledPromises++;
                });
                entry.catch((e: any) => {
                    err = e;
                });
                entry.postFinally(() => {
                    if (fulfilledPromises === promiseCount) {
                        resolve(completedPromiseValues);
                    } else if (err) {
                        reject(err);
                    }
                });
            });
        });
        return p;
    }

    public static resolve(value: any) {
        return new MyPromise((resolve, reject) => resolve(value));
    }

    public static reject(err: any) {
        return new MyPromise((resolve, reject) => reject(err));
    }

    constructor(callback: (resolve: any, reject: any) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        callback(this.resolve, this.reject);
    }

    private resolve(val: any) {
        this.value = val;
        this.state = "fulfilled";
        this.handleResolve();
    }

    private reject(err: any) {
        this.error = err;
        this.state = "rejected";
        this.handleReject();
    }

    private handleResolve() {
        while (this.fulfillmentHandler.length > 0) {
            this.fulfillmentHandler.shift()(this.value);
        }
        this.handleFinally();
    }

    private handleReject() {
        while (this.rejectionHandler.length > 0) {
            this.rejectionHandler.shift()(this.error);
        }
        this.handleFinally();
    }

    private handleFinally() {
        while (this.finallyHandler.length > 0) {
            this.finallyHandler.shift()();
        }
        while (this.postFinallyHandler.length > 0) {
            this.postFinallyHandler.shift()();
        }
    }

    public then(onFilfillment: any, onRejection?: any) {
        this.fulfillmentHandler.push(onFilfillment);
        if (onRejection) {
            this.rejectionHandler.push(onRejection);
        }

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "fulfilled") {
            this.handleResolve();
        }

        if (onRejection && this.state === "rejected") {
            this.handleReject();
        }

        return p;
    }

    public catch(onRejection: any) {
        this.rejectionHandler.push(onRejection);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "rejected") {
            this.handleReject();
        }

        return p;
    }

    public finally(onFinally: any) {
        this.finallyHandler.push(onFinally);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "rejected" || this.state === "fulfilled") {
            this.handleFinally();
        }

        return p;
    }

    private postFinally(onFinally: any) {
        this.postFinallyHandler.push(onFinally);
        if (this.state === "rejected" || this.state === "fulfilled") {
            this.handleFinally();
        }
    }
}

export default MyPromise;

const p1 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 3000, "hi");
});

const p2 = new MyPromise((resolve, reject) => {
    setTimeout(resolve, 5000, "hello");
});

const p3 = MyPromise.all([p1, p2]);

p3.then((val: any) => console.log("3: " + val));
p1.then((val: any) => console.log("1: " + val), (val: any) => console.log("failed " + val));
p2.then((val: any) => console.log("2: " + val));
p1.finally(() => console.log("1.1: finished"));
p3.then((val: any) => console.log("3.1: " + val), (val: any) => console.log("promise all failed " + val));
