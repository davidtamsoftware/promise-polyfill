import { Promise } from "./Promise";

let target;
if (typeof window !== "undefined") {
    target = window;
} else if (typeof global !== "undefined") {
    target = global;
} else if (typeof self !== "undefined") {
    target = self;
}

if (!target) {
    console.log("Unable to register Promise polyfill");
} else if (!(target as any).Promise) {
    (target as any).Promise = Promise;
    console.log("Promise has been polyfilled");
} else {
    console.log("Promise is already supported");
}
