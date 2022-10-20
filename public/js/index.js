import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSetting';
import { bookTour } from './stripe';

// DOM ELEMNT(Lấy dữ liệu)
const mapbox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');

// Kiểm tra nếu tồn tại thì thực hiên
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMap(locations);
}

// Lấy dữ liệu từ form login
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

// Kiểm tra btn có đươc click không
if (logOutBtn) logOutBtn.addEventListener('click', logout);

// Update Name, Email for User
if (updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Sử dụng mutipart/Form-data thay vì json để gửi
    const form = new FormData();
    form.append(
      'currentPassword',
      document.getElementById('password-current-update-me').value
    );
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

// Update password for User
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // Dùng await vì để chờ updateSettings xong rồi thực hiển xoá value ở các input (passwordCurrent,password,passwordConfirm)
    // Vì updateSettings trả ra 1 promise nên mới dùng được await
    await updateSettings(
      {
        passwordCurrent: passwordCurrent,
        password: password,
        passwordConfirm: passwordConfirm,
      },
      'password'
    );
    document.querySelector('.btn--save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';

    // Hoặc có thể dùng cai này nếu đặt Biến(variable) giống dữ liệu được nhập vào APi(Key:Value)
    // updateSettings(
    //   {
    //     passwordCurrent,
    //     password,
    //     passwordConfirm,
    //   },
    //   'password'
    // );
  });
}
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
