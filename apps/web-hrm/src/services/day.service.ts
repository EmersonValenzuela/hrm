import type { DemoRole, DemoTask } from './domain';

import dayjs from 'dayjs';

import { getDemoEmployee, readDemoState, updateDemoState } from './api';
import { attendanceService } from './attendance.service';

export interface DaySummary {
  role: DemoRole;
  activeEmployees: number;
  pendingRequests: number;
  pendingAttendance: number;
  onboardingActive: number;
  offboardingActive: number;
  teamMembers: Array<{
    id: string;
    name: string;
    title: string;
    initials: string;
    status: string;
  }>;
  clockedIn: boolean;
  lastClockTime: null | string;
  vacationDays: number;
  tasks: DemoTask[];
  events: Array<{ date: string; label: string; detail: string }>;
  currentEmployee: {
    name: string;
    title: string;
    group: string;
    initials: string;
  };
}

export const dayService = {
  async getSummary(role: DemoRole): Promise<DaySummary> {
    const state = await readDemoState();
    const currentEmployee = getDemoEmployee(state, role);
    const leaveBalance = state.leaveBalances.find(
      (balance) => balance.employeeId === currentEmployee.id,
    );

    return {
      role,
      activeEmployees: state.employees.filter(
        (employee) => employee.status === 'Activo',
      ).length,
      pendingRequests: state.requests.filter(
        (request) => request.status === 'Solicitado',
      ).length,
      pendingAttendance: state.attendance.filter(
        (record) =>
          record.date === dayjs().format('YYYY-MM-DD') &&
          record.status === 'Por validar',
      ).length,
      onboardingActive: state.onboarding.filter(
        (process) => process.status === 'En curso',
      ).length,
      offboardingActive: state.offboarding.filter(
        (process) => process.status === 'En curso',
      ).length,
      teamMembers: state.employees
        .filter((employee) => employee.group === currentEmployee.group)
        .slice(0, 5)
        .map((employee) => {
          const todayRecord = state.attendance.find(
            (record) =>
              record.employeeId === employee.id &&
              record.date === dayjs().format('YYYY-MM-DD'),
          );
          let status = 'Sin marcar';
          if (todayRecord?.checkIn) {
            status = 'Presente';
          } else if (employee.modality === 'Remoto') {
            status = 'Remoto';
          }
          return {
            id: employee.id,
            name: employee.name,
            title: employee.title,
            initials: employee.initials,
            status,
          };
        }),
      clockedIn: state.clockedIn,
      lastClockTime: state.lastClockTime,
      vacationDays: leaveBalance
        ? leaveBalance.entitledDays -
          leaveBalance.usedDays -
          leaveBalance.pendingDays
        : 0,
      tasks: state.tasks.filter(
        (task) =>
          task.role === role &&
          (!task.employeeId || task.employeeId === currentEmployee.id),
      ),
      events: state.dateHighlights
        .filter((event) => !dayjs(event.date).isBefore(dayjs(), 'day'))
        .toSorted((left, right) => left.date.localeCompare(right.date))
        .slice(0, 3)
        .map((event) => ({
          date: dayjs(event.date).format('D [de] MMMM'),
          label: event.label,
          detail: event.detail,
        })),
      currentEmployee: {
        name: currentEmployee.name,
        title: currentEmployee.title,
        group: currentEmployee.group,
        initials: currentEmployee.initials,
      },
    };
  },

  async toggleAttendance(role: DemoRole) {
    const state = await readDemoState();
    const currentEmployee = getDemoEmployee(state, role);
    return attendanceService.markNow(currentEmployee.id);
  },

  async completeTask(taskId: string) {
    return updateDemoState((nextState) => {
      const task = nextState.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new Error('No encontramos esa tarea.');
      }
      task.done = !task.done;
      const processTask = nextState.onboarding
        .flatMap((process) => process.tasks)
        .find((item) => item.id === taskId);
      if (processTask) {
        processTask.status = task.done ? 'Completada' : 'Pendiente';
      }
    });
  },
};
