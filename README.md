# Promise Polyfill

This is a lightweight es5 promise polyfill written in TypeScript.

## Features

- Promises/A+ Compliant (https://promisesaplus.com/)
- Supports TypeScript generics
- Compatible within browser and node

# Installing the polyfill to use in a project

1. Install the dependency by running:

```
npm install --save git+https://git@github.com/davidtamsoftware/promise-polyfill.git
```

2. Importing into your application:

+ Module scope import
   
```javascript
import { Promise } from "promise-polyfill/dist/Promise";
```

+ Global application scope import

```javascript
import "promise-polyfill/dist/polyfill";
```

+ Global script import

```html
<script src="path/to/node_modules/promise-polyfill/dist/polyfill.js"></script>
```

Note: polyfill.js will only apply Promise if is it not supported by the browser.

# Example Usage

## JavaScript

```javascript
Promise.all([100, "a"]);

new Promise((resolve, reject) => resolve(1));
```

## TypeScript

```typescript
// string and number type
Promise.all<string | number>([100, "a"]);

// any type
Promise.all<any>([100, "a"]);

// number type inferred
Promise.all([100, 101]);

// number type
new Promise<number>((resolve, reject) => resolve(1));

// any type
new Promise<any>((resolve, reject) => {
    if (Math.round(Math.random())) {
        resolve(1);
    } else {
        resolve("a");
    }
});

// string any number type
new Promise<number | string>((resolve, reject) => {
    if (Math.round(Math.random())) {
        resolve(1);
    } else {
        resolve("a");
    }
});

// number type inferred
new Promise((resolve, reject) => resolve(1));
```

# Contributing to the library

## Building the polyfill

To build the polyfill, run:

```
npm run dist
```

## Unit tests

### All test (local + Promise A+ unit tests)

```
npm run test
```

### A+ unit test only

```
npm run test:aplus
```

### Local tests only

```
npm run test:unit
```

Watch mode:
```
npm run test:unit:watch
```

# Changelog

1.0.0
* Initial Version

# License

ISC