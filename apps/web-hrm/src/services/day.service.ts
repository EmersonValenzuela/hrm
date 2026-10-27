import dayjs from 'dayjs';

import type { DemoRole, DemoTask } from './domain';

import { readDemoState, updateDemoState } from './api';
import { attendanceService } from './attendance.service';

export interface DaySummary {
  role: DemoRole;
  activeEmployees: number;
  clockedIn: boolean;
  lastClockTime: string | null;
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
    const currentEmployee = state.employees[0];
    if (!currentEmployee) {
      throw new Error('No hay personas disponibles para mostrar el resumen.');
    }
    const leaveBalance = state.leaveBalances.find(
      (balance) => balance.employeeId === currentEmployee.id,
    );

    return {
      role,
      activeEmployees: state.employees.filter(
        (employee) => employee.status === 'Activo',
      ).length,
      clockedIn: state.clockedIn,
      lastClockTime: state.lastClockTime,
      vacationDays: leaveBalance
        ? leaveBalance.entitledDays -
          leaveBalance.usedDays -
          leaveBalance.pendingDays
        : 0,
      tasks: state.tasks.filter((task) => task.role === role),
      events: state.dateHighlights
        .filter((event) => !dayjs(event.date).isBefore(dayjs(), 'day'))
        .sort((left, right) => left.date.localeCompare(right.date))
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

  async toggleAttendance() {
    const state = await readDemoState();
    const currentEmployee = state.employees[0];
    if (!currentEmployee) {
      throw new Error(
        'No hay una persona disponible para registrar la marcación.',
      );
    }
    return attendanceService.markNow(currentEmployee.id);
  },

  async completeTask(taskId: string) {
    return updateDemoState((nextState) => {
      const task = nextState.tasks.find((item) => item.id === taskId);
      if (!task) {
        throw new Error('No encontramos esa tarea.');
      }
      task.done = !task.done;
    });
  },
};
