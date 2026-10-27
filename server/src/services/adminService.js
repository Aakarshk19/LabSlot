import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Resource } from '../models/Resource.js';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { startOfDay } from '../utils/time.js';
import { notify } from './notificationService.js';

export async function completeElapsedBookings() {
  await Booking.updateMany(
    { status: 'CONFIRMED', endTime: { $lte: new Date() } },
    { $set: { status: 'COMPLETED' }, $push: { statusHistory: { status: 'COMPLETED', changedAt: new Date(), changedBy: null, note: 'Automatically completed after the reservation ended' } } },
  );
}

export async function getDashboard() {
  await completeElapsedBookings();
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const [
    activeResources,
    totalUsers,
    totalReservations,
    pendingApprovals,
    maintenance,
    recent,
    byStatus,
    trend,
    utilization,
  ] = await Promise.all([
    Resource.countDocuments({ status: { $ne: 'DEACTIVATED' } }),
    User.countDocuments({ role: 'STUDENT' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'PENDING' }),
    Resource.countDocuments({ status: 'MAINTENANCE' }),
    Booking.find().populate('resourceId').populate('userId', 'name email').sort({ createdAt: -1 }).limit(8),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: { status: { $in: ['CONFIRMED', 'COMPLETED', 'PENDING'] } } },
      { $group: { _id: '$resourceId', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      { $unwind: '$resource' },
      { $project: { bookings: 1, name: '$resource.name', resourceCode: '$resource.resourceCode' } },
    ]),
  ]);

  const trendMap = Object.fromEntries(trend.map((d) => [d._id, d.count]));
  const trendDays = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    trendDays.push({ date: key, count: trendMap[key] || 0 });
  }

  return {
    totals: {
      activeResources,
      totalUsers,
      totalReservations,
      pendingApprovals,
      maintenance,
    },
    statusBreakdown: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    recent,
    trend: trendDays,
    utilization,
  };
}

export async function listAdminBookings({ status, search, page = 1, limit = 12 }) {
  await completeElapsedBookings();
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [{ bookingReference: new RegExp(search, 'i') }, { purpose: new RegExp(search, 'i') }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter).populate('resourceId').populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit) || 1) },
  };
}

export async function approveBooking(id, admin) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Reservation not found');
  if (booking.status !== 'PENDING') throw new ApiError(400, 'Only pending reservations can be approved');
  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    resourceId: booking.resourceId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: booking.endTime },
    endTime: { $gt: booking.startTime },
  });
  if (conflict) throw new ApiError(409, 'Cannot approve because the slot now conflicts with another reservation');
  booking.status = 'CONFIRMED';
  booking.reviewedBy = admin._id;
  booking.reviewedAt = new Date();
  booking.reviewNote = 'Approved';
  booking.statusHistory.push({ status: 'CONFIRMED', changedBy: admin._id, note: 'Approved' });
  await booking.save();
  await notify(booking.userId, booking._id, 'BOOKING_APPROVED', `Your reservation ${booking.bookingReference} was approved.`);
  return booking;
}

export async function rejectBooking(id, admin, note) {
  const booking = await Booking.findById(id);
  if (!booking) throw new ApiError(404, 'Reservation not found');
  if (booking.status !== 'PENDING') throw new ApiError(400, 'Only pending reservations can be rejected');
  booking.status = 'REJECTED';
  booking.reviewedBy = admin._id;
  booking.reviewedAt = new Date();
  booking.reviewNote = note?.trim() || 'Rejected by administrator';
  booking.statusHistory.push({ status: 'REJECTED', changedBy: admin._id, note: booking.reviewNote });
  await booking.save();
  await notify(booking.userId, booking._id, 'BOOKING_REJECTED', `Your reservation ${booking.bookingReference} was rejected: ${booking.reviewNote}`);
  return booking;
}

export async function listUsers({ page = 1, limit = 20, search }) {
  const filter = { role: 'STUDENT' };
  if (search) {
    filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  const userIds = items.map((u) => u._id);
  const activity = await Booking.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', bookings: { $sum: 1 } } },
  ]);
  const activityMap = Object.fromEntries(activity.map((a) => [a._id.toString(), a.bookings]));
  return {
    items: items.map((u) => ({ ...u.toPublicJSON(), bookingCount: activityMap[u._id.toString()] || 0 })),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit) || 1) },
  };
}

export async function getReports({ from, to }) {
  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = startOfDay(from);
    if (to) match.createdAt.$lte = new Date(to);
  }
  const [byDay, byResource, byStatus] = await Promise.all([
    Booking.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: match },
      { $group: { _id: '$resourceId', count: { $sum: 1 } } },
      { $lookup: { from: 'resources', localField: '_id', foreignField: '_id', as: 'resource' } },
      { $unwind: '$resource' },
      { $project: { count: 1, name: '$resource.name', resourceCode: '$resource.resourceCode' } },
      { $sort: { count: -1 } },
    ]),
    Booking.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return { byDay, byResource, byStatus };
}

export function assertObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid identifier');
  }
}
