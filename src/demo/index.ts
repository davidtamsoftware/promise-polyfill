import "whatwg-fetch";
// import { Promise } from "../Promise";
console.log("starting app");

// fetch("http://www.mocky.io/v2/5b54387a2f0000ff02061948")
//     .then((val: Response) => {
//         console.log("part1 :" + JSON.stringify(val));
//         return val.json();
//     })
//     .then((a: any) => {
//         console.log("part2: " + JSON.stringify(a));
//         // a.products.forEach((product: any) => {
//         //     console.log(product.name);
//         // });
//     });

// const query = async () => {
//     try {
//         const response: Response = await fetch("http://www.mocky.io/v2/5b54387a2f0000ff02061948");
//         console.log(response);
//         const json = await response.json();
//         // json.products.forEach((product: any) => {
//         //     console.log(product.name);
//         // });
//         console.log("*****" + JSON.stringify(json));
//     } catch (error) {
//         console.log("Error " + error);
//     }
// };

const query2 = async () => {
    // const result = await Promise.resolve("1");
    const result = await new Promise((res, rej) => setTimeout(() => res(1), 2000));
    console.log("1211 : " + JSON.stringify(result));
    setTimeout(() => console.log("***" + JSON.stringify(result)), 3000);
    return result;
};

// const query3 = () => {
//     new Promise((res, rej) => {
//         setTimeout(() => res(1), 4000);
//     })
//     .then((result) => console.log("222 : " + result));
// };

query2();
