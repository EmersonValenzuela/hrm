import { initPreferences } from '@vben/preferences';

import { overridesPreferences } from './preferences';

async function initApplication() {
  const environment = import.meta.env.PROD ? 'prod' : 'dev';
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${environment}`;

  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);
}

void initApplication();
