import { Router } from 'express';
import { me, patchMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileValidator } from '../validators/authValidators.js';

const router = Router();

router.get('/me', authenticate, me);
router.patch('/me', authenticate, profileValidator, validate, patchMe);

export default router;
