import dayjs from 'dayjs';

import type { LeaveBalance, LeaveType, PeruHoliday } from '#/services/domain';

import { employeeMock } from './employees';
import { requestsMock } from './requests';

export const leaveBalancesMock: LeaveBalance[] = employeeMock.map(
  (employee) => ({
    employeeId: employee.id,
    leaveType: 'Vacaciones anuales',
    entitledDays: 30,
    usedDays: requestsMock
      .filter(
        (request) =>
          request.employeeId === employee.id &&
          request.type === 'Vacaciones' &&
          request.status === 'Aprobado',
      )
      .reduce((days, request) => days + request.days, 0),
    pendingDays: requestsMock
      .filter(
        (request) =>
          request.employeeId === employee.id &&
          request.type === 'Vacaciones' &&
          request.status === 'Solicitado',
      )
      .reduce((days, request) => days + request.days, 0),
  }),
);

export const leaveTypesMock: LeaveType[] = [
  {
    id: 'annual-vacation',
    name: 'Vacaciones anuales',
    paid: true,
    annualDays: 30,
    annualReset: true,
  },
  {
    id: 'medical-leave',
    name: 'Descanso médico',
    paid: true,
    annualDays: null,
    annualReset: false,
  },
  {
    id: 'parental-leave',
    name: 'Licencia de maternidad o paternidad',
    paid: true,
    annualDays: null,
    annualReset: false,
  },
  {
    id: 'paid-permission',
    name: 'Permiso con goce',
    paid: true,
    annualDays: null,
    annualReset: false,
  },
  {
    id: 'unpaid-permission',
    name: 'Permiso sin goce',
    paid: false,
    annualDays: null,
    annualReset: false,
  },
  {
    id: 'occasional-permission',
    name: 'Permiso ocasional',
    paid: true,
    annualDays: null,
    annualReset: false,
  },
];

const holidaySeeds = [
  { month: 4, day: 1, name: 'Día del Trabajo' },
  { month: 6, day: 28, name: 'Fiestas Patrias' },
  { month: 6, day: 29, name: 'Fiestas Patrias' },
  { month: 9, day: 8, name: 'Combate de Angamos' },
];

export const peruHolidaysMock: PeruHoliday[] = holidaySeeds.map(
  (holiday, index) => {
    let date = dayjs().month(holiday.month).date(holiday.day);
    if (date.isBefore(dayjs(), 'day')) {
      date = date.add(1, 'year');
    }
    return {
      id: `pe-holiday-${index + 1}`,
      date: date.format('YYYY-MM-DD'),
      name: holiday.name,
      region: 'Nacional',
    };
  },
);
