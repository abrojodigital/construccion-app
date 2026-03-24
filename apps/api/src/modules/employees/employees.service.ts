import { prisma, Prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

class EmployeesService {
  async findAll(
    organizationId: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
      search?: string;
      department?: string;
      specialty?: string;
      isActive?: string;
    }
  ) {
    const { page = 1, limit = 20, sortOrder = 'asc' } = params;
    const { search, department, specialty, isActive } = params;

    const ALLOWED_SORT_FIELDS = ['firstName', 'lastName', 'legajo', 'department', 'specialty', 'createdAt', 'updatedAt'];
    const sortBy = ALLOWED_SORT_FIELDS.includes(params.sortBy as string)
      ? (params.sortBy as string)
      : 'lastName';
    const safeSortOrder = sortOrder === 'desc' ? 'desc' : ('asc' as const);

    const where: Prisma.EmployeeWhereInput = {
      organizationId,
      deletedAt: null,
      ...(department && { department }),
      ...(specialty && { specialty }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { dni: { contains: search } },
          { legajo: { contains: search } },
        ],
      }),
    };

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sortBy]: safeSortOrder },
        include: {
          _count: { select: { projectAssignments: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total, page: Number(page), limit: Number(limit) };
  }

  async findAvailable(organizationId: string, projectId?: string) {
    let assignedIds: string[] = [];
    if (projectId) {
      const assignments = await prisma.employeeProjectAssignment.findMany({
        where: { projectId, isActive: true },
        select: { employeeId: true },
      });
      assignedIds = assignments.map((a) => a.employeeId);
    }

    return prisma.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        ...(assignedIds.length > 0 && { id: { notIn: assignedIds } }),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        legajo: true,
        firstName: true,
        lastName: true,
        specialty: true,
        department: true,
        position: true,
      },
    });
  }

  async findById(id: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        projectAssignments: {
          where: { isActive: true },
          include: { project: { select: { id: true, code: true, name: true, status: true } } },
        },
      },
    });
    if (!employee) throw new NotFoundError('Empleado', id);
    return employee;
  }

  async create(data: any, organizationId: string) {
    const legajo = await generateSimpleCode('employee', organizationId);

    return prisma.employee.create({
      data: {
        ...data,
        legajo,
        organizationId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundError('Empleado', id);

    return prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw new NotFoundError('Empleado', id);

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findAttendance(
    id: string,
    organizationId: string,
    params: { month?: string; year?: string }
  ) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Empleado', id);

    const { month, year } = params;

    let dateFilter: Prisma.AttendanceWhereInput = {};
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = {
        date: { gte: startDate, lte: endDate },
      };
    }

    return prisma.attendance.findMany({
      where: {
        employeeId: id,
        ...dateFilter,
      },
      orderBy: { date: 'desc' },
    });
  }

  async createAttendance(id: string, organizationId: string, data: any) {
    const existing = await prisma.employee.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    if (!existing) throw new NotFoundError('Empleado', id);

    return prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: id,
          date: new Date(data.date),
        },
      },
      create: {
        ...data,
        employeeId: id,
        date: new Date(data.date),
      },
      update: {
        ...data,
        date: new Date(data.date),
      },
    });
  }

  async findProjects(id: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundError('Empleado', id);

    return prisma.employeeProjectAssignment.findMany({
      where: { employeeId: id },
      include: {
        project: {
          select: { id: true, code: true, name: true, status: true, progress: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async bulkAttendance(organizationId: string, data: { date: string; records: any[] }) {
    const { date, records } = data;

    const results = await Promise.all(
      records.map((record: any) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: record.employeeId,
              date: new Date(date),
            },
          },
          create: {
            employeeId: record.employeeId,
            date: new Date(date),
            type: record.type,
            checkIn: record.checkIn ? new Date(record.checkIn) : null,
            checkOut: record.checkOut ? new Date(record.checkOut) : null,
            notes: record.notes,
          },
          update: {
            type: record.type,
            checkIn: record.checkIn ? new Date(record.checkIn) : null,
            checkOut: record.checkOut ? new Date(record.checkOut) : null,
            notes: record.notes,
          },
        })
      )
    );

    return { updated: results.length };
  }

  async attendanceReport(
    organizationId: string,
    params: { startDate?: string; endDate?: string; projectId?: string }
  ) {
    const { startDate, endDate, projectId } = params;

    let employeeIds: string[] | undefined;

    if (projectId) {
      const assignments = await prisma.employeeProjectAssignment.findMany({
        where: { projectId, isActive: true },
        select: { employeeId: true },
      });
      employeeIds = assignments.map((a) => a.employeeId);
    }

    return prisma.attendance.groupBy({
      by: ['employeeId', 'type'],
      where: {
        employee: { organizationId },
        ...(startDate && endDate && {
          date: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
        ...(employeeIds && { employeeId: { in: employeeIds } }),
      },
      _count: true,
      _sum: { hoursWorked: true, overtimeHours: true },
    });
  }
}

export const employeesService = new EmployeesService();
