import dayjs from 'dayjs';

import type {
  DemoRequest,
  RequestStatus,
  RequestType,
} from '#/services/domain';

import { employeeMock } from './employees';

const requestsSeed: Array<{
  type: RequestType;
  status: RequestStatus;
  employeeIndex: number;
  days: number;
}> = [
  { type: 'Vacaciones', status: 'Aprobado', employeeIndex: 0, days: 12 },
  { type: 'Vacaciones', status: 'Solicitado', employeeIndex: 1, days: 4 },
  { type: 'Vacaciones', status: 'Rechazado', employeeIndex: 2, days: 3 },
  { type: 'Permiso', status: 'Aprobado', employeeIndex: 3, days: 1 },
  { type: 'Documento', status: 'Solicitado', employeeIndex: 0, days: 0 },
  {
    type: 'Corrección de asistencia',
    status: 'Solicitado',
    employeeIndex: 4,
    days: 0,
  },
  { type: 'Cambio de turno', status: 'Cancelado', employeeIndex: 5, days: 0 },
  { type: 'Vacaciones', status: 'Solicitado', employeeIndex: 6, days: 2 },
  { type: 'Permiso', status: 'Rechazado', employeeIndex: 7, days: 1 },
  { type: 'Documento', status: 'Aprobado', employeeIndex: 8, days: 0 },
  { type: 'Vacaciones', status: 'Aprobado', employeeIndex: 9, days: 5 },
  {
    type: 'Corrección de asistencia',
    status: 'Aprobado',
    employeeIndex: 10,
    days: 0,
  },
  { type: 'Cambio de turno', status: 'Solicitado', employeeIndex: 11, days: 0 },
  { type: 'Permiso', status: 'Solicitado', employeeIndex: 12, days: 1 },
  { type: 'Vacaciones', status: 'Cancelado', employeeIndex: 13, days: 3 },
  { type: 'Documento', status: 'Rechazado', employeeIndex: 14, days: 0 },
  { type: 'Vacaciones', status: 'Aprobado', employeeIndex: 15, days: 2 },
  { type: 'Permiso', status: 'Aprobado', employeeIndex: 16, days: 1 },
];

export const requestsMock: DemoRequest[] = requestsSeed.map(
  (request, index) => {
    const employee = employeeMock[request.employeeIndex];
    if (!employee) {
      throw new Error(
        'El mock de solicitudes referencia a una persona inexistente.',
      );
    }

    const startDate = dayjs()
      .add(index % 9, 'day')
      .format('YYYY-MM-DD');
    const endDate = request.days
      ? dayjs(startDate)
          .add(request.days - 1, 'day')
          .format('YYYY-MM-DD')
      : null;

    return {
      id: `req-${String(index + 1).padStart(4, '0')}`,
      employeeId: employee.id,
      type: request.type,
      title:
        request.type === 'Vacaciones'
          ? `Vacaciones de ${employee.firstName}`
          : request.type === 'Permiso'
            ? `Permiso de ${employee.firstName}`
            : request.type,
      status: request.status,
      createdAt: dayjs()
        .subtract(index + 1, 'day')
        .format('YYYY-MM-DD'),
      startDate: request.days ? startDate : null,
      endDate,
      days: request.days,
      reason:
        request.type === 'Vacaciones'
          ? 'Descanso personal coordinado con el equipo.'
          : 'Solicitud de demostración para revisión.',
      reviewerComment:
        request.status === 'Rechazado'
          ? 'Revisa las fechas con tu equipo.'
          : '',
    };
  },
);
