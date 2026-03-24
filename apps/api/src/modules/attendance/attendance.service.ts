import { prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';

interface AttendanceQuery {
  page?: number;
  limit?: number;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

interface UpsertAttendanceInput {
  employeeId: string;
  date: string;
  type?: string;
  checkIn?: string;
  checkOut?: string;
  hoursWorked?: number;
  overtimeHours?: number;
  notes?: string;
}

class AttendanceService {
  async findAll(organizationId: string, query: AttendanceQuery) {
    const { page = 1, limit = 50, employeeId, dateFrom, dateTo, type } = query;

    const where: any = {
      employee: { organizationId },
      ...(employeeId && { employeeId }),
      ...(type && { type }),
      ...(dateFrom && { date: { gte: new Date(dateFrom) } }),
      ...(dateTo && {
        date: dateFrom
          ? { gte: new Date(dateFrom), lte: new Date(dateTo) }
          : { lte: new Date(dateTo) },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: [{ date: 'desc' }, { employee: { lastName: 'asc' } }],
        include: {
          employee: { select: { id: true, legajo: true, firstName: true, lastName: true, position: true } },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return { records, total };
  }

  async upsert(data: UpsertAttendanceInput, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId, deletedAt: null },
    });
    if (!employee) throw new NotFoundError('Empleado', data.employeeId);

    const date = new Date(data.date);

    return prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: data.employeeId, date } },
      create: {
        employeeId: data.employeeId,
        date,
        type: (data.type as any) ?? 'PRESENT',
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        hoursWorked: data.hoursWorked,
        overtimeHours: data.overtimeHours,
        notes: data.notes,
      },
      update: {
        type: data.type as any,
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        hoursWorked: data.hoursWorked,
        overtimeHours: data.overtimeHours,
        notes: data.notes,
      },
      include: {
        employee: { select: { id: true, legajo: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const record = await prisma.attendance.findFirst({
      where: { id, employee: { organizationId } },
    });
    if (!record) throw new NotFoundError('Registro de asistencia', id);
    await prisma.attendance.delete({ where: { id } });
  }

  async getMonthlySummary(organizationId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        employee: { organizationId, isActive: true },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        employee: { select: { id: true, legajo: true, firstName: true, lastName: true, position: true } },
      },
      orderBy: [{ employee: { lastName: 'asc' } }, { date: 'asc' }],
    });

    // Group by employee
    const byEmployee = records.reduce<Record<string, any>>((acc, r) => {
      const empId = r.employee.id;
      if (!acc[empId]) {
        acc[empId] = { employee: r.employee, records: [], totals: { present: 0, absent: 0, late: 0, halfDay: 0, vacation: 0, sickLeave: 0, hoursWorked: 0, overtime: 0 } };
      }
      acc[empId].records.push(r);
      const t = acc[empId].totals;
      switch (r.type) {
        case 'PRESENT': t.present++; break;
        case 'ABSENT': t.absent++; break;
        case 'LATE': t.late++; break;
        case 'HALF_DAY': t.halfDay++; break;
        case 'VACATION': t.vacation++; break;
        case 'SICK_LEAVE': t.sickLeave++; break;
      }
      t.hoursWorked += Number(r.hoursWorked ?? 0);
      t.overtime += Number(r.overtimeHours ?? 0);
      return acc;
    }, {});

    return Object.values(byEmployee);
  }
}

export const attendanceService = new AttendanceService();
