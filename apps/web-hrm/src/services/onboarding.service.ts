import dayjs from 'dayjs';

import type { OnboardingProcess, ProcessTask } from './domain';

import { readDemoState, updateDemoState } from './api';

export type NewOnboardingProcess = Omit<
  OnboardingProcess,
  'id' | 'startedAt' | 'status' | 'completedAt'
>;

export const onboardingService = {
  async list() {
    const { onboarding } = await readDemoState();
    return onboarding;
  },

  async get(id: string) {
    const { onboarding } = await readDemoState();
    return onboarding.find((process) => process.id === id) ?? null;
  },

  async create(data: NewOnboardingProcess) {
    let processId = '';
    const { onboarding } = await updateDemoState((state) => {
      const employee = state.employees.find(
        (item) => item.id === data.employeeId,
      );
      if (!employee) {
        throw new Error('No encontramos a esa persona en el directorio.');
      }
      if (
        state.onboarding.some(
          (process) =>
            process.employeeId === data.employeeId &&
            process.status === 'En curso',
        )
      ) {
        throw new Error('Esta persona ya tiene un onboarding en curso.');
      }
      processId = `onb-${dayjs().format('YYYYMMDD-HHmmss-SSS')}`;
      const process: OnboardingProcess = {
        ...data,
        id: processId,
        startedAt: dayjs().format('YYYY-MM-DD'),
        status: 'En curso',
        completedAt: null,
        tasks: structuredClone(data.tasks),
      };
      state.onboarding.push(process);
      employee.status = 'En onboarding';

      const firstColleagueTask = process.tasks.find(
        (task) =>
          task.responsible === 'colaborador' && task.status !== 'Completada',
      );
      if (firstColleagueTask) {
        state.tasks.push({
          id: firstColleagueTask.id,
          title: firstColleagueTask.title,
          detail: `Fecha límite: ${firstColleagueTask.dueDate}`,
          role: 'colaborador',
          done: false,
          employeeId: employee.id,
        });
      }
    });
    const created = onboarding.find((process) => process.id === processId);
    if (!created) {
      throw new Error('No pudimos iniciar el onboarding.');
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
    const { onboarding } = await updateDemoState((state) => {
      const process = state.onboarding.find((item) => item.id === processId);
      const task = process?.tasks.find((item) => item.id === taskId);
      if (!process || !task) {
        throw new Error('No encontramos esa tarea de onboarding.');
      }
      if (process.status !== 'En curso') {
        throw new Error('Este onboarding ya está finalizado.');
      }
      Object.assign(task, changes);
      const linkedTask = state.tasks.find(
        (item) => item.id === taskId && item.employeeId === process.employeeId,
      );
      if (linkedTask && changes.status) {
        linkedTask.done = changes.status === 'Completada';
      }
    });
    const updated = onboarding
      .find((process) => process.id === processId)
      ?.tasks.find((task) => task.id === taskId);
    if (!updated) {
      throw new Error('No pudimos actualizar la tarea de onboarding.');
    }
    return updated;
  },

  async finish(id: string) {
    const { onboarding } = await updateDemoState((state) => {
      const process = state.onboarding.find((item) => item.id === id);
      if (!process || process.status !== 'En curso') {
        throw new Error('Este onboarding no está disponible para finalizar.');
      }
      if (process.tasks.some((task) => task.status !== 'Completada')) {
        throw new Error(
          'Completa todas las etapas antes de finalizar el onboarding.',
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
      employee.status = 'Activo';
      state.tasks
        .filter((task) => task.employeeId === employee.id)
        .forEach((task) => {
          task.done = true;
        });
    });
    const finished = onboarding.find((process) => process.id === id);
    if (!finished) {
      throw new Error('No pudimos finalizar el onboarding.');
    }
    return finished;
  },

  async remove(id: string) {
    return updateDemoState((state) => {
      const index = state.onboarding.findIndex((process) => process.id === id);
      if (index === -1) {
        throw new Error('No encontramos ese proceso de onboarding.');
      }
      const [removed] = state.onboarding.splice(index, 1);
      if (removed) {
        state.tasks = state.tasks.filter(
          (task) => task.employeeId !== removed.employeeId,
        );
      }
    });
  },
};
