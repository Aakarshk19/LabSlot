import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { list, markRead, markAllRead } from '../controllers/notificationController.js';
import { validate } from '../middleware/validate.js';
import { param } from 'express-validator';

const router = Router();
router.use(authenticate);
router.get('/', list);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', [param('id').isMongoId()], validate, markRead);
export default router;
