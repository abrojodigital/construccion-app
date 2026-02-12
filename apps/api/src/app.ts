import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { sanitizeBody } from './middleware/validation.middleware';

// Import routes
import { authRoutes } from './modules/auth/auth.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { stagesRoutes } from './modules/stages/stages.routes';
import { tasksRoutes } from './modules/tasks/tasks.routes';
import { costsRoutes } from './modules/costs/costs.routes';
import { suppliersRoutes } from './modules/suppliers/suppliers.routes';
import { materialsRoutes } from './modules/materials/materials.routes';
import { employeesRoutes } from './modules/employees/employees.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { usersRoutes } from './modules/users/users.routes';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes, intente de nuevo más tarde',
      },
    },
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Sanitize request body
  app.use(sanitizeBody);

  // Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.env,
      },
    });
  });

  // API routes
  const apiRouter = express.Router();

  // Specific routes first (order matters!)
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/projects', projectsRoutes);
  apiRouter.use('/suppliers', suppliersRoutes);
  apiRouter.use('/materials', materialsRoutes);
  apiRouter.use('/employees', employeesRoutes);
  apiRouter.use('/users', usersRoutes);
  apiRouter.use('/reports', reportsRoutes);
  apiRouter.use('/', costsRoutes); // Handles /expenses and /expense-categories (must be before stages/tasks)

  // Generic routes last (these have /:id patterns that can match anything)
  apiRouter.use('/', stagesRoutes); // Handles /projects/:projectId/stages and /stages/:id
  apiRouter.use('/', tasksRoutes); // Handles /stages/:stageId/tasks and /tasks/:id

  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use(notFoundMiddleware);

  // Error handler
  app.use(errorMiddleware);

  return app;
}
