import { body, param, query } from 'express-validator';

export const resourceIdParam = [param('id').isMongoId().withMessage('Invalid resource id')];

export const listResourceQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

export const createResourceValidator = [
  body('name').trim().isLength({ min: 2, max: 140 }),
  body('resourceCode').trim().isLength({ min: 3, max: 40 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
  body('category').isIn(['WORKSTATION', 'COMPUTER', 'ELECTRONIC_EQUIPMENT', 'LABORATORY_INSTRUMENT']),
  body('location').trim().isLength({ min: 2, max: 160 }),
  body('specifications').optional().trim().isLength({ max: 2000 }),
  body('imageUrl').optional().trim().isLength({ max: 500 }),
];

export const statusValidator = [
  body('status').isIn(['AVAILABLE', 'MAINTENANCE', 'DEACTIVATED']).withMessage('Invalid resource status'),
];
