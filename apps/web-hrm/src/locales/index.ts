import type { Language } from 'element-plus/es/locale';
import type { App } from 'vue';

import type { LocaleSetupOptions, SupportedLanguagesType } from '@vben/locales';

import { ref } from 'vue';

import {
  $t,
  setupI18n as setupCoreI18n,
  loadLocalesMapFromDir,
} from '@vben/locales';
import { preferences } from '@vben/preferences';

import dayjs from 'dayjs';
import spanishLocale from 'element-plus/es/locale/lang/es';

const elementLocale = ref<Language>(spanishLocale);
const modules = import.meta.glob('./langs/**/*.json');
const localesMap = loadLocalesMapFromDir(
  /\.\/langs\/([^/]+)\/(.*)\.json$/,
  modules,
);

async function loadMessages(lang: SupportedLanguagesType) {
  const messages = await localesMap[lang]?.();
  return messages?.default;
}

async function setupI18n(app: App, options: LocaleSetupOptions = {}) {
  await import('dayjs/locale/es');
  dayjs.locale('es');
  await setupCoreI18n(app, {
    defaultLocale: preferences.app.locale,
    loadMessages,
    missingWarn: !import.meta.env.PROD,
    ...options,
  });
}

export { $t, elementLocale, setupI18n };
