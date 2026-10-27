import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { create, patch, patchStatus, adminList } from '../controllers/resourceController.js';
import { dashboard, bookings, approve, reject, adminCancel, users, reports } from '../controllers/adminController.js';
import { createResourceValidator, resourceIdParam, statusValidator, listResourceQuery } from '../validators/resourceValidators.js';
import { bookingIdParam, cancelValidator } from '../validators/bookingValidators.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', dashboard);
router.get('/bookings', bookings);
router.patch('/bookings/:id/approve', bookingIdParam, validate, approve);
router.patch('/bookings/:id/reject', bookingIdParam, cancelValidator, validate, reject);
router.patch('/bookings/:id/cancel', bookingIdParam, cancelValidator, validate, adminCancel);
router.get('/resources', listResourceQuery, validate, adminList);
router.post('/resources', createResourceValidator, validate, create);
router.patch('/resources/:id', resourceIdParam, validate, patch);
router.patch('/resources/:id/status', resourceIdParam, statusValidator, validate, patchStatus);
router.get('/users', users);
router.get('/reports', reports);

export default router;
