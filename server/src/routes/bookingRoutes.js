import { Router } from 'express';
import { create, mine, history, getOne, cancel, dashboard } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBookingValidator, bookingIdParam, cancelValidator, historyQuery } from '../validators/bookingValidators.js';

const router = Router();

router.post('/', authenticate, createBookingValidator, validate, create);
router.get('/my', authenticate, historyQuery, validate, mine);
router.get('/history', authenticate, historyQuery, validate, history);
router.get('/dashboard', authenticate, dashboard);
router.get('/:id', authenticate, bookingIdParam, validate, getOne);
router.patch('/:id/cancel', authenticate, bookingIdParam, cancelValidator, validate, cancel);

export default router;
