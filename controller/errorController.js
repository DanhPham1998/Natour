const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Dùng Rexex tìm 1 chuối trong ngoặc ""
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];

  //const value = err.keyValue.name;
  //console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const arrayError = Object.values(err.errors).map((item) => item.message);

  // console.log(err.errors);
  const message = `Invalid iput data. ${arrayError.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token, Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expỉred, Please log in again', 401);
};

const sendErrorDev = (err, req, res) => {
  // A) Kiểm tra nêu là Url Api thì trả ra api như postman
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) Ngước lại render ra page
  console.error('ERROR ', err);
  return res.status(err.statusCode).render('error', {
    tittle: 'Somthing went wrong',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // isOperatinal lỗi đáng tin cậy gửi message tới client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // 1) Log error cho máy chủ client
    console.error('ERROR ', err);

    // 2) Gửi lỗi chung chung
    return res.status(500).json({
      status: 'error',
      message: 'Something wrong!',
    });
  }

  // B) RENDER WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      status: 'Something went wrong',
      msg: err.message,
    });
  }

  // 1) Log error cho máy chủ client
  console.error('ERROR ', err);

  // 2) Gửi lỗi chung chung
  return res.status(500).render('error', {
    status: 'Something wrong!',
    msg: 'Please try again',
  });
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = JSON.parse(JSON.stringify(err));
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Coppy toàn bộ obj err
    //let error = Object.create(err);
    let error = JSON.parse(JSON.stringify(err));
    console.log('ERROR xxx', error);
    error.message = err.message;
    //Kiểm tra nếu lỗi gửi về trong obj có key 'name' và value 'CastError' thì xác định là lỗi do DB
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    // console.log(err.message);
    sendErrorProd(error, req, res);
  }
};
