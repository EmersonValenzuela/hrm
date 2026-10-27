<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Search, UsersRound } from '@lucide/vue';
import {
  ElButton,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElDatePicker,
} from 'element-plus';

import PageHeading from '#/components/shared/PageHeading.vue';
import FilterBar from '#/components/shared/FilterBar.vue';
import StatePanel from '#/components/shared/StatePanel.vue';
import StatusPill from '#/components/data/StatusPill.vue';

import type { Employee } from '#/services/employees.service';

import { employeesService } from '#/services/employees.service';

const employees = ref<Employee[]>([]);
const employeeGroups = ref<string[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const query = ref('');
const selectedGroup = ref('');
const startDateAfter = ref<string | null>(null);
const selectedEmployee = ref<Employee | null>(null);
const drawerOpen = ref(false);
const requestVersion = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const sortField = ref<SortableField | null>(null);
const sortOrder = ref<'ascending' | 'descending' | null>(null);

const sortableFields = [
  'name',
  'group',
  'email',
  'modality',
  'status',
] as const;
type SortableField = (typeof sortableFields)[number];

const resultLabel = computed(() =>
  employees.value.length === 1
    ? '1 persona en el directorio'
    : `${employees.value.length} personas en el directorio`,
);
const visibleEmployees = computed(() => {
  const rows = [...employees.value];
  if (sortField.value && sortOrder.value) {
    const field = sortField.value;
    const direction = sortOrder.value === 'ascending' ? 1 : -1;
    rows.sort((left, right) => {
      const leftValue = String(left[field]).toLocaleLowerCase('es-PE');
      const rightValue = String(right[field]).toLocaleLowerCase('es-PE');
      return leftValue.localeCompare(rightValue, 'es-PE') * direction;
    });
  }
  const start = (currentPage.value - 1) * pageSize.value;
  return rows.slice(start, start + pageSize.value);
});

async function loadEmployees() {
  const version = ++requestVersion.value;
  loading.value = true;
  errorMessage.value = '';
  try {
    const [result, groups] = await Promise.all([
      employeesService.list({
        group: selectedGroup.value || undefined,
        query: query.value || undefined,
        startDateAfter: startDateAfter.value || undefined,
      }),
      employeesService.groups(),
    ]);
    if (version === requestVersion.value) {
      employees.value = result;
      employeeGroups.value = groups;
    }
  } catch (error) {
    if (version === requestVersion.value) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'No pudimos cargar el directorio. Vuelve a intentarlo.';
    }
  } finally {
    if (version === requestVersion.value) {
      loading.value = false;
    }
  }
}

function openEmployee(employeeId: string) {
  const employee = employees.value.find((item) => item.id === employeeId);
  if (!employee) {
    errorMessage.value = 'No encontramos a esa persona en el directorio.';
    return;
  }
  selectedEmployee.value = employee;
  drawerOpen.value = true;
}

function onSortChange({
  prop,
  order,
}: {
  prop: string | null;
  order: 'ascending' | 'descending' | null;
}) {
  if (!prop || !isSortableField(prop)) {
    sortField.value = null;
    sortOrder.value = null;
    return;
  }
  sortField.value = prop;
  sortOrder.value = order;
  currentPage.value = 1;
}

function isSortableField(value: string): value is SortableField {
  return sortableFields.some((field) => field === value);
}

watch([query, selectedGroup, startDateAfter], () => {
  currentPage.value = 1;
  void loadEmployees();
});
onMounted(() => void loadEmployees());
</script>

