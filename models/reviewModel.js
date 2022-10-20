const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo index để 1 tour chỉ có 1 reivew thuộc 1 user, thuọc tính duy nhât
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Hàm này dùng để tính toán trung bình đánh giá(reviews),
// Xử lý liên quan đến các model thì sử dung statics, còn đên document thì dùng methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', // nhóm các tour có cùng id
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  //console.log(stats);
  // Vì stats trả ra 1 aray nên phải chỉ định stats[0], console.log để biết
  // if để tránh lỗi khi xoá hết review chỉ còn 0
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Gọi hàm trên sau khi tạo 1 review để tính toán lại
reviewSchema.post('save', function () {
  // this.constructor sẽ trỏ đến model hiện tại
  this.constructor.calcAverageRatings(this.tour);
});

// Vì findByIdAndUpdate và findByIdAndDelete thực chât là findOneAndUpdate và findOneAndDelte nên dùng Regex /^findOneAnd/
// Lưu ý: hàm này chạy trước khi dữ liệu bị update và xoá nên mới lấy được id của review và tour
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Lưu dữ liệu để truyền xuống phần post khi đữ liệu đã đươc cập nhật để xử lý, nhiệm vụ hàm này chỉ là lấy id review, id tour
  this.r = await this.findOne().clone(); // Clone docment để tránh bị lỗi
  console.log(this.r);
  next();
});

// Xử lý khi dữ liệu đã được update hoặc xoá, được truyền từ hàm trên
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
