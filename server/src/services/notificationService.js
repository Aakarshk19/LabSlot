import { Notification } from '../models/Notification.js';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';

export async function notify(userId, bookingId, type, message) {
  return Notification.create({ userId, bookingId, type, message });
}

export async function listNotifications(userId, { page = 1, limit = 20 } = {}) {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcoming = await Booking.find({ userId, status: { $in: ACTIVE_BOOKING_STATUSES }, startTime: { $gte: now, $lte: soon } }).select('_id bookingReference startTime');
  await Promise.all(upcoming.map(async (booking) => {
    try {
      await Notification.updateOne(
        { dedupeKey: `reminder:${booking._id}` },
        { $setOnInsert: { userId, bookingId: booking._id, type: 'RESERVATION_REMINDER', dedupeKey: `reminder:${booking._id}`, message: `Reminder: reservation ${booking.bookingReference} starts ${booking.startTime.toLocaleString()}.` } },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }));
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const filter = { userId };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).populate('bookingId', 'bookingReference status startTime endTime').sort({ createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  return { items, unread, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
}

export async function markNotificationRead(id, userId) {
  return Notification.findOneAndUpdate({ _id: id, userId }, { $set: { readAt: new Date() } }, { new: true });
}

export async function markAllNotificationsRead(userId) {
  await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
}
