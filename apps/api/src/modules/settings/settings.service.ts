import { prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';

interface NotificationPreferences {
  expenseApproval: 'always' | 'daily' | 'never';
  stockLow: 'always' | 'daily' | 'never';
  projectDelayed: 'always' | 'daily' | 'never';
  budgetExceeded: 'always' | 'daily' | 'never';
  taskAssigned: 'always' | 'daily' | 'never';
  taskOverdue: 'always' | 'daily' | 'never';
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  expenseApproval: 'always',
  stockLow: 'always',
  projectDelayed: 'daily',
  budgetExceeded: 'always',
  taskAssigned: 'always',
  taskOverdue: 'daily',
};

interface OrganizationSettingsInput {
  name: string;
  cuit?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
}

class SettingsService {
  async getOrganization(organizationId: string) {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        cuit: true,
        address: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        logo: true,
      },
    });

    if (!org) {
      throw new NotFoundError('Organización no encontrada');
    }

    return org;
  }

  async updateOrganization(organizationId: string, data: OrganizationSettingsInput) {
    const org = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
    });

    if (!org) {
      throw new NotFoundError('Organización no encontrada');
    }

    // Si cambia el CUIT, verificar que no esté en uso por otra organización
    if (data.cuit && data.cuit !== org.cuit) {
      const existing = await prisma.organization.findFirst({
        where: { cuit: data.cuit, id: { not: organizationId } },
      });
      if (existing) {
        throw new ValidationError(`El CUIT "${data.cuit}" ya está registrado en otra organización`);
      }
    }

    return prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        cuit: data.cuit ?? org.cuit,
        address: data.address,
        city: data.city,
        province: data.province ?? org.province,
        phone: data.phone,
        email: data.email,
      },
      select: {
        id: true,
        name: true,
        cuit: true,
        address: true,
        city: true,
        province: true,
        phone: true,
        email: true,
        logo: true,
      },
    });
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) throw new NotFoundError('Usuario no encontrado');

    const prefs = user.notificationPreferences as Partial<NotificationPreferences> | null;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });

    if (!user) throw new NotFoundError('Usuario no encontrado');

    const current = (user.notificationPreferences as Partial<NotificationPreferences>) ?? {};
    const updated = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...current, ...preferences };

    await prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: updated },
    });

    return updated;
  }
}

export const settingsService = new SettingsService();

