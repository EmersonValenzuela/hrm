import dayjs from 'dayjs';

import { readDemoState } from './api';

const monthFormat = 'MMM';
const dateFormat = 'YYYY-MM-DD';

export interface AdminDashboardSummary {
  activeEmployees: number;
  attendanceToday: {
    present: number;
    pending: number;
    percentage: number;
  };
  attendanceTrend: Array<{ day: string; present: number }>;
  attention: Array<{
    count: number;
    detail: string;
    id: string;
    label: string;
    route: string;
    tone: 'info' | 'warning';
  }>;
  groupDistribution: Array<{ group: string; people: number }>;
  movement: Array<{ entries: number; exits: number; month: string }>;
  onboarding: Array<{ employee: string; expectedEndDate: string; id: string }>;
  pendingRequests: number;
  processesInProgress: number;
}

export const adminDashboardService = {
  async getSummary(): Promise<AdminDashboardSummary> {
    const state = await readDemoState();
    const today = dayjs();
    const activeEmployees = state.employees.filter(
      (employee) => employee.status === 'Activo',
    );
    const activeIds = new Set(activeEmployees.map((employee) => employee.id));
    const todayAttendance = state.attendance.filter(
      (record) =>
        record.date === today.format(dateFormat) &&
        activeIds.has(record.employeeId),
    );
    const presentToday = todayAttendance.filter(
      (record) => record.checkIn !== null,
    ).length;
    const pendingAttendance = todayAttendance.filter(
      (record) => record.status === 'Por validar',
    ).length;
    const pendingRequests = state.requests.filter(
      (request) => request.status === 'Solicitado',
    ).length;
    const onboarding = state.onboarding.filter(
      (process) => process.status === 'En curso',
    );
    const offboarding = state.offboarding.filter(
      (process) => process.status === 'En curso',
    );
    const overdueTasks = [...state.onboarding, ...state.offboarding]
      .flatMap((process) => process.tasks)
      .filter(
        (task) =>
          task.status !== 'Completada' &&
          dayjs(task.dueDate).isBefore(today, 'day'),
      ).length;
    const upcomingExits = offboarding.filter(
      (process) =>
        !dayjs(process.exitDate).isBefore(today, 'day') &&
        dayjs(process.exitDate).diff(today, 'day') <= 30,
    ).length;

    return {
      activeEmployees: activeEmployees.length,
      attendanceToday: {
        present: presentToday,
        pending: pendingAttendance,
        percentage:
          activeEmployees.length > 0
            ? Math.round((presentToday / activeEmployees.length) * 100)
            : 0,
      },
      attendanceTrend: Array.from({ length: 10 }, (_, index) =>
        today.subtract(index, 'day'),
      )
        .filter((date) => date.day() !== 0 && date.day() !== 6)
        .slice(0, 7)
        .toReversed()
        .map((date) => ({
          day: date.format('dd D'),
          present: state.attendance.filter(
            (record) =>
              record.date === date.format(dateFormat) &&
              record.checkIn !== null &&
              activeIds.has(record.employeeId),
          ).length,
        })),
      attention: [
        {
          id: 'requests',
          label: 'Solicitudes por revisar',
          count: pendingRequests,
          detail: 'Vacaciones, permisos y otros pedidos del equipo.',
          route: '/aprobaciones',
          tone: 'warning',
        },
        {
          id: 'attendance',
          label: 'Marcaciones por validar',
          count: pendingAttendance,
          detail: 'Registros del día que necesitan tu revisión.',
          route: '/asistencia/correcciones',
          tone: 'info',
        },
        {
          id: 'overdue',
          label: 'Tareas fuera de fecha',
          count: overdueTasks,
          detail: 'Pasos de ingreso o salida que requieren seguimiento.',
          route: '/onboarding/procesos',
          tone: 'warning',
        },
        {
          id: 'exits',
          label: 'Salidas próximas',
          count: upcomingExits,
          detail: 'Procesos con fecha de salida dentro de 30 días.',
          route: '/offboarding/procesos',
          tone: 'info',
        },
      ],
      groupDistribution: state.groups
        .map((group) => ({
          group,
          people: activeEmployees.filter((employee) => employee.group === group)
            .length,
        }))
        .filter((item) => item.people > 0)
        .toSorted((left, right) => right.people - left.people),
      movement: Array.from({ length: 6 }, (_, index) =>
        today.subtract(5 - index, 'month'),
      ).map((month) => ({
        month: month.format(monthFormat),
        entries: state.employees.filter((employee) =>
          dayjs(employee.startDate).isSame(month, 'month'),
        ).length,
        exits: state.offboarding.filter((process) =>
          dayjs(process.exitDate).isSame(month, 'month'),
        ).length,
      })),
      onboarding: onboarding
        .map((process) => {
          const employee = state.employees.find(
            (person) => person.id === process.employeeId,
          );
          return {
            employee: employee?.name ?? 'Persona del equipo',
            expectedEndDate: process.expectedEndDate,
            id: process.id,
          };
        })
        .toSorted((left, right) =>
          left.expectedEndDate.localeCompare(right.expectedEndDate),
        )
        .slice(0, 3),
      pendingRequests,
      processesInProgress: onboarding.length + offboarding.length,
    };
  },
};
