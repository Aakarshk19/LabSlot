import { env, isProduction } from '../config/env.js';

export const ACCESS_COOKIE = 'labslot_token';
export const CSRF_COOKIE = 'labslot_csrf';

export function cookieOptions({ httpOnly }) {
  return {
    httpOnly,
    secure: env.cookieSecure || isProduction,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function setAuthCookies(res, token, csrfToken) {
  res.cookie(ACCESS_COOKIE, token, cookieOptions({ httpOnly: true }));
  res.cookie(CSRF_COOKIE, csrfToken, cookieOptions({ httpOnly: false }));
}

export function clearAuthCookies(res) {
  const base = {
    httpOnly: true,
    secure: env.cookieSecure || isProduction,
    sameSite: env.cookieSameSite,
    path: '/',
  };
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(CSRF_COOKIE, { ...base, httpOnly: false });
}
