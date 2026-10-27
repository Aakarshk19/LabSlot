import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createBooking,
  getBookingForUser,
  listMyBookings,
  listHistory,
  cancelBooking,
  studentDashboard,
  serializeBooking,
} from '../services/bookingService.js';

export const create = asyncHandler(async (req, res) => {
  const booking = await createBooking({
    user: req.user,
    resourceId: req.body.resourceId,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    purpose: req.body.purpose,
  });
  const populated = await getBookingForUser(booking._id, req.user);
  res.status(201).json({ success: true, data: { booking: serializeBooking(populated) } });
});

export const mine = asyncHandler(async (req, res) => {
  const data = await listMyBookings(req.user._id, req.query);
  res.json({
    success: true,
    data: { items: data.items.map(serializeBooking), pagination: data.pagination },
  });
});

export const history = asyncHandler(async (req, res) => {
  const data = await listHistory(req.user, req.query);
  res.json({
    success: true,
    data: { items: data.items.map(serializeBooking), pagination: data.pagination },
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const booking = await getBookingForUser(req.params.id, req.user);
  res.json({ success: true, data: { booking: serializeBooking(booking) } });
});

export const cancel = asyncHandler(async (req, res) => {
  const booking = await cancelBooking({ bookingId: req.params.id, user: req.user, reason: req.body.reason });
  res.json({ success: true, data: { booking: serializeBooking(booking) } });
});

export const dashboard = asyncHandler(async (req, res) => {
  const data = await studentDashboard(req.user._id);
  res.json({
    success: true,
    data: {
      stats: data.stats,
      upcoming: data.upcoming.map(serializeBooking),
      pending: data.pending.map(serializeBooking),
      recent: data.recent.map(serializeBooking),
      cancelledOrRejected: data.cancelledOrRejected.map(serializeBooking),
    },
  });
});
