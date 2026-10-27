import type { FormValues } from '@vben/common-ui';
import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { ComponentPropsMap, ComponentType } from './component';

import { h, watch } from 'vue';

import {
  setupVbenVxeTable,
  useVbenVxeGrid as useGrid,
} from '@vben/plugins/vxe-table';
import { usePreferences } from '@vben/preferences';

import { ElButton, ElImage } from 'element-plus';
import spanishLocale from 'vxe-pc-ui/lib/language/es-ES';

import { useVbenForm } from './form';

const spanishMessages =
  'default' in spanishLocale ? spanishLocale.default : spanishLocale;
const peruLocale = {
  ...spanishMessages,
  vxe: {
    ...spanishMessages.vxe,
    base: {
      ...spanishMessages.vxe.base,
      pleaseInput: 'Ingresa un valor',
      pleaseSelect: 'Selecciona una opción',
    },
    pager: {
      ...spanishMessages.vxe.pager,
      pagesize: '{0} por página',
      total: 'Total: {0}',
    },
    table: {
      ...spanishMessages.vxe.table,
      actionTitle: 'Acciones',
      resetFilter: 'Restablecer',
    },
  },
};
const peruLocaleName = 'es-PE';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    const { isDark, locale } = usePreferences();
    const vxeLocaleName = peruLocaleName as Parameters<
      typeof vxeUI.setLanguage
    >[0];
    watch(
      [() => isDark.value, () => locale.value],
      ([, currentLocale]) => {
        if (currentLocale === 'es-PE') {
          vxeUI.setI18n(vxeLocaleName, peruLocale);
          vxeUI.setLanguage(vxeLocaleName);
        }
      },
      { immediate: true },
    );
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const src = row[column.field];
        return h(ElImage, { src, previewSrcList: [src], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          ElButton,
          { size: 'small', link: true },
          { default: () => props?.text },
        );
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export const useVbenVxeGrid = <
  T extends Record<string, any>,
  TFormValues extends FormValues = FormValues,
  TSubmitValues extends FormValues = TFormValues,
>(
  ...rest: Parameters<
    typeof useGrid<
      T,
      ComponentType,
      ComponentPropsMap,
      TFormValues,
      TSubmitValues
    >
  >
) =>
  useGrid<T, ComponentType, ComponentPropsMap, TFormValues, TSubmitValues>(
    ...rest,
  );

export type * from '@vben/plugins/vxe-table';
