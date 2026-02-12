import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { loginSchema, registerSchema } from '@construccion/shared';
import { z } from 'zod';

const router = Router();

// Validation schemas
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Token de refresco requerido'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

// Public routes
router.post('/login', validateBody(loginSchema), authController.login.bind(authController));
router.post('/register', validateBody(registerSchema), authController.register.bind(authController));
router.post('/refresh', validateBody(refreshSchema), authController.refresh.bind(authController));
router.post('/logout', validateBody(refreshSchema), authController.logout.bind(authController));

// Protected routes
router.use(authMiddleware);
router.get('/me', authController.getProfile.bind(authController));
router.post('/logout-all', authController.logoutAll.bind(authController));
router.post(
  '/change-password',
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);

export { router as authRoutes };
