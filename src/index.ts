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
            let fulfilledPromises = 0;
            const completedPromiseValues: any[] = [];
            promises.forEach((entry, index) => {
                entry
                    .then((val: any) => {
                        completedPromiseValues[index] = val;
                        fulfilledPromises++;
                        if (fulfilledPromises === promiseCount) {
                            resolve(completedPromiseValues);
                        }
                    })
                    .catch((e: any) => {
                        reject(e);
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

    public then(onFilfillment: any, onRejection?: any) {
        return this.createChainedPromise(onFilfillment, onRejection, undefined);
    }

    public catch(onRejection: any) {
        return this.createChainedPromise(undefined, onRejection, undefined);
    }

    public finally(onFinally: any) {
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

    private createChainedPromise(onFilfillment: any, onRejection: any, onFinally: any) {
        const p = new MyPromise((resolve, reject) => {
            this.fulfillmentHandler.push(() => {
                try {
                    const value = onFilfillment ? onFilfillment(this.value) : this.value;
                    resolve(value);
                } catch (error) {
                    reject(error);
                }
            });

            if (onRejection) {
                this.rejectionHandler.push(() => {
                    try {
                        onRejection(this.error);
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

// let result = "";
// let p1;
// let p2;
// let p3;
// function stack1() {
//     p1 = MyPromise.resolve(1);
//     p2 = MyPromise.resolve(2);
// }
// stack1();
// p3 = MyPromise.all([p1 as any, p2 as any]);
// const a = p3.then((arg: any) => result += `3:${arg};`);

// a.then(() => console.log("***" + result));

// (p1 as any).then((arg: any) => result += `1:${arg};`);
// (p2 as any).then((arg: any) => result += `2:${arg};`);

// let result = "";
// const p1 = MyPromise.resolve(1);
// const p2 = MyPromise.resolve(2);
// const p3 = MyPromise.all([p1, p2]);

// const chain1 = p1
//     .then((arg: any) => result += `1:${arg};`)
//     .finally(() => result += `1.1:finally;`);

// p3
//     .then((arg: any) => result += `3:${arg};`);

// const chain2 = p2
//     .then((arg: any) => result += `2:${arg};`)
//     .then((arg: any) => result += `2.1:${arg};`)
//     .finally(() => result += `2.2:finally;`);

// MyPromise.all([chain1, p3, chain2]).then(() => {
//     console.log("********************");
// });

let result = "";
// const p = MyPromise.all([
//     MyPromise.resolve(1),
//     MyPromise.reject("ERROR"),
// ]);

const p = new MyPromise((resolve, reject) => setTimeout(reject, 1000));
p
    .then((v: any) => {
        result += v;
        console.log("1");
    })
    .catch((e: any) => {
        result += e;
        console.log("a");
    })
    .finally(() => {
        console.log("tes");
    });
