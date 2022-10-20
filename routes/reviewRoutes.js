const express = require('express');
const reivewController = require('./../controller/reviewController');
const authController = require('./../controller/authController');

// "mergeParams: true" để cho phep được dùng thuộc tính "tourId" bên tourRouter
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reivewController.getAllRevew)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reivewController.setTourUserId,
    reivewController.createReview
  );

router.use(authController.protect);
router
  .route('/:id')
  .get(reivewController.getReview)
  .patch(
    authController.restrictTo('admin', 'user'),
    reivewController.updateReview
  )
  .delete(reivewController.deleteReview);
module.exports = router;
