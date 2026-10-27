import { Router } from 'express';
import { list, getOne, availability, locations, create, patch, patchStatus } from '../controllers/resourceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { resourceIdParam, listResourceQuery, createResourceValidator, statusValidator } from '../validators/resourceValidators.js';

const router = Router();

router.get('/', authenticate, listResourceQuery, validate, list);
router.get('/locations', authenticate, locations);
router.post('/', authenticate, authorize('ADMIN'), createResourceValidator, validate, create);
router.get('/:id/availability', authenticate, resourceIdParam, validate, availability);
router.get('/:id', authenticate, resourceIdParam, validate, getOne);
router.patch('/:id', authenticate, authorize('ADMIN'), resourceIdParam, validate, patch);
router.patch('/:id/status', authenticate, authorize('ADMIN'), resourceIdParam, statusValidator, validate, patchStatus);

export default router;
