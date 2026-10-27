import dayjs from 'dayjs';

import type { DemoRequest, RequestStatus, RequestType } from './domain';

import { readDemoState, updateDemoState } from './api';

export interface RequestFilters {
  employeeId?: string;
  status?: RequestStatus;
  type?: RequestType;
}

type NewRequest = Pick<
  DemoRequest,
  'employeeId' | 'type' | 'title' | 'startDate' | 'endDate' | 'days' | 'reason'
>;

type EditableRequest = Pick<
  DemoRequest,
  'title' | 'startDate' | 'endDate' | 'days' | 'reason'
>;

function balanceForEmployee(
  balances: Awaited<ReturnType<typeof readDemoState>>['leaveBalances'],
  employeeId: string,
) {
  const balance = balances.find(
    (item) =>
      item.employeeId === employeeId && item.leaveType === 'Vacaciones anuales',
  );
  if (!balance) {
    throw new Error('No encontramos el saldo de vacaciones de esta persona.');
  }
  return balance;
}

function releasePendingVacation(
  state: Awaited<ReturnType<typeof readDemoState>>,
  request: DemoRequest,
) {
  if (request.type === 'Vacaciones' && request.days > 0) {
    const balance = balanceForEmployee(state.leaveBalances, request.employeeId);
    balance.pendingDays -= request.days;
  }
}

export const requestsService = {
  async list(filters: RequestFilters = {}) {
    const { requests } = await readDemoState();
    return requests.filter(
      (request) =>
        (!filters.employeeId || request.employeeId === filters.employeeId) &&
        (!filters.status || request.status === filters.status) &&
        (!filters.type || request.type === filters.type),
    );
  },

  async get(id: string) {
    const { requests } = await readDemoState();
    return requests.find((request) => request.id === id) ?? null;
  },

  async create(data: NewRequest) {
    let createdId = '';
    const { requests } = await updateDemoState((state) => {
      if (
        !state.employees.some((employee) => employee.id === data.employeeId)
      ) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      if (!data.title.trim() || !data.reason.trim()) {
        throw new Error('Completa el título y el motivo de la solicitud.');
      }
      if (data.type === 'Vacaciones') {
        if (!data.startDate || !data.endDate || data.days <= 0) {
          throw new Error(
            'Indica un rango de fechas y una cantidad válida de días.',
          );
        }
        if (dayjs(data.endDate).isBefore(dayjs(data.startDate), 'day')) {
          throw new Error(
            'La fecha de fin debe ser igual o posterior a la de inicio.',
          );
        }
        const balance = balanceForEmployee(
          state.leaveBalances,
          data.employeeId,
        );
        const available =
          balance.entitledDays - balance.usedDays - balance.pendingDays;
        if (data.days > available) {
          throw new Error('La cantidad solicitada supera tu saldo disponible.');
        }
        balance.pendingDays += data.days;
      }
      createdId = `req-${dayjs().format('YYYYMMDD-HHmmss-SSS')}`;
      state.requests.push({
        ...data,
        id: createdId,
        status: 'Solicitado',
        createdAt: dayjs().format('YYYY-MM-DD'),
        reviewerComment: '',
      });
    });
    const created = requests.find((request) => request.id === createdId);
    if (!created) {
      throw new Error('No pudimos guardar la solicitud.');
    }
    return created;
  },

  async update(id: string, changes: EditableRequest) {
    const { requests } = await updateDemoState((state) => {
      const request = state.requests.find((item) => item.id === id);
      if (!request) {
        throw new Error('No encontramos esa solicitud.');
      }
      if (request.status !== 'Solicitado') {
        throw new Error('Solo puedes editar una solicitud pendiente.');
      }
      if (!changes.title.trim() || !changes.reason.trim()) {
        throw new Error('Completa el título y el motivo de la solicitud.');
      }
      if (request.type === 'Vacaciones') {
        if (!changes.startDate || !changes.endDate || changes.days <= 0) {
          throw new Error(
            'Indica un rango de fechas y una cantidad válida de días.',
          );
        }
        if (dayjs(changes.endDate).isBefore(dayjs(changes.startDate), 'day')) {
          throw new Error(
            'La fecha de fin debe ser igual o posterior a la de inicio.',
          );
        }
        const balance = balanceForEmployee(
          state.leaveBalances,
          request.employeeId,
        );
        const availableBeforeChange =
          balance.entitledDays - balance.usedDays - balance.pendingDays;
        const availableWithPreviousReservation =
          availableBeforeChange + request.days;
        if (changes.days > availableWithPreviousReservation) {
          throw new Error('La cantidad solicitada supera tu saldo disponible.');
        }
        balance.pendingDays += changes.days - request.days;
      }
      Object.assign(request, changes);
    });
    const updated = requests.find((request) => request.id === id);
    if (!updated) {
      throw new Error('No pudimos actualizar la solicitud.');
    }
    return updated;
  },

  async approve(id: string, reviewerComment = '') {
    const { requests } = await updateDemoState((state) => {
      const request = state.requests.find((item) => item.id === id);
      if (!request || request.status !== 'Solicitado') {
        throw new Error('Esta solicitud ya no está pendiente de aprobación.');
      }
      if (request.type === 'Vacaciones' && request.days > 0) {
        const balance = balanceForEmployee(
          state.leaveBalances,
          request.employeeId,
        );
        if (balance.pendingDays < request.days) {
          throw new Error('El saldo pendiente no coincide con esta solicitud.');
        }
        balance.pendingDays -= request.days;
        balance.usedDays += request.days;
      }
      request.status = 'Aprobado';
      request.reviewerComment = reviewerComment;
    });
    const updated = requests.find((request) => request.id === id);
    if (!updated) {
      throw new Error('No pudimos aprobar la solicitud.');
    }
    return updated;
  },

  async reject(id: string, reviewerComment = '') {
    const { requests } = await updateDemoState((state) => {
      const request = state.requests.find((item) => item.id === id);
      if (!request || request.status !== 'Solicitado') {
        throw new Error('Esta solicitud ya no está pendiente de revisión.');
      }
      releasePendingVacation(state, request);
      request.status = 'Rechazado';
      request.reviewerComment = reviewerComment;
    });
    const updated = requests.find((request) => request.id === id);
    if (!updated) {
      throw new Error('No pudimos rechazar la solicitud.');
    }
    return updated;
  },

  async cancel(id: string) {
    const { requests } = await updateDemoState((state) => {
      const request = state.requests.find((item) => item.id === id);
      if (!request || request.status !== 'Solicitado') {
        throw new Error('Solo puedes cancelar una solicitud pendiente.');
      }
      releasePendingVacation(state, request);
      request.status = 'Cancelado';
    });
    const updated = requests.find((request) => request.id === id);
    if (!updated) {
      throw new Error('No pudimos cancelar la solicitud.');
    }
    return updated;
  },

  async remove(id: string) {
    return updateDemoState((state) => {
      const index = state.requests.findIndex((request) => request.id === id);
      const request = state.requests[index];
      if (!request) {
        throw new Error('No encontramos esa solicitud.');
      }
      if (request.status === 'Solicitado') {
        releasePendingVacation(state, request);
      }
      state.requests.splice(index, 1);
    });
  },
};
