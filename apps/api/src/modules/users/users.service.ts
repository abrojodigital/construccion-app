import { prisma, Prisma } from '@construccion/database';
import * as bcrypt from 'bcryptjs';
import { NotFoundError, ForbiddenError } from '../../shared/utils/errors';

class UsersService {
  async findAll(
    organizationId: string,
    params: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
      search?: string;
    }
  ) {
    const { page, limit, sortBy, sortOrder, search } = params;

    const where: Prisma.UserWhereInput = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundError('Usuario', id);
    return user;
  }

  async create(data: any, organizationId: string, requestingUserRole: string) {
    // Solo ADMIN puede crear usuarios
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenError('Solo los administradores pueden crear usuarios');
    }

    const { password, ...userData } = data;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    return prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: any, organizationId: string, requestingUserRole: string) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundError('Usuario', id);

    // Solo ADMIN puede cambiar roles
    if (data.role && requestingUserRole !== 'ADMIN') {
      throw new ForbiddenError('Solo los administradores pueden cambiar roles');
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async patch(
    id: string,
    data: any,
    organizationId: string,
    requestingUserRole: string,
    requestingUserId: string
  ) {
    const existing = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundError('Usuario', id);

    // Solo ADMIN puede cambiar roles o desactivar usuarios
    if ((data.role || data.isActive !== undefined) && requestingUserRole !== 'ADMIN') {
      throw new ForbiddenError('Solo los administradores pueden cambiar roles o estado de usuarios');
    }

    // Prevenir auto-desactivación
    if (data.isActive === false && id === requestingUserId) {
      throw new ForbiddenError('No puedes desactivarte a ti mismo');
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string, organizationId: string, requestingUserRole: string, requestingUserId: string) {
    // Solo ADMIN puede eliminar usuarios
    if (requestingUserRole !== 'ADMIN') {
      throw new ForbiddenError('Solo los administradores pueden eliminar usuarios');
    }

    // Prevenir auto-eliminación
    if (id === requestingUserId) {
      throw new ForbiddenError('No puedes eliminarte a ti mismo');
    }

    const existing = await prisma.user.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundError('Usuario', id);

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

export const usersService = new UsersService();