<template>
  <section class="employees-page" aria-label="Empleados">
    <PageHeading
      eyebrow="Personas en Ayni"
      title="Empleados"
      description="Encuentra a alguien y conoce mejor a tu equipo."
    >
      <template #actions>
        <div class="employees-heading__symbol" aria-hidden="true">
          <UsersRound :size="22" />
        </div>
      </template>
    </PageHeading>

    <section class="directory-card" aria-label="Directorio de empleados">
      <ElForm class="directory-form" label-position="top">
        <FilterBar class="directory-toolbar">
          <ElFormItem label="Buscar personas" class="search-field">
            <ElInput
              v-model="query"
              clearable
              placeholder="Buscar por nombre, cargo o código"
              :prefix-icon="Search"
            />
          </ElFormItem>
          <ElFormItem label="Equipo" class="group-filter">
            <ElSelect
              v-model="selectedGroup"
              clearable
              placeholder="Todos los equipos"
            >
              <ElOption
                v-for="group in employeeGroups"
                :key="group"
                :label="group"
                :value="group"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="Ingreso desde" class="date-filter">
            <ElDatePicker
              v-model="startDateAfter"
              type="date"
              format="DD/MM/YYYY"
              value-format="YYYY-MM-DD"
              placeholder="Cualquier fecha"
              clearable
              aria-label="Filtrar por fecha de ingreso"
            />
          </ElFormItem>
          <span class="result-count" aria-live="polite">{{ resultLabel }}</span>
        </FilterBar>
      </ElForm>

      <StatePanel v-if="loading" loading aria-label="Cargando directorio" />
      <StatePanel
        v-else-if="errorMessage"
        title="No pudimos cargar el directorio"
        :error="errorMessage"
        @retry="loadEmployees"
      />
      <StatePanel
        v-else-if="employees.length === 0"
        description="No encontramos personas con esos filtros."
      />
      <ElTable
        v-else
        :data="visibleEmployees"
        row-key="id"
        class="employee-table"
        aria-label="Lista de empleados"
        @sort-change="onSortChange"
      >
        <ElTableColumn type="selection" width="48" reserve-selection />
        <ElTableColumn type="index" label="#" width="64" />
        <ElTableColumn
          label="Persona"
          prop="name"
          min-width="220"
          sortable="custom"
        >
          <template #default="{ row }">
            <button
              class="person-cell"
              type="button"
              @click="openEmployee(row.id)"
            >
              <span class="person-avatar" aria-hidden="true">{{
                row.initials
              }}</span>
              <span class="person-cell__copy">
                <strong>{{ row.name }}</strong>
                <small>{{ row.code }} · {{ row.title }}</small>
              </span>
            </button>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="group"
          label="Equipo"
          min-width="150"
          sortable="custom"
        />
        <ElTableColumn
          prop="email"
          label="Correo"
          min-width="190"
          sortable="custom"
        />
        <ElTableColumn
          label="Modalidad"
          prop="modality"
          min-width="110"
          sortable="custom"
        >
          <template #default="{ row }">
            <span>{{ row.modality }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          label="Estado"
          prop="status"
          min-width="110"
          sortable="custom"
        >
          <template #default="{ row }">
            <StatusPill
              :label="row.status"
              :tone="
                row.status === 'Activo'
                  ? 'success'
                  : row.status === 'En onboarding'
                    ? 'warning'
                    : 'info'
              "
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="" width="90" align="right">
          <template #default="{ row }">
            <ElButton text type="primary" @click="openEmployee(row.id)">
              Ver ficha
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-if="!loading && !errorMessage && employees.length"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        class="directory-pagination"
        :page-sizes="[10, 20, 30]"
        :total="employees.length"
        layout="total, sizes, prev, pager, next"
        aria-label="Paginación del directorio"
      />
    </section>

    <ElDrawer
      v-model="drawerOpen"
      :title="selectedEmployee?.name ?? 'Ficha rápida'"
      size="min(30rem, 92vw)"
      append-to-body
      destroy-on-close
    >
      <div v-if="selectedEmployee" class="employee-profile">
        <div class="profile-avatar" aria-hidden="true">
          {{ selectedEmployee.initials }}
        </div>
        <StatusPill
          :label="selectedEmployee.status"
          :tone="
            selectedEmployee.status === 'Activo'
              ? 'success'
              : selectedEmployee.status === 'En onboarding'
                ? 'warning'
                : 'info'
          "
        />
        <h3>{{ selectedEmployee.title }}</h3>
        <p>{{ selectedEmployee.group }} · {{ selectedEmployee.district }}</p>
        <dl>
          <div>
            <dt>Correo</dt>
            <dd>{{ selectedEmployee.email }}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>{{ selectedEmployee.phone }}</dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd>{{ selectedEmployee.dni }}</dd>
          </div>
          <div>
            <dt>Jefatura directa</dt>
            <dd>{{ selectedEmployee.manager }}</dd>
          </div>
          <div>
            <dt>Horario</dt>
            <dd>{{ selectedEmployee.shift }}</dd>
          </div>
          <div>
            <dt>Fecha de ingreso</dt>
            <dd>{{ selectedEmployee.startDate }}</dd>
          </div>
        </dl>
      </div>
    </ElDrawer>
  </section>
</template>

<style scoped>
.employees-page {
  display: grid;
  gap: var(--space-5);
}

.employees-heading__symbol {
  display: grid;
  width: var(--space-8);
  height: var(--space-8);
  place-items: center;
  border-radius: var(--radius-card);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.directory-card {
  min-width: 0;
  overflow: hidden;
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
}

.directory-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-bottom: var(--border-width) solid var(--color-line);
  padding: var(--space-4);
}

.directory-toolbar :deep(.el-form-item) {
  margin: 0;
}

.search-field {
  min-width: min(20rem, 100%);
  flex: 1;
}

.group-filter {
  width: min(18rem, 34%);
}

.group-filter :deep(.el-select) {
  width: 100%;
}

.date-filter :deep(.el-date-editor) {
  width: 100%;
}

.result-count {
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
  white-space: nowrap;
}

.employee-table {
  width: 100%;
}

.person-cell {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--space-3);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.person-cell__copy {
  display: grid;
  min-width: 0;
  gap: var(--space-1);
}

.person-cell__copy strong {
  font-size: var(--font-size-14);
  font-weight: 650;
}

.person-cell__copy small {
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-avatar,
.profile-avatar {
  display: grid;
  width: var(--space-7);
  height: var(--space-7);
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}

.employee-profile {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
}

.profile-avatar {
  width: var(--space-8);
  height: var(--space-8);
  font-size: var(--font-size-20);
}

.employee-profile h3,
.employee-profile p {
  margin: 0;
}

.employee-profile h3 {
  font-family: var(--font-display);
  font-size: var(--font-size-20);
}

.employee-profile p {
  color: var(--color-ink-muted);
}

.employee-profile dl {
  display: grid;
  width: 100%;
  gap: var(--space-3);
  margin: var(--space-2) 0 0;
}

.employee-profile dl div {
  border-top: var(--border-width) solid var(--color-line);
  padding-top: var(--space-3);
}

.employee-profile dt {
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
}

.employee-profile dd {
  margin: var(--space-1) 0 0;
  overflow-wrap: anywhere;
  font-weight: 550;
}

@media (max-width: 56rem) {
  .directory-toolbar {
    flex-wrap: wrap;
  }

  .group-filter {
    width: calc(50% - var(--space-2));
  }

  .result-count {
    margin-left: auto;
  }
}

@media (max-width: 40rem) {
  .search-field,
  .group-filter {
    width: 100%;
  }

  .directory-card {
    overflow-x: auto;
  }
}
</style>
