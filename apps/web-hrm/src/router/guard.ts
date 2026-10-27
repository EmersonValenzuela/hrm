import type { Router } from 'vue-router';

import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { refreshAccess } from './role-access';

function setupAccessGuard(router: Router) {
  router.beforeEach(async (to) => {
    if (to.name === 'Root') {
      return true;
    }

    const accessStore = useAccessStore();
    const userStore = useUserStore();
    if (!accessStore.accessToken || !userStore.userInfo) {
      throw new Error('No se pudo iniciar el acceso local de la demostración.');
    }
    if (accessStore.isAccessChecked) {
      return true;
    }

    await refreshAccess(router, userStore.userInfo.roles ?? []);

    return {
      ...router.resolve(
        userStore.userInfo.homePath || preferences.app.defaultHomePath,
      ),
      replace: true,
    };
  });
}

function createRouterGuard(router: Router) {
  setupAccessGuard(router);
}

export { createRouterGuard, refreshAccess };
