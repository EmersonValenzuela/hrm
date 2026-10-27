import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'MyDay',
    path: '/mi-dia',
    component: () => import('#/views/day/index.vue'),
    meta: {
      affixTab: true,
      authority: ['colaborador', 'jefe', 'rrhh'],
      icon: 'lucide:sun',
      keepAlive: true,
      title: 'Mi día',
    },
  },
  {
    name: 'MyTeam',
    path: '/mi-equipo',
    component: () => import('#/views/day/index.vue'),
    meta: {
      authority: ['jefe', 'rrhh'],
      icon: 'lucide:users-round',
      keepAlive: true,
      title: 'Mi equipo',
    },
  },
  {
    name: 'PeopleHome',
    path: '/inicio-rrhh',
    component: () => import('#/views/day/index.vue'),
    meta: {
      authority: ['rrhh'],
      icon: 'lucide:layout-dashboard',
      keepAlive: true,
      title: 'Personas',
    },
  },
  {
    name: 'Employees',
    path: '/empleados',
    component: () => import('#/views/employees/index.vue'),
    meta: {
      authority: ['colaborador', 'jefe', 'rrhh'],
      icon: 'lucide:contact-round',
      keepAlive: true,
      title: 'Empleados',
    },
  },
];

export default routes;
