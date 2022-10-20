const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/appError');
const sendEmail = require('./../Utils/email');
const factory = require('./handlerFactory');

// Tạo nơi lưu file và filename
// Lưu thẳng vào ổ đĩa
// const multrStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // Đuôi file
//     const filenameEXT = file.mimetype.split('/')[1];
//     // Tên file lưu
//     cb(null, `user-${req.user.id}-${Date.now()}.${filenameEXT}`);
//   },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // Resize ảnh và dung lương ảnh
  // Dùng await vì sharp trả ra 1 promise nên có thể chậm
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

// Lọc Obj khi đưa data vào
const filterObj = (obj, ...alowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((item) => {
    // lọc qua các key:value, nếu chưa giá trị của (alowedFields) đưa vào thì sẽ gán vào mảng mới
    if (alowedFields.includes(item)) {
      newObj[item] = obj[item];
    }
  });
  return newObj;
};

exports.createNewUser = (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
};

// Middleware này chạy trước để lấy id khi người dùng đã dăng nhập
exports.getMe = (req, res, next) => {
  // Lấy dữ liệu từ authController khi đã qua login
  req.params.id = req.user.id;
  next();
};

// Chỉ nên đổi thược tính để tạm ngừng hoạt động user không nên xoá
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //console.log('LOG FILE', req.file);// Dùng đề xem tệp file(Khi upload file)

  // user do authController.protect truyền qua khi qua xác thực
  // 1) Lấy password của user để so sánh
  const user = await User.findById(req.user.id).select('+password');
  let currentPassword = req.body.currentPassword || '';

  // 2) Kiểm tra password
  if (!(await req.user.correctPassword(currentPassword, user.password))) {
    return next(
      new AppError('You entered the wrong password for this account', 401)
    );
  }

  // 3) Lọc dữ liệu req.body gửi lên chỉ nhận name và email
  const filterReqBody = filterObj(req.body, 'name', 'email');
  console.log(filterReqBody);
  if (req.file) filterReqBody.photo = req.file.filename;

  // 4) update user document
  const updatedUser = await User.findByIdAndUpdate(user.id, filterReqBody, {
    new: true, // dùng để nó trả dữ liệu vủa cập nhật chứ không phải dữ liệu cũ
    runValidators: true, // dùng để validate dữ liệu
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.getAllUser = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Không update password với cái này vì no là dùng find nên không chạy qua các hàm save của middleware
exports.UpdateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
