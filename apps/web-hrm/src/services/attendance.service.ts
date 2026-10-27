import dayjs from 'dayjs';

import type { AttendanceRecord, AttendanceStatus } from './domain';

import { readDemoState, updateDemoState } from './api';

export interface AttendanceFilters {
  employeeId?: string;
  from?: string;
  status?: AttendanceStatus;
  to?: string;
}

export const attendanceService = {
  async list(filters: AttendanceFilters = {}) {
    const { attendance } = await readDemoState();
    return attendance.filter(
      (record) =>
        (!filters.employeeId || record.employeeId === filters.employeeId) &&
        (!filters.status || record.status === filters.status) &&
        (!filters.from || record.date >= filters.from) &&
        (!filters.to || record.date <= filters.to),
    );
  },

  async get(id: string) {
    const { attendance } = await readDemoState();
    return attendance.find((record) => record.id === id) ?? null;
  },

  async create(record: Omit<AttendanceRecord, 'id'> & { id?: string }) {
    let createdId = '';
    const { attendance } = await updateDemoState((nextState) => {
      if (
        !nextState.employees.some(
          (employee) => employee.id === record.employeeId,
        )
      ) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      const id =
        record.id ??
        `att-${record.employeeId}-${dayjs().format('YYYYMMDD-HHmmss-SSS')}`;
      if (nextState.attendance.some((item) => item.id === id)) {
        throw new Error('Ya existe una marcación con ese identificador.');
      }
      createdId = id;
      nextState.attendance.push({ ...record, id });
    });
    const created = attendance.find((item) => item.id === createdId);
    if (!created) {
      throw new Error('No pudimos registrar la marcación.');
    }
    return created;
  },

  async markNow(employeeId: string) {
    let updatedRecord: AttendanceRecord | undefined;
    const { clockedIn, lastClockTime } = await updateDemoState((nextState) => {
      const now = dayjs();
      const date = now.format('YYYY-MM-DD');
      const time = now.format('HH:mm');
      if (!nextState.employees.some((employee) => employee.id === employeeId)) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      const record = nextState.attendance.find(
        (item) =>
          item.employeeId === employeeId &&
          item.date === date &&
          item.source === 'Marcación personal',
      );
      if (record && !record.checkOut) {
        record.checkOut = time;
        record.status = 'Por validar';
        updatedRecord = record;
        nextState.clockedIn = false;
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${employeeId}-${now.format('YYYYMMDD-HHmmss-SSS')}`,
          employeeId,
          date,
          checkIn: time,
          checkOut: null,
          status: 'Por validar',
          extraMinutes: 0,
          source: 'Marcación personal',
        };
        nextState.attendance.push(newRecord);
        updatedRecord = newRecord;
        nextState.clockedIn = true;
      }
      nextState.lastClockTime = time;
    });
    if (!updatedRecord) {
      throw new Error('No pudimos guardar tu marcación.');
    }
    return { record: updatedRecord, clockedIn, lastClockTime };
  },

  async update(
    id: string,
    changes: Partial<Omit<AttendanceRecord, 'id' | 'employeeId'>>,
  ) {
    const { attendance } = await updateDemoState((nextState) => {
      const record = nextState.attendance.find((item) => item.id === id);
      if (!record) {
        throw new Error('No encontramos esa marcación.');
      }
      Object.assign(record, changes);
    });
    const updated = attendance.find((record) => record.id === id);
    if (!updated) {
      throw new Error('No pudimos actualizar la marcación.');
    }
    return updated;
  },

  async validate(id: string) {
    return this.update(id, { status: 'Validada' });
  },

  async validateMany(ids: string[]) {
    if (ids.length === 0) {
      throw new Error('Selecciona al menos una marcación para validar.');
    }
    return updateDemoState((nextState) => {
      const records = nextState.attendance.filter((record) =>
        ids.includes(record.id),
      );
      if (records.length !== new Set(ids).size) {
        throw new Error('Una o más marcaciones ya no están disponibles.');
      }
      records.forEach((record) => {
        if (record.status === 'Observada') {
          throw new Error(
            'Las marcaciones observadas requieren una revisión individual.',
          );
        }
        record.status = 'Validada';
      });
    });
  },

  async remove(id: string) {
    return updateDemoState((nextState) => {
      const index = nextState.attendance.findIndex(
        (record) => record.id === id,
      );
      if (index === -1) {
        throw new Error('No encontramos esa marcación.');
      }
      nextState.attendance.splice(index, 1);
    });
  },
};
