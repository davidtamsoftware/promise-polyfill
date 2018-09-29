import { Promise } from "../Promise";

jest.setTimeout(1000);
describe("Promise", () => {
    describe("race", () => {
        it("should resolve to thenables eventual value (promise + thenables)", (done) => {
            expect.assertions(1);
            Promise.race<string | number>([
                { then: (resolve, reject) => setTimeout(() => reject(10), 50) },
                new Promise((resolve, reject) => setTimeout((() => resolve("test")), 100)),
            ])
                .catch((err: any) => {
                    expect(err).toBe(10);
                    done();
                });
        });

        it("should resolve to nested thenables eventual value (promise + nested thenables)", (done) => {
            expect.assertions(1);
            Promise.race<string | number>([
                { then: (resolve, reject) => setTimeout(() => resolve({ then: (res, rej) => res(10) }), 50) },
                new Promise((resolve, reject) => setTimeout((() => resolve("test")), 100)),
            ])
                .then((err: any) => {
                    expect(err).toBe(10);
                    done();
                });
        });

        it("should resolve to the first resolved promise (promises)", (done) => {
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

        it("should resolve to the first resolved value (non promises)", (done) => {
            expect.assertions(1);
            Promise.race([1, 2])
                .then((value: any) => {
                    expect(value).toBe(1);
                    done();
                });
        });

        it("should resolve to the first resolved value (some promises and non promises)", (done) => {
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
    });

    describe("resolve", () => {
        it("should resolve provided value", (done) => {
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

        it("should resolve custom thenable eventual value", (done) => {
            expect.assertions(1);
            let result = "";
            Promise.resolve({ then: (resolve, reject) => setTimeout(() => resolve(1), 50) })
                .then((arg: any) => result += `success: ${arg}`)
                .catch((arg: any) => result += `fail: ${arg}`)
                .then((arg: any) => {
                    expect(result).toBe("success: 1");
                    done();
                });
        });

        it("should resolve promise's eventual value", (done) => {
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
    });

    it("should detect cycles in promise chain", (done) => {
        expect.assertions(1);
        const p: Promise<any> = Promise.resolve(1).then(() => p);
        p.catch((err) => {
            expect(err).toBeInstanceOf(Error);
            done();
        });
    });

    it("should reject provided value", (done) => {
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

    describe("all", () => {
        it("should resolve to provided values (non promises)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (some promises and non promises)", (done) => {
            expect.assertions(1);
            const p = Promise.all<string | number>([
                "a",
                new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
                1])
                .then((result: any) => {
                    expect(result).toMatchObject(["a", 123, 1]);
                    done();
                });
        });

        it("should resolve to eventual resolved values of each argument (promise + thenable)", (done) => {
            expect.assertions(1);
            const p = Promise.all<number | string>([
                { then: (resolve, reject) => setTimeout(() => resolve("a"), 50) },
                new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
                1])
                .then((result: any) => {
                    expect(result).toMatchObject(["a", 123, 1]);
                    done();
                });
        });

        it("should resolve to eventual resolved values of each argument (promise + nested thenable)", (done) => {
            expect.assertions(1);
            const p = Promise.all<number | string>([
                { then: (resolve, reject) => setTimeout(() => resolve({ then: (res, rej) => res("a") }), 50) },
                new Promise((resolve, reject) => setTimeout(() => resolve(123), 500)),
                1])
                .then((result: any) => {
                    expect(result).toMatchObject(["a", 123, 1]);
                    done();
                });
        });

        it("should resolve to eventual resolved values of each argument (unordered then)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (ordered then)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (unordered then)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (unordered then 2)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (ordered then/finally 2)", (done) => {
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

        it("should resolve to eventual resolved values of each argument (all with success)", (done) => {
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

        it("should resolve to first error in list (error)", (done) => {
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

    it("should construct a new promise", (done) => {
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

    describe("exception handling", () => {
        it("should catch errors thrown from fulfillment handler", (done) => {
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

        it("should catch errors thrown from rejection handler", (done) => {
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
    });

    describe("attempting to resolve promise multiple times", () => {
        it("should ignore attempt to reject after promise is resolved", (done) => {
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

        it("should ignore attempt to resolve after promise is resolved", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                resolve(1);
                resolve(2);
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("resolved with 1");
                    done();
                });
        });

        it("should ignore exception thrown after promise is resolved", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                resolve(1);
                throw new Error("error");
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("resolved with 1");
                    done();
                });
        });

        it("should ignore attempt to reject after promise is rejected", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                reject(1);
                reject(2);
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with 1");
                    done();
                });
        });

        it("should ignore attempt to resolve after promise is rejected", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                reject(1);
                resolve(2);
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with 1");
                    done();
                });
        });

        it("should ignore exception thrown after promise is rejected", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                reject(1);
                throw new Error("error");
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with 1");
                    done();
                });
        });

        it("should ignore attempt to reject after promise throws exception", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                throw new Error("error");
                reject(2);
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with Error: error");
                    done();
                });
        });

        it("should ignore attempt to resolve after promise throws exception", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                throw new Error("error");
                resolve(1);
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with Error: error");
                    done();
                });
        });

        it("should ignore exception thrown after promise throw exception", (done) => {
            expect.assertions(1);
            let result = "";
            const promise1 = new Promise((resolve, reject) => {
                throw new Error("error1");
                throw new Error("error1");
            });

            promise1
                .then((a: any) => result += `resolved with ${a}`)
                .catch((a: any) => result += `rejected with ${a}`)
                .finally(() => {
                    expect(result).toBe("rejected with Error: error1");
                    done();
                });
        });

        it("should ignore attempt to reject after promise is resolved", (done) => {
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
    });
});
