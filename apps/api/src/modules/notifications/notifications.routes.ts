import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateId } from '../../middleware/validation.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/notifications
router.get('/', notificationsController.findAll.bind(notificationsController));

// GET /api/v1/notifications/unread-count
router.get('/unread-count', notificationsController.getUnreadCount.bind(notificationsController));

// PATCH /api/v1/notifications/mark-all-read
router.patch('/mark-all-read', notificationsController.markAllAsRead.bind(notificationsController));

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', validateId, notificationsController.markAsRead.bind(notificationsController));

// DELETE /api/v1/notifications/:id
router.delete('/:id', validateId, notificationsController.delete.bind(notificationsController));

export { router as notificationsRoutes };
