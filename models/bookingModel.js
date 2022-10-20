const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking have a Tour'],
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking have a User'],
  },

  price: {
    type: Number,
    required: [true, 'Booking have a price'],
  },

  paid: {
    type: Boolean,
    default: true,
  },

  createAt: {
    type: Date,
    default: Date.now(),
  },
});

// Khi query Lấy data ra thì auto là lấy luôn user vs tour.name
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
