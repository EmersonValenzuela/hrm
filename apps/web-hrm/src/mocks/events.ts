import dayjs from 'dayjs';

import type { DateHighlight } from '#/services/domain';

import { employeeMock } from './employees';

export const dateHighlightsMock: DateHighlight[] = [
  ...employeeMock.slice(0, 3).map((employee) => ({
    id: `birthday-${employee.id}`,
    date: employee.birthday,
    label: 'Cumpleaños del equipo',
    detail: employee.name,
    kind: 'Cumpleaños' as const,
  })),
  ...employeeMock.slice(3, 5).map((employee, index) => ({
    id: `anniversary-${employee.id}`,
    date: (() => {
      let nextDate = dayjs(employee.startDate).year(dayjs().year());
      if (nextDate.isBefore(dayjs(), 'day')) {
        nextDate = nextDate.add(1, 'year');
      }
      return nextDate.format('YYYY-MM-DD');
    })(),
    label: 'Aniversario de ingreso',
    detail: `${employee.name} · ${index + 2} años`,
    kind: 'Aniversario' as const,
  })),
];
