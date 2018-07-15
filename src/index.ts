type State = "pending" | "fulfilled" | "rejected";

class MyPromise {
    private state: State;
    private value: any;
    private error: any;
    private fulfillmentHandler: any[] = [];
    private rejectionHandler: any[] = [];

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
                            resolve();
                        }
                    });
            });
        });
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
        if (this.fulfillmentHandler) {
            this.fulfillmentHandler.forEach((entry) => entry(this.value));
        }
    }

    private reject(err: any) {
        this.error = err;
        this.state = "rejected";
        if (this.rejectionHandler) {
            this.rejectionHandler.forEach((entry) => entry(this.error));
        }
    }

    public then(callback: any) {
        this.fulfillmentHandler.push(callback);

        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(resolve);
            this.rejectionHandler.push(reject);
        });

        if (this.state === "fulfilled") {
            callback(this.value);
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
            callback(this.value);
        }

        return p;
    }

    public finally(callback: any) {
        this.fulfillmentHandler.push(callback);
        this.rejectionHandler.push(callback);

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

// tslint:disable-next-line:no-console
console.log(p1);
// tslint:disable-next-line:no-console
console.log(p1.then((val: any) => console.log(val)));
