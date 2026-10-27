import { asyncHandler } from '../utils/asyncHandler.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService.js';
import { ApiError } from '../utils/ApiError.js';

export const list = asyncHandler(async (req, res) => {
  const data = await listNotifications(req.user._id, req.query);
  res.json({ success: true, data });
});

export const markRead = asyncHandler(async (req, res) => {
  const item = await markNotificationRead(req.params.id, req.user._id);
  if (!item) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, data: { notification: item } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user._id);
  res.json({ success: true, data: { updated: true } });
});
