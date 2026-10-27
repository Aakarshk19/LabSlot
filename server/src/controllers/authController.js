import { asyncHandler } from '../utils/asyncHandler.js';
import { registerStudent, login, signAccessToken, createCsrfToken, updateProfile } from '../services/authService.js';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies.js';

function issueSession(res, user) {
  const token = signAccessToken(user);
  const csrfToken = createCsrfToken();
  setAuthCookies(res, token, csrfToken);
  return csrfToken;
}

export const register = asyncHandler(async (req, res) => {
  const user = await registerStudent(req.body);
  const csrfToken = issueSession(res, user);
  res.status(201).json({ success: true, data: { user: user.toPublicJSON(), csrfToken } });
});

export const loginUser = asyncHandler(async (req, res) => {
  const user = await login(req.body);
  const csrfToken = issueSession(res, user);
  res.json({ success: true, data: { user: user.toPublicJSON(), csrfToken } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

export const patchMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body);
  res.json({ success: true, data: { user: user.toPublicJSON() } });
});
