import { body, param, query } from 'express-validator';

export const createBookingValidator = [
  body('resourceId').isMongoId().withMessage('A valid resource is required'),
  body('startTime').isISO8601().withMessage('A valid start time is required'),
  body('endTime').isISO8601().withMessage('A valid end time is required'),
  body('purpose').trim().isLength({ min: 5, max: 500 }).withMessage('Purpose must be between 5 and 500 characters'),
];

export const bookingIdParam = [param('id').isMongoId().withMessage('Invalid booking id')];

export const cancelValidator = [
  body('reason').optional().trim().isLength({ max: 500 }),
];

export const historyQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
];
