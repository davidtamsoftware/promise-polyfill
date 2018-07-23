import "whatwg-fetch";
import "./Promise";
console.log("starting app");

fetch("http://www.mocky.io/v2/5b54387a2f0000ff02061948")
    .then((val: Response) => {
        console.log("part1 :" + JSON.stringify(val));
        return val.json();
        // val.json().then((a: any) => {
        //     console.log("part1.1: " + JSON.stringify(a));
        // });
    })
    .then((a: any) => {
        console.log("part2: " + JSON.stringify(a));
    });
