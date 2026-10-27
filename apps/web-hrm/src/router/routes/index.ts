import { traverseTreeValues } from '@vben/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';
import { accessRoutes } from './access';

const routes = [...coreRoutes, fallbackNotFoundRoute];
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

export { accessRoutes, coreRouteNames, routes };
