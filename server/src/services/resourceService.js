import { Resource } from '../models/Resource.js';
import { Booking, ACTIVE_BOOKING_STATUSES } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { parseMinutes, startOfDay, endOfDay } from '../utils/time.js';

const CATEGORIES = ['WORKSTATION', 'COMPUTER', 'ELECTRONIC_EQUIPMENT', 'LABORATORY_INSTRUMENT'];

export async function listResources({ search, category, location, status, sort, page = 1, limit = 12, includeInactive = false }) {
  const filter = {};
  if (!includeInactive) {
    filter.status = status && status !== 'ALL' ? status : { $ne: 'DEACTIVATED' };
  } else if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (location) filter.location = new RegExp(location, 'i');
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { resourceCode: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
    ];
  }

  const sortMap = {
    name: { name: 1 },
    newest: { createdAt: -1 },
    location: { location: 1, name: 1 },
  };
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Resource.find(filter).sort(sortMap[sort] || { name: 1 }).skip(skip).limit(Number(limit)),
    Resource.countDocuments(filter),
  ]);

  return {
    items: items.map((r) => r.toPublicJSON()),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  };
}

export async function getResource(id) {
  const resource = await Resource.findById(id);
  if (!resource || resource.status === 'DEACTIVATED') {
    throw new ApiError(404, 'Resource not found');
  }
  return resource;
}

export async function getResourceAdmin(id) {
  const resource = await Resource.findById(id);
  if (!resource) throw new ApiError(404, 'Resource not found');
  return resource;
}

export async function createResource(payload) {
  const existing = await Resource.findOne({ resourceCode: payload.resourceCode.toUpperCase() });
  if (existing) throw new ApiError(409, 'Resource code already exists');
  const resource = await Resource.create({
    ...payload,
    resourceCode: payload.resourceCode.toUpperCase(),
  });
  return resource;
}

export async function updateResource(id, payload) {
  const resource = await getResourceAdmin(id);
  const protectedFields = ['bookingLockUntil', 'bookingLockOwner', 'role'];
  for (const key of Object.keys(payload)) {
    if (protectedFields.includes(key)) continue;
    if (key === 'bookingConfig' && payload.bookingConfig) {
      resource.bookingConfig = { ...resource.bookingConfig.toObject(), ...payload.bookingConfig };
    } else if (payload[key] !== undefined) {
      resource[key] = payload[key];
    }
  }
  await resource.save();
  return resource;
}

export async function updateResourceStatus(id, status) {
  const resource = await getResourceAdmin(id);
  resource.status = status;
  await resource.save();
  return resource;
}

export function buildDayWindow(date, operatingStart, operatingEnd) {
  const day = startOfDay(date);
  const startMin = parseMinutes(operatingStart);
  const endMin = parseMinutes(operatingEnd);
  const windowStart = new Date(day.getTime() + startMin * 60000);
  const windowEnd = new Date(day.getTime() + endMin * 60000);
  return { windowStart, windowEnd };
}

export async function getAvailability(resourceId, date) {
  const resource = await getResource(resourceId);
  const { windowStart, windowEnd } = buildDayWindow(
    date,
    resource.bookingConfig.operatingStart,
    resource.bookingConfig.operatingEnd,
  );

  const occupied = await Booking.find({
    resourceId: resource._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: windowEnd },
    endTime: { $gt: windowStart },
  })
    .select('startTime endTime status bookingReference')
    .sort({ startTime: 1 });

  const interval = resource.bookingConfig.slotIntervalMinutes;
  const slots = [];
  for (let t = windowStart.getTime(); t + interval * 60000 <= windowEnd.getTime(); t += interval * 60000) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t + interval * 60000);
    const conflicts = occupied.some((b) => b.startTime < slotEnd && b.endTime > slotStart);
    const inPast = slotStart.getTime() <= Date.now();
    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: !conflicts && !inPast && resource.status === 'AVAILABLE',
    });
  }

  return {
    resource: resource.toPublicJSON(),
    date: startOfDay(date).toISOString(),
    operatingHours: {
      start: resource.bookingConfig.operatingStart,
      end: resource.bookingConfig.operatingEnd,
    },
    occupied: occupied.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
    })),
    slots,
  };
}

export async function listLocations() {
  return Resource.distinct('location', { status: { $ne: 'DEACTIVATED' } });
}
