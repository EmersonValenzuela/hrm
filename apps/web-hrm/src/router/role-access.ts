import type { Router } from 'vue-router';

import { useAccessStore } from '@vben/stores';

import { accessRoutes } from '#/router/routes/access';

import { generateAccess } from './access';

async function refreshAccess(router: Router, roles: string[]) {
  const { accessibleMenus, accessibleRoutes } = await generateAccess({
    roles,
    router,
    routes: accessRoutes,
  });
  const accessStore = useAccessStore();
  accessStore.setAccessMenus(accessibleMenus);
  accessStore.setAccessRoutes(accessibleRoutes);
  accessStore.setIsAccessChecked(true);
}

export { refreshAccess };
