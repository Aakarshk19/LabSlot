import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listResources,
  getResource,
  createResource,
  updateResource,
  updateResourceStatus,
  getAvailability,
  listLocations,
} from '../services/resourceService.js';

export const list = asyncHandler(async (req, res) => {
  const data = await listResources({ ...req.query, includeInactive: false });
  res.json({ success: true, data });
});

export const locations = asyncHandler(async (_req, res) => {
  const items = await listLocations();
  res.json({ success: true, data: { items } });
});

export const getOne = asyncHandler(async (req, res) => {
  const resource = await getResource(req.params.id);
  res.json({ success: true, data: { resource: resource.toPublicJSON() } });
});

export const availability = asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const data = await getAvailability(req.params.id, date);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const resource = await createResource(req.body);
  res.status(201).json({ success: true, data: { resource: resource.toPublicJSON() } });
});

export const patch = asyncHandler(async (req, res) => {
  const resource = await updateResource(req.params.id, req.body);
  res.json({ success: true, data: { resource: resource.toPublicJSON() } });
});

export const patchStatus = asyncHandler(async (req, res) => {
  const resource = await updateResourceStatus(req.params.id, req.body.status);
  res.json({ success: true, data: { resource: resource.toPublicJSON() } });
});

export const adminList = asyncHandler(async (req, res) => {
  const data = await listResources({ ...req.query, includeInactive: true });
  res.json({ success: true, data });
});
