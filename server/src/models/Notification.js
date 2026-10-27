import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  type: { type: String, enum: ['BOOKING_CREATED', 'BOOKING_APPROVED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'RESERVATION_REMINDER'], required: true },
  message: { type: String, required: true, maxlength: 500 },
  readAt: { type: Date, default: null, index: true },
  dedupeKey: { type: String, default: undefined },
}, { timestamps: true });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
export const Notification = mongoose.model('Notification', notificationSchema);
