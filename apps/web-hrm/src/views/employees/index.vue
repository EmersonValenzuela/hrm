<script lang="ts" setup>
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { Employee } from '#/services/employees.service';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Search, UsersRound } from '@lucide/vue';
import {
  ElButton,
  ElDatePicker,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import DataTable from '#/components/data/DataTable.vue';
import StatusPill from '#/components/data/StatusPill.vue';
import FilterBar from '#/components/shared/FilterBar.vue';
import PageHeading from '#/components/shared/PageHeading.vue';
import StatePanel from '#/components/shared/StatePanel.vue';
import { employeesService } from '#/services/employees.service';

const employees = ref<Employee[]>([]);
const router = useRouter();
const employeeGroups = ref<string[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const query = ref('');
const selectedGroup = ref('');
const startDateAfter = ref<null | string>(null);
const selectedEmployee = ref<Employee | null>(null);
const drawerOpen = ref(false);
const requestVersion = ref(0);

const resultLabel = computed(() =>
  employees.value.length === 1
    ? '1 persona en el directorio'
    : `${employees.value.length} personas en el directorio`,
);
const gridRows = computed(() =>
  employees.value.map((employee) => ({
    id: employee.id,
    code: employee.code,
    name: employee.name,
    initials: employee.initials,
    title: employee.title,
    group: employee.group,
    email: employee.email,
    modality: employee.modality,
    status: employee.status,
  })),
);
const gridColumns: VxeTableGridColumns = [
  { field: 'code', title: 'Código', width: 120, sortable: true },
  { field: 'name', title: 'Persona', minWidth: 180, sortable: true },
  { field: 'title', title: 'Cargo', minWidth: 180, sortable: true },
  { field: 'group', title: 'Equipo', minWidth: 160, sortable: true },
  { field: 'email', title: 'Correo', minWidth: 220, sortable: true },
  { field: 'modality', title: 'Modalidad', width: 120, sortable: true },
  { field: 'status', title: 'Estado', width: 140, sortable: true },
  {
    field: 'operation',
    fixed: 'right',
    slots: { default: 'action' },
    title: 'Acciones',
    width: 110,
  },
];

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

watch([query, selectedGroup, startDateAfter], () => {
  void loadEmployees();
});
onMounted(() => void loadEmployees());
</script>

<template>
  <Page auto-content-height class="employees-page" aria-label="Empleados">
    <PageHeading
      eyebrow="Personas en Ayni"
      title="Empleados"
      description="Encuentra a alguien y conoce mejor a tu equipo."
    >
      <template #actions>
        <div class="employees-heading__symbol" aria-hidden="true">
          <UsersRound :size="22" />
        </div>
        <ElButton type="primary" @click="router.push('/empleados/nuevo')">
          Agregar persona
        </ElButton>
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
      <DataTable
        v-if="!loading && !errorMessage && employees.length"
        :rows="gridRows"
        :columns="gridColumns"
        title="Personas en el directorio"
      >
        <template #action="{ row }">
          <ElButton text type="primary" @click="openEmployee(String(row.id))">
            Ver ficha
          </ElButton>
        </template>
      </DataTable>
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
  </Page>
</template>

<style scoped>
.employees-page {
  display: grid;
  gap: var(--space-5);
  min-width: 0;
  padding: var(--space-4);
}

.employees-heading__symbol {
  display: grid;
  place-items: center;
  width: var(--space-8);
  height: var(--space-8);
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-card);
}

.directory-card {
  min-width: 0;
  overflow: hidden;
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.directory-toolbar {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-bottom: var(--border-width) solid var(--color-line);
}

.directory-toolbar :deep(.el-form-item) {
  margin: 0;
}

.search-field {
  flex: 1;
  min-width: min(20rem, 100%);
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
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.person-avatar,
.profile-avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: var(--space-7);
  height: var(--space-7);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-pill);
}

.employee-profile {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
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
  gap: var(--space-3);
  width: 100%;
  margin: var(--space-2) 0 0;
}

.employee-profile dl div {
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
}

.employee-profile dt {
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.employee-profile dd {
  margin: var(--space-1) 0 0;
  font-weight: 550;
  overflow-wrap: anywhere;
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
