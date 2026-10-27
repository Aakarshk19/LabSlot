import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import { Resource } from '../models/Resource.js';
import { ApiError } from '../utils/ApiError.js';
import { createBookingReference } from '../utils/bookingReference.js';
import { minutesBetween, parseMinutes, startOfDay, endOfDay } from '../utils/time.js';
import { buildDayWindow } from './resourceService.js';
import { notify } from './notificationService.js';

const LOCK_MS = 8000;
const LOCK_RETRIES = 8;

function overlapFilter(resourceId, startTime, endTime, excludeId) {
  const filter = {
    resourceId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) filter._id = { $ne: excludeId };
  return filter;
}

async function acquireResourceLock(resourceId) {
  const owner = crypto.randomUUID();
  for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
    const now = new Date();
    const locked = await Resource.findOneAndUpdate(
      {
        _id: resourceId,
        $or: [{ bookingLockUntil: null }, { bookingLockUntil: { $lte: now } }],
      },
      {
        $set: {
          bookingLockUntil: new Date(now.getTime() + LOCK_MS),
          bookingLockOwner: owner,
        },
      },
      { new: true },
    );
    if (locked) return { resource: locked, owner };
    await new Promise((r) => setTimeout(r, 50 + attempt * 40));
  }
  throw new ApiError(429, 'This resource is busy with another reservation request. Please try again.');
}

async function releaseResourceLock(resourceId, owner) {
  await Resource.updateOne(
    { _id: resourceId, bookingLockOwner: owner },
    { $set: { bookingLockUntil: null, bookingLockOwner: null } },
  );
}

function validateBookingWindow(resource, startTime, endTime) {
  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
    throw new ApiError(400, 'Invalid start time');
  }
  if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(400, 'Invalid end time');
  }
  if (startTime >= endTime) {
    throw new ApiError(400, 'Start time must be earlier than end time');
  }
  if (startTime.getTime() <= Date.now()) {
    throw new ApiError(400, 'Reservations cannot be created for past time slots');
  }

  const duration = minutesBetween(startTime, endTime);
  const { minDurationMinutes, maxDurationMinutes, maxAdvanceDays, slotIntervalMinutes } = resource.bookingConfig;
  if (duration < minDurationMinutes) {
    throw new ApiError(400, `Minimum booking duration is ${minDurationMinutes} minutes`);
  }
  if (duration > maxDurationMinutes) {
    throw new ApiError(400, `Maximum booking duration is ${maxDurationMinutes} minutes`);
  }
  if (duration % slotIntervalMinutes !== 0) {
    throw new ApiError(400, `Booking duration must be a multiple of ${slotIntervalMinutes} minutes`);
  }

  const latest = new Date();
  latest.setDate(latest.getDate() + maxAdvanceDays);
  if (startTime > latest) {
    throw new ApiError(400, `Bookings can be made at most ${maxAdvanceDays} days in advance`);
  }

  const { windowStart, windowEnd } = buildDayWindow(
    startTime,
    resource.bookingConfig.operatingStart,
    resource.bookingConfig.operatingEnd,
  );
  if (startOfDay(startTime).getTime() !== startOfDay(endTime).getTime()) {
    throw new ApiError(400, 'Bookings must start and end on the same calendar day');
  }
  if (startTime < windowStart || endTime > windowEnd) {
    throw new ApiError(
      400,
      `Reservations must fall within operating hours (${resource.bookingConfig.operatingStart}–${resource.bookingConfig.operatingEnd})`,
    );
  }

  const startMin = (startTime.getHours() * 60 + startTime.getMinutes()) - parseMinutes(resource.bookingConfig.operatingStart);
  if (startMin % slotIntervalMinutes !== 0) {
    throw new ApiError(400, 'Start time must align with the laboratory slot interval');
  }
}

export async function createBooking({ user, resourceId, startTime, endTime, purpose }) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const { resource, owner } = await acquireResourceLock(resourceId);

  try {
    if (resource.status !== 'AVAILABLE') {
      throw new ApiError(
        409,
        resource.status === 'MAINTENANCE'
          ? 'This resource is under maintenance and cannot be booked'
          : 'This resource is not available for booking',
      );
    }

    validateBookingWindow(resource, start, end);

    const conflict = await Booking.findOne(overlapFilter(resource._id, start, end));
    if (conflict) {
      throw new ApiError(409, 'This time slot conflicts with an existing reservation');
    }

    const status = env.requireBookingApproval ? 'PENDING' : 'CONFIRMED';
    const booking = await Booking.create({
      bookingReference: createBookingReference(),
      userId: user._id,
      resourceId: resource._id,
      startTime: start,
      endTime: end,
      purpose: purpose.trim(),
      status,
      statusHistory: [{ status, changedBy: user._id, note: status === 'PENDING' ? 'Reservation submitted for review' : 'Reservation confirmed' }],
    });
    if (status === 'PENDING') {
      const admins = await (await import('../models/User.js')).User.find({ role: 'ADMIN' }).select('_id').lean();
      await Promise.all(admins.map((admin) => notify(admin._id, booking._id, 'BOOKING_CREATED', `A reservation request needs review: ${booking.bookingReference}`)));
    } else {
      await notify(user._id, booking._id, 'BOOKING_APPROVED', `Your reservation ${booking.bookingReference} is confirmed.`);
    }
    return booking;
  } finally {
    await releaseResourceLock(resourceId, owner);
  }
}

