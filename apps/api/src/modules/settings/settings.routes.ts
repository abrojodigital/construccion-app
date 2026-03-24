import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /settings/organization — Obtener datos de la organización (cualquier usuario autenticado)
router.get(
  '/organization',
  settingsController.getOrganization.bind(settingsController)
);

// PUT /settings/organization — Actualizar datos de la organización (solo ADMIN)
router.put(
  '/organization',
  requireAdmin,
  settingsController.updateOrganization.bind(settingsController)
);

// GET /settings/notifications — Obtener preferencias de notificaciones del usuario
router.get(
  '/notifications',
  settingsController.getNotificationPreferences.bind(settingsController)
);

// PUT /settings/notifications — Actualizar preferencias de notificaciones
router.put(
  '/notifications',
  settingsController.updateNotificationPreferences.bind(settingsController)
);

export { router as settingsRoutes };
