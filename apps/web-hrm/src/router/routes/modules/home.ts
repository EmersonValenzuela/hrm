import type { RouteRecordRaw } from 'vue-router';

const moduleView = () => import('#/views/modules/index.vue');
const allRoles = ['colaborador', 'jefe', 'rrhh'];
const peopleRoles = ['jefe', 'rrhh'];
const hrRoles = ['rrhh'];

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: allRoles,
      icon: 'lucide:sun',
      title: 'Mi espacio',
    },
    name: 'PersonalArea',
    path: '/personal',
    redirect: '/mi-dia',
    children: [
      {
        name: 'MyDay',
        path: '/mi-dia',
        component: () => import('#/views/day/index.vue'),
        meta: {
          affixTab: true,
          authority: allRoles,
          icon: 'lucide:sun',
          keepAlive: true,
          title: 'Mi día',
        },
      },
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
        name: 'Leave',
        path: '/vacaciones',
        meta: {
          authority: allRoles,
          icon: 'lucide:calendar-days',
          title: 'Vacaciones y permisos',
        },
        children: [
          {
            name: 'LeaveHome',
            path: '',
            component: moduleView,
            meta: {
              authority: allRoles,
              keepAlive: true,
              title: 'Resumen',
            },
          },
          {
            name: 'LeaveRequest',
            path: 'solicitar',
            component: moduleView,
            meta: { authority: allRoles, title: 'Solicitar descanso' },
          },
          {
            name: 'LeaveCalendar',
            path: 'calendario',
            component: moduleView,
            meta: { authority: allRoles, title: 'Calendario de ausencias' },
          },
          {
            name: 'LeaveBalances',
            path: 'saldos',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Saldos' },
          },
          {
            name: 'LeaveTypes',
            path: 'tipos',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Tipos de permiso' },
          },
          {
            name: 'LeaveHolidays',
            path: 'feriados',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Feriados' },
          },
        ],
      },
    ],
  },
  {
    meta: {
      authority: allRoles,
      icon: 'lucide:users-round',
      title: 'Personas',
    },
    name: 'PeopleArea',
    path: '/personas',
    redirect: '/empleados',
    children: [
      {
        name: 'MyTeam',
        path: '/mi-equipo',
        component: () => import('#/views/day/index.vue'),
        meta: {
          authority: peopleRoles,
          icon: 'lucide:users-round',
          keepAlive: true,
          title: 'Mi equipo',
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
        name: 'Employees',
        path: '/empleados',
        meta: {
          authority: allRoles,
          icon: 'lucide:contact-round',
          title: 'Empleados',
        },
        children: [
          {
            name: 'EmployeeDirectory',
            path: '',
            component: () => import('#/views/employees/index.vue'),
            meta: {
              authority: allRoles,
              keepAlive: true,
              title: 'Directorio',
            },
          },
          {
            name: 'EmployeeNew',
            path: 'nuevo',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Alta de persona' },
          },
          {
            name: 'EmployeeGroups',
            path: 'grupos',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Equipos y áreas' },
          },
          {
            name: 'EmployeeOrgChart',
            path: 'organigrama',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Organigrama' },
          },
          {
            name: 'EmployeeShifts',
            path: 'horarios',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Horarios' },
          },
          {
            name: 'EmployeePolicies',
            path: 'politicas',
            component: moduleView,
            meta: { authority: hrRoles, title: 'Políticas internas' },
          },
        ],
      },
      {
        name: 'OnboardingPortal',
        path: '/onboarding/mi-ingreso',
        component: moduleView,
        meta: {
          authority: allRoles,
          hideInMenu: true,
          title: 'Mi ingreso',
        },
      },
    ],
  },
];

export default routes;
