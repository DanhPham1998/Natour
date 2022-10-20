const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');
// const AppError = require('./../Utils/appError');
// const catchAsync = require('./../Utils/catchAsync');

exports.setTourUserId = (req, res, next) => {
  // Kiểm tra nếu dữ liệu gửi nếu không được gửi cùng body sẽ được chỉ định bằng router params
  //còn id user thì lưu ở bên authController.protect khi login
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getAllRevew = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
