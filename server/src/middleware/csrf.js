import { CSRF_COOKIE } from '../utils/cookies.js';
import { ApiError } from '../utils/ApiError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get('X-CSRF-Token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new ApiError(403, 'Invalid CSRF token'));
  }
  next();
}
