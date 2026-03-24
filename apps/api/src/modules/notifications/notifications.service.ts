import { prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';

interface CreateNotificationInput {
  type: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'TASK_OVERDUE' | 'EXPENSE_APPROVAL' | 'EXPENSE_APPROVED' | 'EXPENSE_REJECTED' | 'BUDGET_ALERT' | 'STOCK_LOW' | 'PROJECT_UPDATE' | 'GENERAL';
  title: string;
  message: string;
  userId: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

class NotificationsService {
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({ data });
  }

  async findAll(userId: string, query: NotificationQuery) {
    const { page = 1, limit = 20, isRead, type } = query;

    const where: any = {
      userId,
      ...(isRead !== undefined && { isRead }),
      ...(type && { type }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundError('Notificación', id);
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: true };
  }

  async delete(id: string, userId: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundError('Notificación', id);
    await prisma.notification.delete({ where: { id } });
  }
}

export const notificationsService = new NotificationsService();
