import axios from 'axios';
import { showAlert } from './alerts';

//type data(update name, email) hoac la password(update password)
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update successfully');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
