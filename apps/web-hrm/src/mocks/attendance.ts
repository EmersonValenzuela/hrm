import dayjs from 'dayjs';

import type { AttendanceRecord } from '#/services/domain';

import { employeeMock } from './employees';

const dates = Array.from({ length: 31 }, (_, index) =>
  dayjs().subtract(index, 'day'),
).filter((date) => date.day() !== 0 && date.day() !== 6);

export const attendanceMock: AttendanceRecord[] = employeeMock.flatMap(
  (employee, employeeIndex) =>
    dates.map((date, dateIndex) => {
      const seed = employeeIndex + dateIndex;
      const status =
        seed % 19 === 0
          ? 'Observada'
          : seed % 11 === 0
            ? 'Por validar'
            : 'Validada';
      const hour = seed % 5 === 0 ? 9 : 8;
      const minute = String((seed * 7) % 60).padStart(2, '0');

      return {
        id: `att-${employee.id}-${date.format('YYYYMMDD')}`,
        employeeId: employee.id,
        date: date.format('YYYY-MM-DD'),
        checkIn: `${String(hour).padStart(2, '0')}:${minute}`,
        checkOut: status === 'Por validar' ? null : '17:00',
        status,
        extraMinutes: seed % 23 === 0 ? 60 : 0,
        source: 'Registro de demo',
      };
    }),
);
