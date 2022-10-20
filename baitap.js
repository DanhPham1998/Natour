const { rejects } = require('assert');
const { Console } = require('console');
const crypto = require('crypto');
const { userInfo } = require('os');
const { resolve } = require('path');
const { runInContext } = require('vm');
// 1) Hoc Class
//function car(name, price) {
//   this.name = name;
//   this.price = price;
//   this.run = function () {
//     console.log(this.name);
//   };
// }

// car.prototype.netbo = function () {
//   console.log(this);
// };
// const audi = new car('audi 222', 200);
// audi.run();
// audi.netbo();
// console.log(audi);

// 2) CallBack
// function func1(calllBack) {
//   setTimeout(() => {
//     console.log('Dua Tien');
//     calllBack();
//   }, 7000);
// }

// function muado() {
//   setTimeout(() => {
//     console.log('Thoi Tien');
//   }, 5000);
// }
// func1(muado);

//3) Promises
// var promise = new Promise(function (resolve, reject) {
//   var ran = 2;
//   if (ran % 2 === 0) {
//     setTimeout(function () {
//       resolve('day la so chan');
//     }, 5000);
//   } else {
//     reject('day la so le');
//   }
// });

// promise
//   .then((value) => {
//     console.log(value);
//   })
//   .then((value) => {
//     console.log(value);
//   })
//   .catch((value) => {
//     console.log(value);
//   });
// console.log('giatri', promise);

// 4) async/ await

// const addPromise = (a, b) => {
//   return new Promise((resolve, rejects) => {
//     setTimeout(() => {
//       if (typeof a != 'number' || typeof b != 'number') {
//         return rejects(new Error('Tham so phai la kieu number'));
//       }
//       resolve(a + b);
//     }, 2000);
//   });
// };

// Xử lý theo kiểu promise
// add(4, 5)
//   .then((result) => {
//     console.log(result);
//   })
//   .then(() => {
//     console.log('Chay 2');
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// Xử lý theo async/ await
// const add = async () => {
//   //let run = await add(4, 5);
//   console.log(await addPromise(4, 5));
// };

// // Vì async trả ra 1 Promise nên có thể dùng then hoặc catch để bắt lôi
// add().then(() => {
//   console.log('Chay sau');
// });

// const resetToken = crypto.randomBytes(32).toString('hex');

// console.log(resetToken);

// const hashedToken = crypto
//   .createHash('sha256')
//   .update(resetToken)
//   .digest('hex');

// const hashedToken2 = crypto
//   .createHash('sha256')
//   .update(resetToken)
//   .digest('hex');

// console.log(hashedToken);

// const now =
//   Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000;
// console.log(now);

// console.log(__dirname);
const booking = [
  {
    _id: '6350c12dbc9fc95f57e4c84b',
    tour: {
      _id: '5c88fa8cf4afda39709c2974',
      name: 'The Northern Lights',
      guides: [Array],
      durationWeeks: NaN,
      id: '5c88fa8cf4afda39709c2974',
    },
    user: {
      _id: '634f76d096e860faa8daf341',
      name: 'User 2',
      photo: 'default.jpg',
      role: 'user',
      email: 'danhpham1@mailsac.com',
      __v: 0,
    },
    price: 1497,
    paid: true,
    createAt: '2022-10-20T03:29:27.517Z',
    __v: 0,
  },
];
console.log(booking[0].tour);
