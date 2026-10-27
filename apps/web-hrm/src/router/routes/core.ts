import type { RouteRecordRaw } from 'vue-router';

const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: 'No encontramos esta página',
  },
  name: 'FallbackNotFound',
  path: '/:pathMatch(.*)*',
};

const coreRoutes: RouteRecordRaw[] = [
  {
    component: () => import('#/layouts/basic.vue'),
    meta: {
      hideInBreadcrumb: true,
      title: 'Ayni',
    },
    name: 'Root',
    path: '/',
    redirect: '/mi-dia',
    children: [],
  },
];

export { coreRoutes, fallbackNotFoundRoute };
