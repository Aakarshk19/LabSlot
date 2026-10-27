import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getDashboard,
  listAdminBookings,
  approveBooking,
  rejectBooking,
  listUsers,
  getReports,
} from '../services/adminService.js';
import { cancelBooking, getBookingForUser, serializeBooking } from '../services/bookingService.js';

export const dashboard = asyncHandler(async (_req, res) => {
  const data = await getDashboard();
  res.json({
    success: true,
    data: {
      ...data,
      recent: data.recent.map(serializeBooking),
    },
  });
});

export const bookings = asyncHandler(async (req, res) => {
  const data = await listAdminBookings(req.query);
  res.json({
    success: true,
    data: { items: data.items.map(serializeBooking), pagination: data.pagination },
  });
});

export const approve = asyncHandler(async (req, res) => {
  const booking = await approveBooking(req.params.id, req.user);
  const populated = await getBookingForUser(booking._id, req.user);
  res.json({ success: true, data: { booking: serializeBooking(populated) } });
});

export const reject = asyncHandler(async (req, res) => {
  const booking = await rejectBooking(req.params.id, req.user, req.body.reason || req.body.note);
  const populated = await getBookingForUser(booking._id, req.user);
  res.json({ success: true, data: { booking: serializeBooking(populated) } });
});

export const adminCancel = asyncHandler(async (req, res) => {
  const booking = await cancelBooking({
    bookingId: req.params.id,
    user: req.user,
    reason: req.body.reason,
  });
  res.json({ success: true, data: { booking: serializeBooking(booking) } });
});

export const users = asyncHandler(async (req, res) => {
  const data = await listUsers(req.query);
  res.json({ success: true, data });
});

export const reports = asyncHandler(async (req, res) => {
  const data = await getReports(req.query);
  res.json({ success: true, data });
});
