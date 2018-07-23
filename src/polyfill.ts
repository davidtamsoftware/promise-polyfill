import { Promise } from "./Promise";

let target;
if (window) {
    target = window;
} else if (global) {
    target = global;
} else if (self) {
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
