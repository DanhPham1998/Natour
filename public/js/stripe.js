import axios from 'axios';
//import Stripe from 'stripe';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51LuTd6GjRUTIJkZzfse8XFtUlDu2necY2ODaJYcTfQzWZsAEIQxWNOLGga77MO2FKi6CG7fcYgwkKP2ueOurvoN300KObik9q8'
);

export const bookTour = async (tourId) => {
  try {
    // 1) Tạo checkout từ API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    //console.log(session);
    //console.log(stripe);

    // 2) Chuyển hương URl sang form checkout từ sesion vừa tạo để thanh toán
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id, // dùng log ở trên để xem session Obj có j
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
