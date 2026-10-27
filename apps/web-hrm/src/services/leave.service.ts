import type { LeaveBalance, LeaveType, PeruHoliday } from './domain';

import dayjs from 'dayjs';

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

  async createType(data: Omit<LeaveType, 'id'>) {
    let id = '';
    const { leaveTypes } = await updateDemoState((state) => {
      const name = data.name.trim();
      if (!name) throw new Error('Escribe el nombre del tipo de descanso.');
      if (
        data.annualDays !== null &&
        (data.annualDays < 0 || data.annualDays > 365)
      ) {
        throw new Error('Los días anuales deben estar entre 0 y 365.');
      }
      if (
        state.leaveTypes.some(
          (item) =>
            item.name.toLocaleLowerCase('es-PE') ===
            name.toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ya existe un tipo de descanso con ese nombre.');
      }
      id = `leave-type-${Date.now()}`;
      state.leaveTypes.push({ ...data, name, id });
    });
    const created = leaveTypes.find((item) => item.id === id);
    if (!created) throw new Error('No pudimos crear el tipo de descanso.');
    return created;
  },

  async updateType(id: string, changes: Omit<LeaveType, 'id'>) {
    const { leaveTypes } = await updateDemoState((state) => {
      const target = state.leaveTypes.find((item) => item.id === id);
      if (!target) throw new Error('No encontramos ese tipo de descanso.');
      const name = changes.name.trim();
      if (!name) throw new Error('Escribe el nombre del tipo de descanso.');
      if (
        changes.annualDays !== null &&
        (changes.annualDays < 0 || changes.annualDays > 365)
      ) {
        throw new Error('Los días anuales deben estar entre 0 y 365.');
      }
      if (
        state.leaveTypes.some(
          (item) =>
            item.id !== id &&
            item.name.toLocaleLowerCase('es-PE') ===
              name.toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ya existe un tipo de descanso con ese nombre.');
      }
      Object.assign(target, changes, { name });
    });
    const updated = leaveTypes.find((item) => item.id === id);
    if (!updated) throw new Error('No pudimos actualizar el tipo de descanso.');
    return updated;
  },

  async removeType(id: string) {
    return updateDemoState((state) => {
      const target = state.leaveTypes.find((item) => item.id === id);
      if (!target) throw new Error('No encontramos ese tipo de descanso.');
      if (
        state.leaveBalances.some((balance) => balance.leaveType === target.name)
      ) {
        throw new Error(
          'No puedes quitar un tipo que ya tiene saldos asignados.',
        );
      }
      state.leaveTypes = state.leaveTypes.filter((item) => item.id !== id);
    });
  },

  async listHolidays(from?: string, to?: string) {
    const { holidays } = await readDemoState();
    return holidays.filter(
      (holiday) =>
        (!from || holiday.date >= from) && (!to || holiday.date <= to),
    );
  },

  async createHoliday(data: Omit<PeruHoliday, 'id'>) {
    let id = '';
    const { holidays } = await updateDemoState((state) => {
      if (!data.name.trim() || !dayjs(data.date).isValid())
        throw new Error('Completa el nombre y la fecha del feriado.');
      if (
        state.holidays.some(
          (item) =>
            item.date === data.date &&
            item.name.toLocaleLowerCase('es-PE') ===
              data.name.trim().toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ese feriado ya está registrado.');
      }
      id = `pe-holiday-${Date.now()}`;
      state.holidays.push({ ...data, name: data.name.trim(), id });
    });
    const created = holidays.find((item) => item.id === id);
    if (!created) throw new Error('No pudimos registrar el feriado.');
    return created;
  },

  async updateHoliday(id: string, changes: Omit<PeruHoliday, 'id'>) {
    const { holidays } = await updateDemoState((state) => {
      const target = state.holidays.find((item) => item.id === id);
      if (!target) throw new Error('No encontramos ese feriado.');
      if (!changes.name.trim() || !dayjs(changes.date).isValid())
        throw new Error('Completa el nombre y la fecha del feriado.');
      if (
        state.holidays.some(
          (item) =>
            item.id !== id &&
            item.date === changes.date &&
            item.name.toLocaleLowerCase('es-PE') ===
              changes.name.trim().toLocaleLowerCase('es-PE'),
        )
      ) {
        throw new Error('Ese feriado ya está registrado.');
      }
      Object.assign(target, changes, {
        name: changes.name.trim(),
        region: changes.region.trim(),
      });
    });
    const updated = holidays.find((item) => item.id === id);
    if (!updated) throw new Error('No pudimos actualizar el feriado.');
    return updated;
  },

  async removeHoliday(id: string) {
    return updateDemoState((state) => {
      if (!state.holidays.some((item) => item.id === id)) {
        throw new Error('No encontramos ese feriado.');
      }
      state.holidays = state.holidays.filter((item) => item.id !== id);
    });
  },
};
