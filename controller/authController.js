const jwt = require('jsonwebtoken');
const { promisify } = require('util'); // Khai báo để biến hàm k hỗ trợ trả về 1 promise để dùng dc async/await
const User = require('./../models/userModel');
const catchAsync = require('./../Utils/catchAsync');
const AppError = require('./../Utils/appError');
const Email = require('./../Utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  // Phương thức sign ở dưới chỉ nên gửi id không nên gửi quá nhiều thông tin bí mật
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    // Ngày hết hạn có(d,m,s,h)
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //Tạo Cookie
  const cookieOptions = {
    expires: new Date(
      // Tạo time hêt hạn cho cookie và đổi sang mili giây
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  // Nên dùng hàm này thay vì trên vì có thể trong DB có cột Admin, nếu ng tạo có thể thêm DB, nên chỉ định dữ liệu
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  // });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Kiểm tra xem đã nhập email và password chưa
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Kiêm tra email và password có đúng không(trong DB)
  // Lấy dữ liệu với Email người dùng nhập cùng password trùng với email đó
  // // "select('+password')" là cần vì trong model nó mặc định sẽ không hiển thị
  const user = await User.findOne({ email }).select('+password');

  // Kiểm tra xem password bcrypt có giống nhau không
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorect email and password', 401));
  }

  // 3) Nếu tất cả đúng sẽ gửi token về phía client
  createSendToken(user, 200, res);
});

exports.logout = async (req, res) => {
  // Logout là xoá cookies của web nhưng có thuộc tính httpOnly: true khi tạo cookie nên không thể xoá
  // Nên làm ghi đề cookie của web là 'loggedout' nhưng chỉ có thòi hạn là 10s để không lưu
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
// xác thực người dùng
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Kiểm tra xem token có tồn tại khi gửi cùng header không
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('Your are not logged in! Please log in to get access', 401)
    );
  }

  // 2) Xác minh token có đúng không
  // Giải mã token
  // Phương thức promisify để biến 1 hàm thành promise và dùng dc async/await
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  //console.log(decoded);

  // 2) Kiểm tra tài khoản còn tồn tại hay bị xoá
  // Điều này xác thực có thể người dùng bị xoá
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'User has been deleted or banned, token is no longer usable',
        401
      )
    );
  }

  // 4) Kiểm tra mật khẩu người dùng có thây đổi sau thời điểm phát hành token không, nếu có không cho đăng nhập

  if (currentUser.checkChangePassword(decoded.iat)) {
    return next(
      new AppError('User has change password! Please login again', 401)
    );
  }

  // Nếu mọi thứ không có cần đề thì trả ra tất cả giá trị của người dùng
  req.user = currentUser; // Hàm này để lưu thông tin người dùng cho xử lý ở Route sau (RẤT QUAN TRỌNG)
  res.locals.user = currentUser; // Lưu data user vào locals để sử dụng được ở mọi nơi
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  // 1) Kiểm tra xem token có tồn tại khi gửi cùng header không
  // Dùng try cath chứ không dùng catchAsync vì khi login sẽ xác thực lại nên sẽ chạy sang nên sẽ bị lỗi
  if (req.cookies.jwt) {
    try {
      // 2) Xác minh token có đúng không
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET_KEY
      );

      // 2) Kiểm tra tài khoản còn tồn tại hay bị xoá
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Kiểm tra mật khẩu người dùng có thây đổi sau thời điểm phát hành token không, nếu có không cho đăng nhập

      if (currentUser.checkChangePassword(decoded.iat)) {
        return next();
      }

      // Luu user vào local
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// Phần Quyền
exports.restrictTo = (...role) => {
  return (req, res, next) => {
    //console.log(req.user.role);
    // role ['admin','lead-guide']
    // Giá trị 'req.user.role' được truyền từ 'exports.protec' vì trong userRoutes.js 'exports.protec' nằm ở trên
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to preform this action'),
        403
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User với email nhập từ post
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Tạo random token reset password]
  const resetToken = user.createPasswordResetToken();
  // Giá trị { validateBeforeSave: false } này để không xác thưc value "required: true" trong usermodel
  await user.save({ validateBeforeSave: false });

  // 3) Gửi Token đến Mail user

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sendding the mail. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get User với token được gửi qua param
  // giải mã token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Tìm user trùng với token và kiểm ta token hạn không bằng lênh " $gt: Date.now()" tự covert sang timestamp
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Kiểm tra có tồn tại user đã tìm không ( có thể token hết hạn)
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Lưu vào DB
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) xác định user đang login
  // Nên nhớ khi đã login thì đa qua protect middleware nên dữ liệu sẽ lưu trên đó
  // "select('+password')" là cần vì trong model nó mặc định sẽ không hiển thị
  let passwordCurrent = req.body.passwordCurrent || '';
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(
      new AppError('Your are not logged in! Please log in to get access', 401)
    );
  }

  // 2) kiểm tra password nhập vào có đụng với user này không
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(
      new AppError('You entered the wrong password for this account', 401)
    );
  }

  // 3) Nếu đúng ở trên , update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Gửi token mới
  createSendToken(user, 200, res);
});