export async function getBookingForUser(id, user) {
  const booking = await Booking.findById(id).populate('resourceId').populate('userId', 'name email role');
  if (!booking) throw new ApiError(404, 'Reservation not found');
  const ownerId = booking.userId._id ? booking.userId._id.toString() : booking.userId.toString();
  if (user.role !== 'ADMIN' && ownerId !== user._id.toString()) {
    throw new ApiError(403, 'You cannot access another user\'s reservation');
  }
  return booking;
}

export async function listMyBookings(userId, { status, upcoming, page = 1, limit = 20 }) {
  const filter = { userId };
  if (status) filter.status = status;
  if (upcoming === 'true') {
    filter.endTime = { $gte: new Date() };
    filter.status = { $in: ACTIVE_BOOKING_STATUSES };
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter).populate('resourceId').sort({ startTime: -1 }).skip(skip).limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit) || 1) },
  };
}

export async function listHistory(user, { status, from, to, page = 1, limit = 20 }) {
  const filter = user.role === 'ADMIN' ? {} : { userId: user._id };
  if (status) filter.status = status;
  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = startOfDay(from);
    if (to) filter.startTime.$lte = endOfDay(to);
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

export async function cancelBooking({ bookingId, user, reason }) {
  const booking = await Booking.findById(bookingId).populate('resourceId');
  if (!booking) throw new ApiError(404, 'Reservation not found');
  if (user.role !== 'ADMIN' && booking.userId.toString() !== user._id.toString()) {
    throw new ApiError(403, 'You can only cancel your own reservations');
  }
  if (!ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
    throw new ApiError(400, 'Only pending or confirmed reservations can be cancelled');
  }

  if (user.role !== 'ADMIN') {
    const cutoffHours = booking.resourceId.bookingConfig.cancellationCutoffHours;
    const cutoff = new Date(booking.startTime.getTime() - cutoffHours * 3600000);
    if (Date.now() > cutoff.getTime()) {
      throw new ApiError(400, `Cancellations must be made at least ${cutoffHours} hour(s) before the start time`);
    }
  }

  booking.status = 'CANCELLED';
  booking.cancellationReason = reason?.trim() || (user.role === 'ADMIN' ? 'Cancelled by administrator' : 'Cancelled by student');
  booking.cancelledBy = user._id;
  booking.statusHistory.push({ status: 'CANCELLED', changedBy: user._id, note: booking.cancellationReason });
  await booking.save();
  if (user.role === 'ADMIN') await notify(booking.userId, booking._id, 'BOOKING_CANCELLED', `Your reservation ${booking.bookingReference} was cancelled by an administrator.`);
  else {
    const admins = await (await import('../models/User.js')).User.find({ role: 'ADMIN' }).select('_id').lean();
    await Promise.all(admins.map((admin) => notify(admin._id, booking._id, 'BOOKING_CANCELLED', `Reservation ${booking.bookingReference} was cancelled by the student.`)));
  }
  return booking;
}

export async function studentDashboard(userId) {
  const now = new Date();
  await Booking.updateMany(
    { userId, status: 'CONFIRMED', endTime: { $lte: now } },
    { $set: { status: 'COMPLETED' }, $push: { statusHistory: { status: 'COMPLETED', changedAt: now, changedBy: null, note: 'Automatically completed after the reservation ended' } } },
  );

  const [upcoming, pending, recent, cancelled, totals] = await Promise.all([
    Booking.find({ userId, status: { $in: ACTIVE_BOOKING_STATUSES }, endTime: { $gte: now } })
      .populate('resourceId')
      .sort({ startTime: 1 })
      .limit(8),
    Booking.find({ userId, status: 'PENDING' }).populate('resourceId').sort({ createdAt: -1 }).limit(8),
    Booking.find({ userId }).populate('resourceId').sort({ createdAt: -1 }).limit(8),
    Booking.find({ userId, status: { $in: ['CANCELLED', 'REJECTED'] } })
      .populate('resourceId')
      .sort({ updatedAt: -1 })
      .limit(6),
    Booking.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = Object.fromEntries(totals.map((t) => [t._id, t.count]));
  return {
    upcoming,
    pending,
    recent,
    cancelledOrRejected: cancelled,
    stats: {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      completed: counts.COMPLETED || 0,
      confirmed: counts.CONFIRMED || 0,
      pending: counts.PENDING || 0,
      cancelled: counts.CANCELLED || 0,
      rejected: counts.REJECTED || 0,
    },
  };
}

export function serializeBooking(booking) {
  const resource = booking.resourceId?.toPublicJSON ? booking.resourceId.toPublicJSON() : booking.resourceId;
  const user = booking.userId?.toPublicJSON ? booking.userId.toPublicJSON() : booking.userId;
  return {
    ...booking.toJSONSafe(),
    resource,
    user,
  };
}
