import { createRouter, createWebHistory } from 'vue-router';

import { resetStaticRoutes } from '@vben/utils';

import { createRouterGuard } from './guard';
import { routes } from './routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE),
  routes,
  scrollBehavior: (_to, _from, savedPosition) =>
    savedPosition ?? { left: 0, top: 0 },
});

function resetRoutes() {
  resetStaticRoutes(router, routes);
}

createRouterGuard(router);

export { resetRoutes, router };
