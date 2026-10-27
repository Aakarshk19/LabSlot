import { Router } from 'express';
import { register, loginUser, logout, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerValidator, loginValidator } from '../validators/authValidators.js';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, loginUser);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
