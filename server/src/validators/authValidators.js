import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include a letter')
    .matches(/\d/)
    .withMessage('Password must include a number'),
  body('department').optional().trim().isLength({ max: 120 }),
  body('role').optional().custom(() => {
    throw new Error('Role cannot be set during registration');
  }),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const profileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('department').optional().trim().isLength({ max: 120 }),
];
