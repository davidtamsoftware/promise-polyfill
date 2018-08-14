/* tslint:disable */
console.log("starting app");

Promise.resolve(1)
    .then(function () {
        return { 
            then: function (res: any, rej: any) { 
                res(Promise.resolve(23));
                rej(0); 
                throw new Error();
            }
        }
    })
    .then(function(a) { 
        console.log("then: " + a);
    })
    .catch(function(a) {
        console.log("catch: " + a);
    });
