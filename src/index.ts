type State = "pending" | "fulfilled" | "rejected";

class MyPromise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];
    private finallyHandler: any[] = [];

    public static all(promises: MyPromise[]) {
        const p = new MyPromise((resolve, reject) => {
            const promiseCount = promises.length;
            let completedPromises = 0;
            const completedPromiseValues: any[] = [];
            const completedPromiseErrors: any[] = [];
            promises.forEach((entry, index) => {
                entry
                    .then((val: any) => {
                        completedPromiseValues[index] = val;
                    })
                    .catch((err: any) => {
                        completedPromiseErrors[index] = err;
                    })
                    .finally(() => {
                        completedPromises++;
                        if (completedPromises === promiseCount) {
                            resolve(completedPromiseValues);
                        }
                    });
            });
        });
        return p;
    }

    public static resolve(value: any) {
        return new MyPromise((resolve, reject) => {
            resolve(value);
        });
    }

    public static reject(err: any) {
        return new MyPromise((resolve, reject) => {
            reject(err);
        });
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
        while (this.fulfillmentHandler.length > 0) {
            this.fulfillmentHandler.pop()(this.value);
        }

        while (this.finallyHandler.length > 0) {
            this.finallyHandler.pop()();
        }
    }

    private reject(err: any) {
        this.error = err;
        this.state = "rejected";
        while (this.rejectionHandler.length > 0) {
            this.rejectionHandler.pop()(this.error);
        }

        while (this.finallyHandler.length > 0) {
            this.finallyHandler.pop()();
        }
    }

    public then(callback: any) {
        this.fulfillmentHandler.push(callback);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "fulfilled") {
            while (this.fulfillmentHandler.length > 0) {
                this.fulfillmentHandler.pop()(this.value);
            }
        }

        return p;
    }

    public catch(callback: any) {
        this.rejectionHandler.push(callback);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "rejected") {
            while (this.rejectionHandler.length > 0) {
                this.rejectionHandler.pop()(this.error);
            }
        }

        return p;
    }

    public finally(callback: any) {
        this.finallyHandler.push(callback);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "rejected" || this.state === "fulfilled") {
            callback(this.value);
        }

        return p;
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

p3.then((val: any) => console.log("bye: " + val));
// console.log(p1);
p1.then((val: any) => console.log("VAL: " + val));
p2.then((val: any) => console.log("VAL: " + val));
p1.finally(() => console.log("finished"));
