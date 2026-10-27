import type { RouteRecordRaw } from 'vue-router';

const moduleView = () => import('#/views/modules/index.vue');
const allRoles = ['colaborador', 'jefe', 'rrhh'];
const peopleRoles = ['jefe', 'rrhh'];
const hrRoles = ['rrhh'];
type HiddenRoute = [name: string, path: string, title: string];

function hiddenRoutes(
  definitions: HiddenRoute[],
  authority: string[],
): RouteRecordRaw[] {
  return definitions.map(([name, path, title]) => ({
    name,
    path,
    component: moduleView,
    meta: { authority, hideInMenu: true, title },
  }));
}

const routes: RouteRecordRaw[] = [
  {
    name: 'MyRequests',
    path: '/mis-solicitudes',
    component: moduleView,
    meta: {
      authority: allRoles,
      icon: 'lucide:inbox',
      keepAlive: true,
      title: 'Mis solicitudes',
    },
  },
  {
    name: 'Approvals',
    path: '/aprobaciones',
    component: moduleView,
    meta: {
      authority: peopleRoles,
      icon: 'lucide:clipboard-check',
      keepAlive: true,
      title: 'Aprobaciones',
    },
  },
  {
    name: 'Attendance',
    path: '/asistencia',
    component: moduleView,
    meta: {
      authority: peopleRoles,
      icon: 'lucide:timer',
      keepAlive: true,
      title: 'Asistencia',
    },
  },
  ...hiddenRoutes(
    [
      ['AttendanceRecords', '/asistencia/registros', 'Registros de asistencia'],
      ['AttendanceCorrections', '/asistencia/correcciones', 'Correcciones'],
      ['AttendanceMonthly', '/asistencia/mensual', 'Resumen mensual'],
      ['AttendanceDailyStatus', '/asistencia/estado-diario', 'Estado diario'],
    ],
    peopleRoles,
  ),
  {
    name: 'Leave',
    path: '/vacaciones',
    component: moduleView,
    meta: {
      authority: allRoles,
      icon: 'lucide:calendar-days',
      keepAlive: true,
      title: 'Vacaciones y permisos',
    },
  },
  ...hiddenRoutes(
    [
      ['LeaveRequest', '/vacaciones/solicitar', 'Solicitar descanso'],
      ['LeaveCalendar', '/vacaciones/calendario', 'Calendario de ausencias'],
    ],
    allRoles,
  ),
  ...hiddenRoutes(
    [
      ['LeaveBalances', '/vacaciones/saldos', 'Saldos'],
      ['LeaveTypes', '/vacaciones/tipos', 'Tipos de permiso'],
      ['LeaveHolidays', '/vacaciones/feriados', 'Feriados'],
    ],
    hrRoles,
  ),
  {
    name: 'Onboarding',
    path: '/onboarding',
    component: moduleView,
    meta: {
      authority: peopleRoles,
      icon: 'lucide:user-round-plus',
      keepAlive: true,
      title: 'Onboarding',
    },
  },
  ...hiddenRoutes(
    [
      ['OnboardingProcesses', '/onboarding/procesos', 'Procesos de ingreso'],
      ['OnboardingNew', '/onboarding/nuevo', 'Iniciar onboarding'],
      [
        'OnboardingTemplates',
        '/onboarding/plantillas',
        'Plantillas de ingreso',
      ],
    ],
    peopleRoles,
  ),
  ...hiddenRoutes(
    [['OnboardingPortal', '/onboarding/mi-ingreso', 'Mi ingreso']],
    allRoles,
  ),
  {
    name: 'Offboarding',
    path: '/offboarding',
    component: moduleView,
    meta: {
      authority: hrRoles,
      icon: 'lucide:user-round-minus',
      keepAlive: true,
      title: 'Offboarding',
    },
  },
  ...hiddenRoutes(
    [
      ['OffboardingProcesses', '/offboarding/procesos', 'Procesos de salida'],
      ['OffboardingNew', '/offboarding/nuevo', 'Iniciar offboarding'],
      [
        'OffboardingInterviews',
        '/offboarding/entrevistas',
        'Entrevistas de salida',
      ],
      [
        'OffboardingTemplates',
        '/offboarding/plantillas',
        'Plantillas de salida',
      ],
    ],
    hrRoles,
  ),
  ...hiddenRoutes(
    [
      ['EmployeeNew', '/empleados/nuevo', 'Alta de persona'],
      ['EmployeeGroups', '/empleados/grupos', 'Equipos y áreas'],
      ['EmployeeOrgChart', '/empleados/organigrama', 'Organigrama'],
      ['EmployeeShifts', '/empleados/horarios', 'Horarios'],
      ['EmployeePolicies', '/empleados/politicas', 'Políticas internas'],
    ],
    hrRoles,
  ),
];

export default routes;
