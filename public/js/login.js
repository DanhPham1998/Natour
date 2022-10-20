import axios from 'axios';
import { showAlert } from './alerts';
// login
export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    // Kiểm tra nếu đăng nhập đúng
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      // Sau 1.5s thì trờ về trang chủ
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    // Reload lại trang khi logout
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    showAlert('error', 'Error logout! Please try again');
  }
};
