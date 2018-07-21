import MyPromise from "../";

jest.setTimeout(100);
describe("MyPromise", () => {
    test("resolve", (done) => {
        expect.assertions(1);
        let result = "";
        MyPromise.resolve(1)
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => result += `fail: ${arg}`)
            .then((arg: any) => {
                expect(result).toBe("success: 1");
                done();
            });
    });

    test("reject", (done) => {
        expect.assertions(1);
        let result = "";
        MyPromise.reject(1)
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => {
                result += `fail: ${arg}`;
                expect(result).toBe("fail: 1");
                done();
            });
    });

    test("all (unordered then)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = MyPromise.resolve(1);
        const p2 = MyPromise.resolve(2);
        const p3 = MyPromise.all([p1, p2]);

        p3
            .then((arg: any) => result += `3:${arg};`)
            .then(() => {
                expect(result).toBe("1:1;2:2;3:1,2;");
                done();
            });
        p1.then((arg: any) => result += `1:${arg};`);
        p2.then((arg: any) => result += `2:${arg};`);
    });

    test("all (ordered then)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = MyPromise.resolve(1);
        const p2 = MyPromise.resolve(2);
        const p3 = MyPromise.all([p1, p2]);

        p1.then((arg: any) => result += `1:${arg};`);
        p2.then((arg: any) => result += `2:${arg};`);
        p3.then((arg: any) => result += `3:${arg};`)
            .then(() => {
                expect(result).toBe("1:1;2:2;3:1,2;");
                done();
            });
    });

    test("all (unordered then)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = MyPromise.resolve(1);
        const p2 = MyPromise.resolve(2);
        const p3 = MyPromise.all([p1, p2]);

        p3
            .then((arg: any) => result += `3:${arg};`);

        const chain1 = p1
            .then((arg: any) => result += `1:${arg};`)
            .finally(() => result += `1.1:finally;`);

        const chain2 = p2
            .then((arg: any) => result += `2:${arg};`)
            .then((arg: any) => result += `2.1:${arg};`)
            .finally(() => result += `2.2:finally;`);

        MyPromise.all([p3, chain1, chain2]).then(() => {
            expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
            done();
        });
    });

    test("all (unordered then 2)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = MyPromise.resolve(1);
        const p2 = MyPromise.resolve(2);
        const p3 = MyPromise.all([p1, p2]);

        const chain1 = p1
            .then((arg: any) => result += `1:${arg};`)
            .finally(() => result += `1.1:finally;`);

        p3
            .then((arg: any) => result += `3:${arg};`);

        const chain2 = p2
            .then((arg: any) => result += `2:${arg};`)
            .then((arg: any) => result += `2.1:${arg};`)
            .finally(() => result += `2.2:finally;`);

        MyPromise.all([chain1, chain2, p3]).then(() => {
            expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
            done();
        });
    });

    test("all (ordered then/finally 2)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = MyPromise.resolve(1);
        const p2 = MyPromise.resolve(2);
        const p3 = MyPromise.all([p1, p2]);

        const chain1 = p1
            .then((arg: any) => result += `1:${arg};`)
            .finally(() => result += `1.1:finally;`);

        const chain2 = p2
            .then((arg: any) => result += `2:${arg};`)
            .then((arg: any) => result += `2.1:${arg};`)
            .finally(() => result += `2.2:finally;`);

        p3
            .then((arg: any) => result += `3:${arg};`)
            .catch(() => ({}));

        MyPromise.all([chain1, chain2, p3])
            .then(() => {
                expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
                done();
            });
    });

    test("constructor", (done) => {
        expect.assertions(1);
        let result = "";
        const p = new MyPromise((resolve, reject) => {
            resolve(1);
        });

        p
            .then((arg: any) => result += `then:${arg}`)
            .catch((arg: any) => result += `catch:${arg}`)
            .finally(() => {
                expect(result).toBe("then:1");
                done();
            });
    });

    test("attempt to resolve and reject v1", (done) => {
        expect.assertions(1);
        let result = "";
        const promise1 = new MyPromise((resolve, reject) => {
            resolve(1);
            reject(2);
        });

        promise1
            .then((a: any) => result += `resolved with ${a}`)
            .catch((a: any) => result += `rejected with ${a}`)
            .finally(() => {
                expect(result).toBe("resolved with 1");
                done();
            });
    });

    test("attempt to resolve and reject v2", (done) => {
        expect.assertions(1);
        let result = "";
        const promise1 = new MyPromise((resolve, reject) => {
            resolve(1);
            reject(2);
        });

        promise1
            .then(
                (a: any) => result += `resolved with ${a}`,
                (a: any) => result += `rejected with ${a}`)
            .finally(() => {
                expect(result).toBe("resolved with 1");
                done();
            });
    });

    test("all with success", (done) => {
        expect.assertions(1);
        let result: any;
        const p = MyPromise.all([
            MyPromise.resolve(1),
            MyPromise.resolve(2),
        ]);

        p
            .then((v: any) => result = v)
            .catch((e: any) => result = e)
            .finally(() => {
                expect(result).toEqual([1, 2]);
                done();
            });
    });

    test("all with error", (done) => {
        expect.assertions(1);
        let result = "";
        const p = MyPromise.all([
            MyPromise.reject("ERROR"),
            MyPromise.resolve(1),
        ]);

        p
            .then((v: any) => result += v)
            .catch((e: any) => result += e)
            .finally(() => {
                expect(result).toBe("ERROR");
                done();
            });
    });
});
