const Tour = require('./../models/tourModel');
const multer = require('multer');
const sharp = require('sharp');
const factory = require('./handlerFactory');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/appError');

// Lưu tạm vào bộ nhớ
const multrStorage = multer.memoryStorage();

// Filer file
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multrStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },

  //upload.single('image') req.file
  //upload.array('image',3) req.files
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  //console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) IMAGE COVER
  // Gán giá trị cho req.body.imageCover để dùng lưu ra các router sau
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // Resize ảnh và dung lương ảnh
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) IMAGES
  req.body.images = [];

  // Nên sử dụng map vì map có giá trị trả ra nên sử dụng được Promise.all
  // Tất cả hàm đều là Bất đồng bộ nên dùng Promise.all để chờ hoàn thành 1 lượt
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      // Đảy từng phần từ vào mảng rỗng ở trên
      req.body.images.push(filename);
    })
  );
  next();
});

exports.top5Tours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,ratingsAverage,price,duration,maxGroupSize,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createNewTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// Thống kê
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stat = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // gộp các nhóm có cùng độ khó, easy. medium, difficulty
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsQuantity' }, // avg là tính trung bình\
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // Xếp tăng dần la 1 giảm dần -1
    },
    {
      $match: { _id: { $ne: 'EASY' } }, // $ne là not equal (không bào gôm độ khó easy)
    },
  ]);
  res.status(201).json({
    status: 'success',
    data: {
      stat,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // VD 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Tách ra các giá trị riêng của mảng startDates riêng
    },
    {
      $match: {
        startDates: {
          // tính để lấy tất cả giá trị trong năm đó 01-01-2021 -> 31-12-2021
          $gte: new Date(`${year}-01-01`), // Lốn hơn ngaỳ
          $lte: new Date(`${year}-12-31`), // Nhỏ hơn ngày
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Gôm nhóm theo month hàm "$month" lấy giá trị tháng của startDates
        numTourStart: { $sum: 1 }, // tính tổng số tour theo month như vòng lặp
        tour: { $push: '$name' }, // hiển thị các name có chung month trong năm đó
      },
    },
    {
      $addFields: { month: '$_id' }, // thêm hàng month với giá trị của _id ở trên
    },
    {
      $project: {
        _id: 0, // hàm '$project' ẩn giá trị, 0 là ân 1 là hiển thị
      },
    },
    {
      $sort: { numTourStart: 1 }, // sắp xêp giá trị, 1 tăng, -1 giảm
    },
    {
      $limit: 12, // giới hạn giá trị hiện thị (không cần thiết)
    },
  ]);
  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

// Tìm các tour có bán kính với 1 vị trí
exports.getToursWitthin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // Đổi dặm ra km
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6387.1;

  if (!lat || !lng) {
    next(new AppError('Please provide in the format lat,lng', 400));
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    data: {
      data: tours,
    },
  });
});

// Tính khoảng cách từ 1 điểm đến tất cả các Tour
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
