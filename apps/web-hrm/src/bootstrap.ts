import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { setSupportLanguages } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { initStores, useAccessStore, useUserStore } from '@vben/stores';
import '@vben/styles';
import '@vben/styles/ele';
import '#/styles/tokens.css';

import { APP_NAME } from '#/config';
import { getDemoRole } from '#/services/api';
import { setupI18n } from '#/locales';

import App from './app.vue';
import { router } from './router';

async function bootstrap(namespace: string) {
  setSupportLanguages([{ label: 'Español (Perú)', value: 'es-PE' }]);
  const app = createApp(App);

  await setupI18n(app);
  await initStores(app, { namespace });

  const role = getDemoRole();
  const demoToken = 'ayni-frontend-demo';
  useAccessStore().setAccessToken(demoToken);
  useUserStore().setUserInfo({
    avatar: '',
    desc: 'Cuenta local para recorrer la demostración.',
    homePath: '/mi-dia',
    realName: 'Valeria Rojas',
    roles: [role],
    token: demoToken,
    userId: 'emp-0001',
    username: 'valeria.rojas',
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
