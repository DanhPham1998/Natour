const mongoose = require('mongoose');
require('dotenv').config();

// Xử lý ngoại lệ
process.on('uncaughtException', (err) => {
  console.log('UNHANDLE REJECTION! Shutting down');
  console.log(err.name, err.message);
  // Thoát chương trình khi gặp lỗi ngoại lệ
  process.exit(1);
});

const app = require('./app');
const DB = process.env.DATABASE_URL.replace('<PASSWORD>', process.env.PASSWORD);

mongoose.connect(DB, { useNewUrlParser: true }).then((con) => {
  console.log('DB connection successful!');
});

const port = process.env.PORT || 3000;
const sever = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Xử lý khi DB không thể kết nối
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLE REJECTION! Shutting down');
  // Tắt sever, thoát chương trình
  sever.close(() => {
    process.exit(1);
  });
});
