<script lang="ts" setup>
import type {
  VxeGridListeners,
  VxeTableGridOptions,
} from '@vben/plugins/vxe-table';

import { ref, watch } from 'vue';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

type GridValue = boolean | null | number | string;
type GridRow = Record<string, GridValue>;

const props = withDefaults(
  defineProps<{
    columns: VxeTableGridOptions<GridRow>['columns'];
    rows: GridRow[];
    selectable?: boolean;
    title: string;
    rowKey?: string;
  }>(),
  { rowKey: 'id', selectable: false },
);

const emit = defineEmits<{
  selectionChange: [rows: GridRow[]];
}>();
const compact = ref(false);

type GridColumns = NonNullable<VxeTableGridOptions<GridRow>['columns']>;
const selectionColumn: GridColumns[number] = { type: 'checkbox', width: 44 };

const columns = (): GridColumns => {
  const configured = Array.isArray(props.columns) ? props.columns : [];
  return props.selectable ? [selectionColumn, ...configured] : configured;
};

const handleSelectionChange: NonNullable<
  VxeGridListeners<GridRow>['checkboxAll']
> = ({ records }) => emit('selectionChange', records);

const [Grid, gridApi] = useVbenVxeGrid<GridRow>({
  formOptions: {
    resetButtonOptions: { content: 'Limpiar' },
    schema: [
      {
        component: 'Input',
        componentProps: {
          clearable: true,
          placeholder: 'Buscar en los resultados',
        },
        fieldName: 'keyword',
        label: 'Buscar',
      },
    ],
    showCollapseButton: false,
    submitOnChange: true,
  },
  gridEvents: {
    checkboxAll: handleSelectionChange,
    checkboxChange: handleSelectionChange,
  },
  gridOptions: {
    columns: columns(),
    height: 'auto',
    keepSource: true,
    minHeight: 240,
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const keyword =
            typeof formValues?.keyword === 'string'
              ? formValues.keyword.trim().toLocaleLowerCase('es-PE')
              : '';
          const filteredRows = keyword
            ? props.rows.filter((row) =>
                Object.values(row).some((value) =>
                  String(value ?? '')
                    .toLocaleLowerCase('es-PE')
                    .includes(keyword),
                ),
              )
            : props.rows;
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            items: filteredRows.slice(start, start + page.pageSize),
            total: filteredRows.length,
          };
        },
      },
    },
    rowConfig: { keyField: props.rowKey, isHover: true },
    columnConfig: { resizable: true },
    checkboxConfig: { highlight: true, reserve: true },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: false,
    },
    showOverflow: true,
    size: 'small',
  } as VxeTableGridOptions<GridRow>,
});

watch(
  () => props.rows,
  () => gridApi.query(),
  { deep: true },
);

watch(
  () => props.columns,
  () => gridApi.setGridOptions({ columns: columns() }),
  { deep: true },
);

watch(
  () => props.selectable,
  () => gridApi.setGridOptions({ columns: columns() }),
);

defineExpose({
  clearSelection: () => gridApi.grid.clearCheckboxRow(),
  gridApi,
});

function toggleDensity() {
  compact.value = !compact.value;
  gridApi.setGridOptions({ size: compact.value ? 'mini' : 'small' });
}
</script>

<template>
  <Grid :table-title="title">
    <template #toolbar-actions="slotProps">
      <slot name="toolbar-actions" v-bind="slotProps"></slot>
    </template>
    <template #toolbar-tools>
      <ElButton text @click="toggleDensity">
        {{ compact ? 'Densidad cómoda' : 'Vista compacta' }}
      </ElButton>
      <slot name="toolbar-tools"></slot>
    </template>
    <template #action="slotProps">
      <slot name="action" v-bind="slotProps"></slot>
    </template>
  </Grid>
</template>
