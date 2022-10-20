const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

mongoose.connect(DB, { useNewUrlParser: true }).then((con) => {
  console.log('DB connection successful!');
});

// READ FILE JS
const toursJS = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const usersJS = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviewsJS = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA JSON IN DB
const importData = async () => {
  try {
    await Tour.create(toursJS);
    await User.create(usersJS, { validateBeforeSave: false });
    await Review.create(reviewsJS);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE DATA IN DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Delete successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // Kill khỏi vòng conect
};

// Hàm xử lý khí nhập thêm "node dev-data/data/import-dev-data.js --import"
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
