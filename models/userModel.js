const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['admin', 'lead-guide', 'guide', 'user'],
    default: 'user',
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // không show password khi get dữ liệu
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please comfirm your password'],
    validate: {
      // Nên nhớ chỉ hoạt động với lệnh CREATE và SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same',
    },
  },
  changePasswordAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Hàm chạy khi model.save và model.create
userSchema.pre('save', async function (next) {
  // Hàm này chạy để bỏ qua khi không có giá trị password để khỏi mã hoá
  if (!this.isModified('password')) return next();

  // Mã hoá mật khẩu với độ khó là 12, số càng lớn càng bảo mật cao nhưng lại mã hoá lâu hơn
  this.password = await bcrypt.hash(this.password, 12);

  // Xoá giá trị của cột passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

// Hàm tạo changePasswordAt khi save , hàm này dùng trong resetPassword
userSchema.pre('save', function (next) {
  // Hàm này chạy khi password không đổi hoặc khi tạo user "this.isNew"
  if (!this.isModified('password') || this.isNew) return next();

  this.changePasswordAt = Date.now() - 1000; // nên trừ 1s để login không bị lỗi nếu mạng chậm
  next();
});

// Lọc acc có active = false không hiển thị
userSchema.pre(/^find/, function (next) {
  // Tìm và bỏ qua giá trị active=false
  this.find({ active: { $ne: false } });
  next();
});

// Kiểm tra password có đung không khi Login
userSchema.methods.correctPassword = async function (passwordNhap, passwordDB) {
  // Kiểm tra xem password người dùng nhập và password trong DB có giống k khi bằng phương thức bcrypt.compare
  // vì ở trên DB password có "select: false" nên k dùng this được nên chỉ nhập qua authController
  // hàm dưới trả ra true hoặc faulse
  return await bcrypt.compare(passwordNhap, passwordDB);
};

// Kiểm tra time token phát hành với time password thay đổi
userSchema.methods.checkChangePassword = function (JWTTimestamp) {
  if (this.changePasswordAt) {
    // Convert Date sang timestamp chia 1000 vì đổi sang giấy chứ không dùng mili giây
    const changePWTimestamp = Math.floor(
      this.changePasswordAt.getTime() / 1000
    );
    return JWTTimestamp < changePWTimestamp; // trả về true nếu time JWT nhỏ hơn time change pw
  }

  // nếu thời gian change pw không tồn tại hoặc nhỏ hơn thời gian phát hành token thì bỏ qua
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Tạo random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Mã hoá resetToken để lưu vào DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //console.log({ resetToken }, this.passwordResetToken);

  // Tạo Time 10 phút vào DB
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // Lưu ý: hàm này chỉ sửa đổi không save vào DB nên cần sang authController để save "user.save"
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
