import type { PeoplePolicy, WorkflowTemplate } from '#/services/domain';

export const onboardingTemplatesMock: WorkflowTemplate[] = [
  {
    id: 'template-onboarding-standard',
    name: 'Ingreso general',
    process: 'onboarding',
    stages: [
      'Documentación',
      'Equipos y accesos',
      'Inducción',
      'Capacitación',
      'Seguimiento',
    ],
    durationDays: 30,
    summary: 'Acompañamiento para nuevas incorporaciones de todas las áreas.',
  },
  {
    id: 'template-onboarding-lead',
    name: 'Ingreso de jefatura',
    process: 'onboarding',
    stages: [
      'Documentación',
      'Equipos y accesos',
      'Inducción',
      'Capacitación',
      'Seguimiento',
    ],
    durationDays: 45,
    summary: 'Incluye reuniones de coordinación y revisión del primer mes.',
  },
];

export const offboardingTemplatesMock: WorkflowTemplate[] = [
  {
    id: 'template-offboarding-standard',
    name: 'Salida general',
    process: 'offboarding',
    stages: [
      'Formalización',
      'Devolución de equipos',
      'Accesos',
      'Traspaso',
      'Cierre administrativo',
    ],
    durationDays: 14,
    summary: 'Ordena las responsabilidades y los recursos de la salida.',
  },
];

export const peoplePoliciesMock: PeoplePolicy[] = [
  {
    id: 'policy-attendance',
    name: 'Jornada y marcación',
    category: 'Asistencia',
    scope: 'Todos los equipos',
    summary: 'Registra entrada y salida durante la jornada asignada.',
    reviewCycle: 'Revisión anual',
  },
  {
    id: 'policy-leave',
    name: 'Descansos y permisos',
    category: 'Tiempo libre',
    scope: 'Todos los equipos',
    summary:
      'Solicita tus fechas con anticipación y espera la respuesta de tu jefatura.',
    reviewCycle: 'Revisión anual',
  },
  {
    id: 'policy-information',
    name: 'Cuidado de la información',
    category: 'Seguridad de la información',
    scope: 'Todos los equipos',
    summary: 'Usa los canales aprobados para compartir información de trabajo.',
    reviewCycle: 'Revisión semestral',
  },
];
