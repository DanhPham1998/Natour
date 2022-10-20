const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const helmet = require('helmet');

// Start express app
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// Phục vụ file tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP header
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// Developer loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Request IP
const limiter = rateLimit({
  max: 100, // Sô request
  windowMs: 60 * 60 * 1000, // Time
  message: 'To many request with this IP',
});
app.use('/api', limiter);
app.use(cookieParser());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Chống mã đọc từ truy vấn NoSQL injection
app.use(mongoSanitize());

// Chống chèn mã js và html vào document
app.use(xss());

// Chống parameter đôc hại như bị trùng dữ liêu
app.use(
  // Loại bỏ các trường trùng dữ liệu trừ các fields trong whitelist
  hpp({
    whitelist: [
      'duration',
      'price',
      'maxGroupSize',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  //console.log(req.cookies);
  next();
});

// 2) ROUTER

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
// Xử lý các req gửi URL không chính xác, '*' là tất cả URL, nên nhớ MIDDLEWARE chạy theo thứ tự và sẽ chạy xuống 'globalErrorHandler'
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
