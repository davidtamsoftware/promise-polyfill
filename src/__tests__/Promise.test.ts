import { Promise } from "../Promise";

jest.setTimeout(1000);
describe("Promise", () => {
    test("race (promise + thenables)", (done) => {
        expect.assertions(1);
        Promise.race<string | number>([
            { then: (resolve, reject) => setTimeout(() => reject(10), 50)},
            new Promise((resolve, reject) => setTimeout((() => resolve("test")), 100)),
        ])
            .catch((err: any) => {
                expect(err).toBe(10);
                done();
            });
    });

    test("race (promise + nested thenables)", (done) => {
        expect.assertions(1);
        Promise.race<string | number>([
            { then: (resolve, reject) => setTimeout(() => resolve({ then: (res, rej) => res(10)}), 50)},
            new Promise((resolve, reject) => setTimeout((() => resolve("test")), 100)),
        ])
            .then((err: any) => {
                expect(err).toBe(10);
                done();
            });
    });

    test("race (promises)", (done) => {
        expect.assertions(1);
        Promise.race([
            new Promise((resolve, reject) => setTimeout(resolve, 300)),
            new Promise((resolve, reject) => setTimeout((() => reject("test")), 100)),
        ])
            .catch((err: any) => {
                expect(err).toBe("test");
                done();
            });
    });

    test("race (non promises)", (done) => {
        expect.assertions(1);
        Promise.race([1, 2])
            .then((value: any) => {
                expect(value).toBe(1);
                done();
            });
    });

    test("race (some promises and non promises)", (done) => {
        expect.assertions(1);
        Promise.race<any>([
            new Promise((resolve, reject) => setTimeout(resolve, 300)),
            "test",
        ])
            .then((value: any) => {
                expect(value).toBe("test");
                done();
            });
    });

    test("resolve", (done) => {
        expect.assertions(1);
        let result = "";
        Promise.resolve(1)
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => result += `fail: ${arg}`)
            .then((arg: any) => {
                expect(result).toBe("success: 1");
                done();
            });
    });

    test("resolve custom thenable", (done) => {
        expect.assertions(1);
        let result = "";
        Promise.resolve({ then: (resolve, reject) => setTimeout(() => resolve(1), 50)})
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => result += `fail: ${arg}`)
            .then((arg: any) => {
                expect(result).toBe("success: 1");
                done();
            });
    });

    test("resolve promise", (done) => {
        expect.assertions(1);
        let result = "";
        Promise.resolve(new Promise<number>((resolve, reject) => setTimeout(() => resolve(1), 50)))
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => result += `fail: ${arg}`)
            .then((arg: any) => {
                expect(result).toBe("success: 1");
                done();
            });
    });

    test("detect cycles", (done) => {
        expect.assertions(1);
        const p: Promise<any> = Promise.resolve(1).then(() => p);
        p.catch((err) => {
            expect(err).toBeInstanceOf(Error);
            done();
        });
    });

    test("reject", (done) => {
        expect.assertions(1);
        let result = "";
        Promise.reject(1)
            .then((arg: any) => result += `success: ${arg}`)
            .catch((arg: any) => {
                result += `fail: ${arg}`;
                expect(result).toBe("fail: 1");
                done();
            });
    });

    test("all (non promises)", (done) => {
        expect.assertions(1);
        const p = Promise.all([
            "a",
            { test: "testing" },
            1])
            .then((result: any) => {
                expect(result).toMatchObject(["a", { test: "testing" }, 1]);
                done();
            });
    });

    test("all (some promises and non promises)", (done) => {
        expect.assertions(1);
        const p = Promise.all<string|number>([
            "a",
            new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
            1])
            .then((result: any) => {
                expect(result).toMatchObject(["a", 123, 1]);
                done();
            });
    });

    test("all (promise + thenable)", (done) => {
        expect.assertions(1);
        const p = Promise.all<number | string>([
            { then: (resolve, reject) => setTimeout(() => resolve("a"), 50)},
            new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
            1])
            .then((result: any) => {
                expect(result).toMatchObject(["a", 123, 1]);
                done();
            });
    });

    test("all (promise + nested thenable)", (done) => {
        expect.assertions(1);
        const p = Promise.all<number | string>([
            { then: (resolve, reject) => setTimeout(() => resolve({ then: (res, rej) => res("a")}), 50)},
            new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
            1])
            .then((result: any) => {
                expect(result).toMatchObject(["a", 123, 1]);
                done();
            });
    });

    test("all (unordered then)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = Promise.resolve(1);
        const p2 = Promise.resolve(2);
        const p3 = Promise.all([p1, p2]);

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
        const p1 = Promise.resolve(1);
        const p2 = Promise.resolve(2);
        const p3 = Promise.all([p1, p2]);

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
        const p1 = Promise.resolve(1);
        const p2 = Promise.resolve(2);
        const p3 = Promise.all([p1, p2]);

        p3
            .then((arg: any) => result += `3:${arg};`);

        const chain1 = p1
            .then((arg: any) => result += `1:${arg};`)
            .finally(() => result += `1.1:finally;`);

        const chain2 = p2
            .then((arg: any) => result += `2:${arg};`)
            .then((arg: any) => result += `2.1:${arg};`)
            .finally(() => result += `2.2:finally;`);

        Promise.all<any>([p3, chain1, chain2]).then(() => {
            expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
            done();
        });
    });

    test("all (unordered then 2)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = Promise.resolve(1);
        const p2 = Promise.resolve(2);
        const p3 = Promise.all([p1, p2]);

        const chain1 = p1
            .then((arg: any) => result += `1:${arg};`)
            .finally(() => result += `1.1:finally;`);

        p3
            .then((arg: any) => result += `3:${arg};`);

        const chain2 = p2
            .then((arg: any) => result += `2:${arg};`)
            .then((arg: any) => result += `2.1:${arg};`)
            .finally(() => result += `2.2:finally;`);

        Promise.all<any>([chain1, chain2, p3]).then(() => {
            expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
            done();
        });
    });

    test("all (ordered then/finally 2)", (done) => {
        expect.assertions(1);
        let result = "";
        const p1 = Promise.resolve(1);
        const p2 = Promise.resolve(2);
        const p3 = Promise.all([p1, p2]);

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

        Promise.all<any>([chain1, chain2, p3])
            .then(() => {
                expect(result).toBe("1:1;2:2;3:1,2;1.1:finally;2.1:1:1;2:2;;2.2:finally;");
                done();
            });
    });

    test("constructor", (done) => {
        expect.assertions(1);
        let result = "";
        const p = new Promise((resolve, reject) => {
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

    test("throw an error from fulfillment handler", (done) => {
        expect.assertions(1);
        const promise1 = new Promise((resolve, reject) => {
            resolve(2);
        });

        promise1
            .then((a: any) => {
                throw new Error("test");
            })
            .catch((a) => {
                expect(a).toBeInstanceOf(Error);
                done();
            });
    });

    test("throw an error from rejection handler", (done) => {
        expect.assertions(1);
        const promise1 = new Promise((resolve, reject) => {
            reject(2);
        });

        promise1
            .catch((a: any) => {
                throw new Error("test");
            })
            .catch((a) => {
                expect(a).toBeInstanceOf(Error);
                done();
            });
    });

    test("attempt to resolve and reject", (done) => {
        expect.assertions(1);
        let result = "";
        const promise1 = new Promise((resolve, reject) => {
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

    test("attempt to resolve and reject and throw error", (done) => {
        expect.assertions(1);
        let result = "";
        const promise1 = new Promise((resolve, reject) => {
            throw new Error("a");
            resolve(1);
            reject(2);
            throw new Error("b");
        });

        promise1
            .then(
                (a: any) => result += `resolved with ${a}`,
                (a: any) => result += `rejected with ${a}`)
            .finally(() => {
                expect(result).toBe("rejected with Error: a");
                done();
            });
    });

    test("attempt to resolve an error and then throw should only reject the first", (done) => {
        expect.assertions(1);
        let result = "";
        const promise1 = new Promise((resolve, reject) => {
            resolve({
                then: () => {
                    throw new Error("a");
                },
            });
            throw new Error("b");
        });

        promise1
            .then(
                (a: any) => result += `resolved with ${a}`,
                (a: any) => result += `rejected with ${a}`)
            .finally(() => {
                expect(result).toBe("rejected with Error: a");
                done();
            });
    });

    test("all with success", (done) => {
        expect.assertions(1);
        let result: any;
        const p = Promise.all([
            Promise.resolve(1),
            Promise.resolve(2),
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
        const p = Promise.all<any>([
            Promise.reject("ERROR"),
            Promise.resolve(1),
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
