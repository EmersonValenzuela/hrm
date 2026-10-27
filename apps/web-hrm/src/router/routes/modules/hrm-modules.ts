import type { RouteRecordRaw } from 'vue-router';

const moduleView = () => import('#/views/modules/index.vue');
const peopleRoles = ['jefe', 'rrhh'];
const hrRoles = ['rrhh'];

const routes: RouteRecordRaw[] = [
  {
    name: 'Administration',
    path: '/administracion',
    redirect: '/inicio-rrhh',
    meta: {
      authority: peopleRoles,
      icon: 'lucide:briefcase-business',
      title: 'Administración',
    },
    children: [
      {
        name: 'PeopleHome',
        path: '/inicio-rrhh',
        component: () => import('#/views/admin/index.vue'),
        meta: {
          affixTab: true,
          authority: hrRoles,
          icon: 'lucide:layout-dashboard',
          keepAlive: true,
          title: 'Panel de gestión',
        },
      },
      {
        name: 'Attendance',
        path: '/asistencia',
        meta: {
          authority: peopleRoles,
          icon: 'lucide:timer',
          title: 'Asistencia',
        },
        children: [
          {
            name: 'AttendanceHome',
            path: '',
            component: moduleView,
            meta: {
              authority: peopleRoles,
              keepAlive: true,
              title: 'Resumen diario',
            },
          },
          {
            name: 'AttendanceRecords',
            path: 'registros',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Registros' },
          },
          {
            name: 'AttendanceCorrections',
            path: 'correcciones',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Correcciones' },
          },
          {
            name: 'AttendanceMonthly',
            path: 'mensual',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Resumen mensual' },
          },
          {
            name: 'AttendanceDailyStatus',
            path: 'estado-diario',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Estado diario' },
          },
        ],
      },
      {
        name: 'Onboarding',
        path: '/onboarding',
        meta: {
          authority: peopleRoles,
          icon: 'lucide:user-round-plus',
          title: 'Onboarding',
        },
        children: [
          {
            name: 'OnboardingHome',
            path: '',
            component: moduleView,
            meta: {
              authority: peopleRoles,
              keepAlive: true,
              title: 'Resumen de ingresos',
            },
          },
          {
            name: 'OnboardingProcesses',
            path: 'procesos',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Procesos de ingreso' },
          },
          {
            name: 'OnboardingNew',
            path: 'nuevo',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Iniciar onboarding' },
          },
          {
            name: 'OnboardingTemplates',
            path: 'plantillas',
            component: moduleView,
            meta: { authority: peopleRoles, title: 'Plantillas de ingreso' },
          },
        ],
      },
      {
        name: 'Offboarding',
        path: '/offboarding',
        meta: {
          authority: hrRoles,
          icon: 'lucide:user-round-minus',
          title: 'Offboarding',
        },
        children: [
          {
            name: 'OffboardingHome',
            path: '',
            component: moduleView,
            meta: {
              authority: hrRoles,
              keepAlive: true,
              title: 'Resumen de salidas',
            },
          },
          {
            name: 'OffboardingProcesses',
            path: 'procesos',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Procesos de salida' },
          },
          {
            name: 'OffboardingNew',
            path: 'nuevo',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Iniciar offboarding' },
          },
          {
            name: 'OffboardingInterviews',
            path: 'entrevistas',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Entrevistas de salida' },
          },
          {
            name: 'OffboardingTemplates',
            path: 'plantillas',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Plantillas de salida' },
          },
        ],
      },
      {
        name: 'AdministrationSettings',
        path: '/configuracion',
        component: moduleView,
        meta: {
          authority: hrRoles,
          icon: 'lucide:settings-2',
          title: 'Configuración',
        },
      },
    ],
  },
  {
    name: 'LeaveManagement',
    path: '/vacaciones/administracion',
    component: moduleView,
    meta: {
      authority: hrRoles,
      hideInMenu: true,
      title: 'Administrar descansos',
    },
  },
];

export default routes;
