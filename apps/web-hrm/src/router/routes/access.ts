import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules } from '@vben/utils';

const routeModules = import.meta.glob('./modules/**/*.ts', { eager: true });
const accessRoutes: RouteRecordRaw[] = mergeRouteModules(routeModules);

export { accessRoutes };
