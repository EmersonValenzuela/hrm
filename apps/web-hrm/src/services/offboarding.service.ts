import dayjs from 'dayjs';

import type { OffboardingProcess, ProcessTask } from './domain';

import { readDemoState, updateDemoState } from './api';

export type NewOffboardingProcess = Omit<
  OffboardingProcess,
  'id' | 'startedAt' | 'status' | 'completedAt'
>;

export const offboardingService = {
  async list() {
    const { offboarding } = await readDemoState();
    return offboarding;
  },

  async get(id: string) {
    const { offboarding } = await readDemoState();
    return offboarding.find((process) => process.id === id) ?? null;
  },

  async create(data: NewOffboardingProcess) {
    let processId = '';
    const { offboarding } = await updateDemoState((state) => {
      const employee = state.employees.find(
        (item) => item.id === data.employeeId,
      );
      if (!employee || employee.status !== 'Activo') {
        throw new Error(
          'Solo puedes iniciar el offboarding de una persona activa.',
        );
      }
      if (
        state.offboarding.some(
          (process) =>
            process.employeeId === data.employeeId &&
            process.status === 'En curso',
        )
      ) {
        throw new Error('Esta persona ya tiene un offboarding en curso.');
      }
      if (!data.reason.trim() || !data.exitDate) {
        throw new Error('Indica el motivo y la fecha de salida.');
      }
      if (dayjs(data.exitDate).isBefore(dayjs(), 'day')) {
        throw new Error('La fecha de salida no puede estar en el pasado.');
      }
      processId = `off-${dayjs().format('YYYYMMDD-HHmmss-SSS')}`;
      state.offboarding.push({
        ...data,
        id: processId,
        startedAt: dayjs().format('YYYY-MM-DD'),
        status: 'En curso',
        completedAt: null,
        tasks: structuredClone(data.tasks),
      });
    });
    const created = offboarding.find((process) => process.id === processId);
    if (!created) {
      throw new Error('No pudimos iniciar el offboarding.');
    }
    return created;
  },

  async updateTask(
    processId: string,
    taskId: string,
    changes: Partial<
      Pick<ProcessTask, 'dueDate' | 'responsible' | 'comment' | 'status'>
    >,
  ) {
    const { offboarding } = await updateDemoState((state) => {
      const process = state.offboarding.find((item) => item.id === processId);
      const task = process?.tasks.find((item) => item.id === taskId);
      if (!process || !task) {
        throw new Error('No encontramos esa tarea de offboarding.');
      }
      if (process.status !== 'En curso') {
        throw new Error('Este offboarding ya está finalizado.');
      }
      Object.assign(task, changes);
    });
    const updated = offboarding
      .find((process) => process.id === processId)
      ?.tasks.find((task) => task.id === taskId);
    if (!updated) {
      throw new Error('No pudimos actualizar la tarea de offboarding.');
    }
    return updated;
  },

  async finish(id: string) {
    const { offboarding } = await updateDemoState((state) => {
      const process = state.offboarding.find((item) => item.id === id);
      if (!process || process.status !== 'En curso') {
        throw new Error('Este offboarding no está disponible para finalizar.');
      }
      if (process.tasks.some((task) => task.status !== 'Completada')) {
        throw new Error(
          'Completa todas las etapas antes de finalizar el offboarding.',
        );
      }
      const employee = state.employees.find(
        (item) => item.id === process.employeeId,
      );
      if (!employee) {
        throw new Error('No encontramos a la persona asociada al proceso.');
      }
      process.status = 'Completado';
      process.completedAt = dayjs().format('YYYY-MM-DD');
      employee.status = 'Inactivo';
    });
    const finished = offboarding.find((process) => process.id === id);
    if (!finished) {
      throw new Error('No pudimos finalizar el offboarding.');
    }
    return finished;
  },

  async remove(id: string) {
    return updateDemoState((state) => {
      const index = state.offboarding.findIndex((process) => process.id === id);
      if (index === -1) {
        throw new Error('No encontramos ese proceso de offboarding.');
      }
      state.offboarding.splice(index, 1);
    });
  },
};
