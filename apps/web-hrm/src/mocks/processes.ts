import dayjs from 'dayjs';

import type {
  OffboardingProcess,
  OnboardingProcess,
  ProcessTask,
} from '#/services/domain';

function createChecklist(
  processId: string,
  kind: 'onboarding' | 'offboarding',
  completeCount: number,
  dueOffset: number,
): ProcessTask[] {
  const stages: Array<[string, string, ProcessTask['responsible']]> =
    kind === 'onboarding'
      ? [
          ['Documentación', 'Completa tus datos de ingreso', 'colaborador'],
          ['Documentación', 'Revisar documentos de identidad', 'rrhh'],
          ['Equipos y accesos', 'Preparar equipo de trabajo', 'rrhh'],
          ['Equipos y accesos', 'Activar accesos de la cuenta', 'rrhh'],
          ['Inducción', 'Compartir bienvenida y cultura del equipo', 'jefe'],
          ['Capacitación', 'Programar capacitación inicial', 'jefe'],
          ['Seguimiento', 'Coordinar revisión del primer mes', 'jefe'],
        ]
      : [
          ['Formalización', 'Confirmar fecha y motivo de salida', 'rrhh'],
          ['Devolución de equipos', 'Coordinar devolución de equipo', 'rrhh'],
          ['Accesos', 'Programar cierre de accesos', 'rrhh'],
          ['Traspaso', 'Documentar el traspaso de responsabilidades', 'jefe'],
          [
            'Cierre administrativo',
            'Completar la tarea de liquidación',
            'rrhh',
          ],
        ];

  return stages.map(([stage, title, responsible], index) => {
    const isComplete = index < completeCount;
    const dueDate = dayjs()
      .add(dueOffset + index, 'day')
      .format('YYYY-MM-DD');
    return {
      id: `${processId}-task-${index + 1}`,
      title,
      stage,
      dueDate,
      responsible,
      status: isComplete
        ? 'Completada'
        : index === completeCount
          ? 'En curso'
          : 'Pendiente',
      comment: '',
    };
  });
}

function onboarding(
  id: string,
  employeeId: string,
  completeCount: number,
  status: OnboardingProcess['status'],
  startOffset: number,
): OnboardingProcess {
  const startedAt = dayjs().subtract(startOffset, 'day');
  const completed = status === 'Completado';
  return {
    id,
    employeeId,
    startedAt: startedAt.format('YYYY-MM-DD'),
    expectedEndDate: startedAt.add(30, 'day').format('YYYY-MM-DD'),
    responsibleId: 'emp-0003',
    status,
    tasks: createChecklist(id, 'onboarding', completeCount, 2),
    completedAt: completed
      ? dayjs().subtract(2, 'day').format('YYYY-MM-DD')
      : null,
  };
}

export const onboardingMock: OnboardingProcess[] = [
  onboarding('onb-0001', 'emp-0030', 2, 'En curso', 4),
  onboarding('onb-0002', 'emp-0029', 4, 'En curso', 9),
  onboarding('onb-0003', 'emp-0028', 1, 'En curso', 14),
  onboarding('onb-0004', 'emp-0027', 7, 'Completado', 40),
];

const activeOffboardingSeeds = [
  {
    employeeId: 'emp-0010',
    reason: 'Renuncia voluntaria',
    completeCount: 1,
    offset: 3,
  },
  {
    employeeId: 'emp-0017',
    reason: 'Fin de contrato',
    completeCount: 2,
    offset: 8,
  },
  {
    employeeId: 'emp-0021',
    reason: 'Motivos personales',
    completeCount: 0,
    offset: 12,
  },
];

const activeOffboarding: OffboardingProcess[] = activeOffboardingSeeds.map(
  (seed, index) => {
    const id = `off-000${index + 1}`;
    const startedAt = dayjs().subtract(seed.offset, 'day');
    return {
      id,
      employeeId: seed.employeeId,
      reason: seed.reason,
      startedAt: startedAt.format('YYYY-MM-DD'),
      exitDate: dayjs()
        .add(index + 5, 'day')
        .format('YYYY-MM-DD'),
      responsibleId: 'emp-0003',
      status: 'En curso',
      tasks: createChecklist(id, 'offboarding', seed.completeCount, 1),
      completedAt: null,
    };
  },
);

const historicalOffboarding: OffboardingProcess[] = Array.from(
  { length: 5 },
  (_, index) => {
    const id = `off-hist-${String(index + 1).padStart(3, '0')}`;
    const exitDate = dayjs().subtract((index + 1) * 24, 'day');
    return {
      id,
      employeeId: `emp-${String(22 + index).padStart(4, '0')}`,
      reason:
        [
          'Mejor oferta',
          'Fin de contrato',
          'Jubilación',
          'Renuncia voluntaria',
          'Motivos personales',
        ][index] ?? 'Renuncia voluntaria',
      startedAt: exitDate.subtract(14, 'day').format('YYYY-MM-DD'),
      exitDate: exitDate.format('YYYY-MM-DD'),
      responsibleId: 'emp-0003',
      status: 'Completado',
      tasks: createChecklist(id, 'offboarding', 5, -12),
      completedAt: exitDate.format('YYYY-MM-DD'),
    };
  },
);

export const offboardingMock = [...activeOffboarding, ...historicalOffboarding];
