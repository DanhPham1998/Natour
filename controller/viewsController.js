const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/appError');

exports.getOverView = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tour',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Tìm tour với slug params
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // Gửi dữ liệu render tới tang tour.pug
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Login into your account',
  });
});

exports.account = (req, res) => {
  res.status(200).render('account', {
    title: 'My account',
  });
};

exports.getMyBookings = catchAsync(async (req, res, next) => {
  // 1) Find all booking theo user
  const booking = await Booking.find({ user: req.user.id }).populate('user');

  const tourId = booking.map((el) => el.tour);

  //const tours = await Tour.find({ _id: { $in: tourId } });

  const tours = await Tour.find({ _id: tourId });
  // console.log(tourId);
  // 2) Response
  res.status(200).render('overview', {
    title: 'My Bookings',
    tours,
  });
});
