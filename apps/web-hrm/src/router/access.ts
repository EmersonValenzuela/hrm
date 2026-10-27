import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

const BasicLayout = () => import('#/layouts/basic.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  return generateAccessible(preferences.app.accessMode, {
    ...options,
    layoutMap: { BasicLayout },
    pageMap,
  });
}

export { generateAccess };
