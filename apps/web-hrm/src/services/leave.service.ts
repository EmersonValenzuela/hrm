import type { LeaveBalance } from './domain';

import { readDemoState, updateDemoState } from './api';

export interface LeaveBalanceView extends LeaveBalance {
  availableDays: number;
}

export const leaveService = {
  async listBalances() {
    const { leaveBalances } = await readDemoState();
    return leaveBalances.map((balance) => ({
      ...balance,
      availableDays:
        balance.entitledDays - balance.usedDays - balance.pendingDays,
    }));
  },

  async getBalance(employeeId: string, leaveType = 'Vacaciones anuales') {
    const { leaveBalances } = await readDemoState();
    const balance = leaveBalances.find(
      (item) => item.employeeId === employeeId && item.leaveType === leaveType,
    );
    return balance
      ? {
          ...balance,
          availableDays:
            balance.entitledDays - balance.usedDays - balance.pendingDays,
        }
      : null;
  },

  async setBalance(nextBalance: LeaveBalance) {
    return updateDemoState((state) => {
      if (
        !state.employees.some(
          (employee) => employee.id === nextBalance.employeeId,
        )
      ) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      if (
        nextBalance.entitledDays < 0 ||
        nextBalance.usedDays < 0 ||
        nextBalance.pendingDays < 0 ||
        nextBalance.usedDays + nextBalance.pendingDays >
          nextBalance.entitledDays
      ) {
        throw new Error(
          'El saldo debe ser positivo y no puede superar los días asignados.',
        );
      }
      const index = state.leaveBalances.findIndex(
        (item) =>
          item.employeeId === nextBalance.employeeId &&
          item.leaveType === nextBalance.leaveType,
      );
      if (index === -1) {
        state.leaveBalances.push(nextBalance);
      } else {
        state.leaveBalances[index] = nextBalance;
      }
    });
  },

  async listTypes() {
    const { leaveTypes } = await readDemoState();
    return leaveTypes;
  },

  async listHolidays(from?: string, to?: string) {
    const { holidays } = await readDemoState();
    return holidays.filter(
      (holiday) =>
        (!from || holiday.date >= from) && (!to || holiday.date <= to),
    );
  },
};
