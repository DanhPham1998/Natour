const express = require('express');
const viewsController = require('./../controller/viewsController');
const authController = require('../controller/authController');
const bookingController = require('../controller/bookingController');
const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverView
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.login);
router.get('/me', authController.protect, viewsController.account);
router.get(
  '/my-bookings',
  authController.protect,
  viewsController.getMyBookings
);

module.exports = router;
