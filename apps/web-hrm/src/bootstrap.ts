import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { registerLoadingDirective } from '@vben/common-ui';
import { setSupportLanguages } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { initStores, useAccessStore, useUserStore } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/ele';

import { APP_NAME } from '#/config';
import { setupI18n } from '#/locales';
import {
  getDemoEmployee,
  getDemoHomePath,
  getDemoRole,
  readDemoState,
} from '#/services/api';

import { initComponentAdapter } from './adapter/component';
import { initSetupVbenForm } from './adapter/form';
import App from './app.vue';
import { router } from './router';

import '#/styles/tokens.css';

async function bootstrap(namespace: string) {
  await initComponentAdapter();
  await initSetupVbenForm();
  await import('./adapter/vxe-table');
  setSupportLanguages([{ label: 'Español (Perú)', value: 'es-PE' }]);
  const app = createApp(App);
  registerLoadingDirective(app, { loading: false, spinning: 'spinning' });

  await setupI18n(app);
  await initStores(app, { namespace });

  const role = getDemoRole();
  const demoEmployee = getDemoEmployee(await readDemoState(), role);
  const demoToken = 'ayni-frontend-demo';
  useAccessStore().setAccessToken(demoToken);
  useUserStore().setUserInfo({
    avatar: '',
    desc: 'Cuenta local para recorrer la demostración.',
    homePath: getDemoHomePath(role),
    realName: demoEmployee.name,
    roles: [role],
    token: demoToken,
    userId: demoEmployee.id,
    username: demoEmployee.email.split('@')[0] ?? demoEmployee.email,
  });

  registerAccessDirective(app);
  app.use(router);

  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      document.title = routeTitle
        ? `${String(routeTitle)} · ${APP_NAME}`
        : APP_NAME;
    }
  });

  app.mount('#app');
}

export { bootstrap };
