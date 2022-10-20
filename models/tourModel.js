const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

// Tao TourSchema (bang)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      maxlength: [40, 'A tour name must have more or equal then 10 characters'],
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },

    // Thời hạn
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    // Độ khó
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    // Đánh giá
    ratingsAverage: {
      type: Number,
      default: 4.6,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // làm tròn
    },

    // Số lượng đánh giá
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) shound be below regular price',
      },
    },

    // Tóm Tắt
    summary: {
      type: String,
      trim: true, // Dùng để loại bỏ khoảng trắng trước sâu của chuỗi vào DB
      required: [true, 'A tour must have a summary'],
    },

    // Mô tả
    description: {
      type: String,
      trim: true,
    },

    // Ảnh bìa
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],

    createAt: {
      type: Date,
      default: Date.now(),
      select: false, // Loại trừ cột createAt khi hiển thị
    },

    startDates: [Date],

    // Vị trí bắt đầu
    startLocation: {
      // Dùng GeoJSON để chỉ định data địa lý
      type: {
        type: String,
        default: 'Point',
        enum: 'Point',
      },
      // Toạ độ vĩ độ và kinh độ
      coordinates: [Number],
      address: String,
      description: String,
    },

    // Điểm kết thúc tour là mảng vì 1 tour chỉ 1 điểm bắt đầu nhưng lại có nhiều điểm kết thúc tours
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: 'Point',
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Tạo index khi tìm kiếm sẽ nhanh hơn, nhưng lại chiếm data nhiều, vì vậy lưu ý cái nào query nhiều thi dùng
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // cấu hình để tính vị trí

// Hàm này được gọi ở ngoài model vì khi lấy dữ liệu từ model chắc chắn phải chạy qua đây
// Lưu ý: hàm 'virtual'này chỉ là ảo nên k query(truy vấn được)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Hàm populate ảo vì dữ liệu của reivew là vô hạng nên không nên dùng ref
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// 1) DOCUMENT MIDDLEWARE
// 1A) Hàm pre là middleware(trong mongoDB) chỉ chạy ngay trước khi hàm save và create khi được gọi
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Nhúng User vào tours khi create hoặc save
// tourSchema.pre('save', async function (next) {
//   // Hàm dưới trả về 1 promise nên dùng promise all để hứng 1 lúc hết
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// Ref tới bảng user , chạy trước khi được gọi find
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangeAt', // Loại bỏ 2 thuộc tính này khi show
  });
  next();
});

// 1B) Hàm post là middleware(trong mongoDB) chỉ chạy ngay sau khi hàm save và create khi được gọi
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// 2) QUERY MIDDLEWARE

// 2A) Hàm chạy trước cậu lệnh query find nhưng dùng Regex "/^find/" để lấy tất cả lệnh query bắt đầu bằng "find" như find,findById...
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// 2B) Giống trên nhưng chạy sau lệnh query find và có quyền truy cập hết vào câu lệnh truy vấn 'docs'
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(docs);
//   next();
// });

// 3) AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   // Thêm " { secretTour: { $ne: true } } "vào object
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //console.log(typeof this.pipeline());
//   next();
// });

// Them bang vao model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
