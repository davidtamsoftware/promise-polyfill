type State = "pending" | "fulfilled" | "rejected";

class MyPromise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];
    private finallyHandler: any[] = [];

    // used for Promise.all handlers that should execute after finally
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

    constructor(executor: (resolve: any, reject: any) => any) {
        this.state = "pending";
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        executor(this.resolve, this.reject);
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
            this.value = this.fulfillmentHandler.shift()(this.value);
        }
        this.handleFinally();
    }

    private handleReject() {
        while (this.rejectionHandler.length > 0) {
            this.value = this.rejectionHandler.shift()(this.error);
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
        return this.createChainedPromise();
    }

    public catch(onRejection: any) {
        this.rejectionHandler.push(onRejection);
        return this.createChainedPromise();
    }

    public finally(onFinally: any) {
        this.finallyHandler.push(onFinally);
        return this.createChainedPromise();
    }

    private createChainedPromise() {
        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "fulfilled") {
            this.handleResolve();
        } else if (this.state === "rejected") {
            this.handleReject();
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

// const p0 = MyPromise.reject("b");

// p0.then(
//     (val: any) => console.log("value is " + val),
//     (val: any) => console.log("err is " + val));

// const p1 = new MyPromise((resolve, reject) => {
//     setTimeout(resolve, 3000, "hi");
// });

// const p2 = new MyPromise((resolve, reject) => {
//     setTimeout(resolve, 5000, "hello");
// });

// const p3 = MyPromise.all([p1, p2]);

// p3.then((val: any) => console.log("3: " + val));
// p1.then((val: any) => console.log("1: " + val), (val: any) => console.log("failed " + val));
// p2.then((val: any) => console.log("2: " + val));
// p1.finally(() => console.log("1.1: finished"));
// p3.then((val: any) => console.log("3.1: " + val), (val: any) => console.log("promise all failed " + val));

// const p1 = new MyPromise((resolve, reject) => {
//     setTimeout(resolve, 3000, "hi");
// })
// .then((a: any) => console.log("1" + a))
// .catch((a: any) => console.log("2" + a))
// .then((a: any) => console.log("3" + a));

// const p2 = new MyPromise((resolve, reject) => {
//     setTimeout(resolve, 3000, "hi");
// })
// .then((a: any) =>  { console.log("1" + a); return "bye"; })
// .catch((a: any) => { console.log("2" + a); return "hjh"; })
// .then((a: any) => console.log("3" + a));

// const p2 = new Promise((resolve, reject) => {
//     setTimeout(resolve, 3000, "hi");
// })
// .then((a) =>  { console.log("1" + a); return "bye"; })
// .catch((a) => { console.log("2" + a); return "hjh"; })
// .then((a) => console.log("3" + a));
