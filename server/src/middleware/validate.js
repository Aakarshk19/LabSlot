import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((item) => ({ field: item.path, message: item.msg }));
  next(new ApiError(400, details[0]?.message || 'Validation failed', details));
}
