import { defineOverridesPreferences } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    accessMode: 'frontend',
    defaultHomePath: '/mi-dia',
    dynamicTitle: true,
    enableCheckUpdates: false,
    enablePreferences: false,
    locale: 'es-PE',
    name: import.meta.env.VITE_APP_TITLE,
    timezone: 'America/Lima',
  },
  breadcrumb: {
    enable: true,
    hideOnlyOne: false,
    showHome: false,
    showIcon: true,
  },
  copyright: {
    enable: false,
    settingShow: false,
  },
  header: {
    enable: true,
    mode: 'fixed',
  },
  logo: {
    enable: true,
    source: '/favicon.svg',
    showText: true,
    logoMode: 'icon',
  },
  navigation: {
    accordion: true,
    styleType: 'rounded',
  },
  sidebar: {
    enable: true,
    hidden: false,
    width: 240,
  },
  tabbar: {
    enable: true,
    maxCount: 12,
    persist: true,
    showMaximize: true,
    showMore: true,
    showIcon: true,
    showRefresh: true,
    styleType: 'chrome',
    visitHistory: true,
  },
  theme: {
    colorPrimary: 'hsl(173 77% 26%)',
    mode: 'light',
    radius: '0.625',
  },
  widget: {
    fullscreen: true,
    fullscreenButtonPosition: 'header',
    globalSearch: true,
    globalSearchButtonPosition: 'header',
    languageToggle: false,
    lockScreen: false,
    logoutButtonPosition: 'none',
    notification: true,
    notificationButtonPosition: 'header',
    refresh: true,
    refreshButtonPosition: 'header',
    themeToggle: false,
    timezone: false,
  },
});
