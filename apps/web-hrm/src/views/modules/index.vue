<script lang="ts" setup>
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type {
  AttendanceRecord,
  DemoRequest,
  DemoTask,
  Employee,
  OffboardingProcess,
  OnboardingProcess,
  PeoplePolicy,
  ProcessTask,
  RequestType,
  WorkflowTemplate,
} from '#/services/domain';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import {
  ElButton,
  ElCalendar,
  ElCheckbox,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import DataTable from '#/components/data/DataTable.vue';
import KpiCard from '#/components/data/KpiCard.vue';
import PageHeading from '#/components/shared/PageHeading.vue';
import StatePanel from '#/components/shared/StatePanel.vue';
import { getDemoEmployee, getDemoRole, readDemoState } from '#/services/api';
import { attendanceService } from '#/services/attendance.service';
import { dayService } from '#/services/day.service';
import { employeesService } from '#/services/employees.service';
import { leaveService } from '#/services/leave.service';
import { offboardingService } from '#/services/offboarding.service';
import { onboardingService } from '#/services/onboarding.service';
import { requestsService } from '#/services/requests.service';
import { workflowCatalogService } from '#/services/workflow-catalog.service';

type GridValue = boolean | null | number | string;
type GridRow = Record<string, GridValue>;
type ProcessRecord = OffboardingProcess | OnboardingProcess;

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const errorMessage = ref('');
const busy = ref(false);
const employees = ref<Employee[]>([]);
const requests = ref<DemoRequest[]>([]);
const attendance = ref<AttendanceRecord[]>([]);
const onboarding = ref<OnboardingProcess[]>([]);
const offboarding = ref<OffboardingProcess[]>([]);
const exitInterviews = ref<
  Awaited<ReturnType<typeof offboardingService.listInterviews>>
>([]);
const onboardingTemplates = ref<WorkflowTemplate[]>([]);
const offboardingTemplates = ref<WorkflowTemplate[]>([]);
const peoplePolicies = ref<PeoplePolicy[]>([]);
const groups = ref<string[]>([]);
const balances = ref<Awaited<ReturnType<typeof leaveService.listBalances>>>([]);
const leaveTypes = ref<Awaited<ReturnType<typeof leaveService.listTypes>>>([]);
const holidays = ref<Awaited<ReturnType<typeof leaveService.listHolidays>>>([]);
const demoTasks = ref<DemoTask[]>([]);
const selectedRows = ref<GridRow[]>([]);
const taskDialogOpen = ref(false);
const groupDialogOpen = ref(false);
const groupDraftName = ref('');
const groupEditingName = ref('');
const catalogDialogOpen = ref(false);
const catalogEditingId = ref('');
const catalogName = ref('');
const catalogDate = ref(dayjs().format('YYYY-MM-DD'));
const catalogAnnualDays = ref(30);
const catalogPaid = ref(true);
const catalogAnnualReset = ref(true);
const catalogRegion = ref('Nacional');
const activeProcessId = ref('');
const activeTaskProcess = ref<'offboarding' | 'onboarding'>('onboarding');
const employeeStep = ref(0);
const employeeDraft = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dni: '',
  group: '',
  title: '',
  manager: '',
  shift: '09:00 a 18:00',
  modality: 'Híbrido',
  startDate: dayjs().format('YYYY-MM-DD'),
  birthday: '',
  district: 'Miraflores',
  bankAccount: '',
});
const leaveDates = ref<string[]>([]);
const leaveReason = ref('');
const calendarDate = ref(new Date());
const processDraft = reactive({
  employeeId: String(route.query.employeeId ?? ''),
  reason: 'Renuncia voluntaria',
  exitDate: dayjs().add(14, 'day').format('YYYY-MM-DD'),
});
const interviewDraft = reactive<{
  employeeId: string;
  reason: string;
  satisfaction: number;
  comments: string;
  recommend: 'No' | 'Sí';
}>({
  employeeId: '',
  reason: '',
  satisfaction: 4,
  comments: '',
  recommend: 'Sí',
});
const portalDraft = reactive({
  bankAccount: '',
  birthday: '',
  district: '',
  phone: '',
});

const pagePath = computed(() => route.path);
const title = computed(() => String(route.meta.title ?? 'Personas'));
const isRequests = computed(
  () =>
    pagePath.value === '/mis-solicitudes' || pagePath.value === '/aprobaciones',
);
const isApprovals = computed(() => pagePath.value === '/aprobaciones');
const isAttendance = computed(() => pagePath.value.startsWith('/asistencia'));
const isLeave = computed(() => pagePath.value.startsWith('/vacaciones'));
const isOnboarding = computed(() => pagePath.value.startsWith('/onboarding'));
const isOffboarding = computed(() => pagePath.value.startsWith('/offboarding'));
const isEmployees = computed(() => pagePath.value.startsWith('/empleados/'));
const isNewEmployee = computed(() => pagePath.value === '/empleados/nuevo');
const isLeaveRequest = computed(
  () => pagePath.value === '/vacaciones/solicitar',
);
const isNewOnboarding = computed(() => pagePath.value === '/onboarding/nuevo');
const isNewOffboarding = computed(
  () => pagePath.value === '/offboarding/nuevo',
);
const isInterview = computed(
  () => pagePath.value === '/offboarding/entrevistas',
);
const isPortal = computed(() => pagePath.value === '/onboarding/mi-ingreso');
const isTemplatePage = computed(
  () =>
    pagePath.value === '/onboarding/plantillas' ||
    pagePath.value === '/offboarding/plantillas',
);
const userCanManageLeave = computed(() => getDemoRole() === 'rrhh');
const currentEmployeeId = ref('');
const currentEmployee = computed(
  () =>
    employees.value.find(
      (employee) => employee.id === currentEmployeeId.value,
    ) ?? null,
);
const portalTask = computed(
  () =>
    demoTasks.value
      .toReversed()
      .find(
        (task) =>
          task.role === 'colaborador' &&
          task.employeeId === currentEmployeeId.value &&
          !task.done,
      ) ?? null,
);
const portalEmployee = computed(
  () =>
    employees.value.find(
      (employee) => employee.id === currentEmployeeId.value,
    ) ?? currentEmployee.value,
);
const currentBalance = computed(
  () =>
    balances.value.find(
      (balance) =>
        balance.employeeId === currentEmployeeId.value &&
        balance.leaveType === 'Vacaciones anuales',
    ) ?? null,
);
const availableDays = computed(
  () =>
    (currentBalance.value?.entitledDays ?? 0) -
    (currentBalance.value?.usedDays ?? 0) -
    (currentBalance.value?.pendingDays ?? 0),
);
watch(
  portalEmployee,
  (employee) => {
    if (!employee) return;
    portalDraft.bankAccount = employee.bankAccount;
    portalDraft.birthday = employee.birthday;
    portalDraft.district = employee.district;
    portalDraft.phone = employee.phone;
  },
  { immediate: true },
);
const requestedDays = computed(() => {
  const [start, end] = leaveDates.value;
  if (!start || !end) return 0;
  let count = 0;
  let cursor = dayjs(start);
  while (!cursor.isAfter(dayjs(end), 'day')) {
    const date = cursor.format('YYYY-MM-DD');
    if (
      cursor.day() !== 0 &&
      cursor.day() !== 6 &&
      !holidays.value.some((holiday) => holiday.date === date)
    )
      count += 1;
    cursor = cursor.add(1, 'day');
  }
  return count;
});
const affectedColleagues = computed(() => {
  const [start, end] = leaveDates.value;
  if (!start || !end || !currentEmployee.value) return [];
  return requests.value
    .filter(
      (request) =>
        request.type === 'Vacaciones' &&
        request.status === 'Aprobado' &&
        request.employeeId !== currentEmployee.value?.id &&
        request.startDate &&
        request.endDate &&
        request.startDate <= end &&
        request.endDate >= start,
    )
    .map((request) =>
      employees.value.find((employee) => employee.id === request.employeeId),
    )
    .filter((employee): employee is Employee => Boolean(employee))
    .filter((employee) => employee.group === currentEmployee.value?.group);
});
const activeProcess = computed<null | ProcessRecord>(() =>
  activeTaskProcess.value === 'onboarding'
    ? (onboarding.value.find(
        (process) => process.id === activeProcessId.value,
      ) ?? null)
    : (offboarding.value.find(
        (process) => process.id === activeProcessId.value,
      ) ?? null),
);
const processTasks = computed<ProcessTask[]>(
  () => activeProcess.value?.tasks ?? [],
);
const onboardingRows = computed(() =>
  onboarding.value.map((process) => {
    const employee = employees.value.find(
      (item) => item.id === process.employeeId,
    );
    const done = process.tasks.filter(
      (task) => task.status === 'Completada',
    ).length;
    return {
      id: process.id,
      employee: employee?.name ?? 'Persona no disponible',
      title: employee?.title ?? '',
      startDate: process.startedAt,
      dueDate: process.expectedEndDate,
      progress: Math.round((done / process.tasks.length) * 100),
      status: process.status,
    };
  }),
);
const offboardingRows = computed(() =>
  offboarding.value.map((process) => {
    const employee = employees.value.find(
      (item) => item.id === process.employeeId,
    );
    const done = process.tasks.filter(
      (task) => task.status === 'Completada',
    ).length;
    return {
      id: process.id,
      employee: employee?.name ?? 'Persona no disponible',
      title: employee?.title ?? '',
      reason: process.reason,
      exitDate: process.exitDate,
      progress: Math.round((done / process.tasks.length) * 100),
      status: process.status,
    };
  }),
);
const interviewRows = computed(() =>
  exitInterviews.value.map((interview) => ({
    id: interview.id,
    employee:
      employees.value.find((employee) => employee.id === interview.employeeId)
        ?.name ?? 'Persona no disponible',
    date: interview.date,
    reason: interview.reason,
    satisfaction: `${interview.satisfaction} de 5`,
    recommend: interview.recommend,
    comments: interview.comments,
  })),
);
const filteredRequests = computed(() =>
  requests.value
    .filter((request) =>
      isApprovals.value
        ? request.status === 'Solicitado'
        : request.employeeId === currentEmployeeId.value,
    )
    .map((request) => ({
      ...request,
      employee:
        employees.value.find((employee) => employee.id === request.employeeId)
          ?.name ?? 'Persona no disponible',
    })),
);
const attendanceRows = computed<GridRow[]>(() => {
  if (pagePath.value === '/asistencia/correcciones') {
    return requests.value
      .filter((request) => request.type === 'Corrección de asistencia')
      .map((request) => ({
        id: request.id,
        employee:
          employees.value.find((employee) => employee.id === request.employeeId)
            ?.name ?? 'Persona no disponible',
        date: request.createdAt,
        reason: request.reason,
        status: request.status,
      }));
  }

  if (pagePath.value === '/asistencia/estado-diario') {
    return employees.value.map((employee) => {
      const today = attendance.value.find(
        (record) =>
          record.employeeId === employee.id &&
          record.date === dayjs().format('YYYY-MM-DD'),
      );
      let status = 'Sin marcar';
      if (today?.status === 'Por validar') {
        status = 'Por validar';
      } else if (today?.checkIn) {
        status = 'Presente';
      } else if (employee.modality === 'Remoto') {
        status = 'Remoto';
      }
      return {
        id: today?.id ?? employee.id,
        employee: employee.name,
        group: employee.group,
        status,
      };
    });
  }

  if (pagePath.value === '/asistencia/mensual') {
    return employees.value.map((employee) => {
      const records = attendance.value.filter(
        (record) =>
          record.employeeId === employee.id &&
          dayjs(record.date).isSame(dayjs(), 'month'),
      );
      return {
        id: employee.id,
        employee: employee.name,
        daysPresent: records.filter((record) => Boolean(record.checkIn)).length,
        pending: records.filter((record) => record.status === 'Por validar')
          .length,
        extraMinutes: records.reduce(
          (total, record) => total + record.extraMinutes,
          0,
        ),
      };
    });
  }

  return attendance.value
    .filter(
      (record) =>
        pagePath.value !== '/asistencia/registros' ||
        record.date === dayjs().format('YYYY-MM-DD'),
    )
    .map((record) => ({
      ...record,
      employee:
        employees.value.find((employee) => employee.id === record.employeeId)
          ?.name ?? 'Persona no disponible',
      checkIn: record.checkIn ?? 'Sin marcar',
      checkOut: record.checkOut ?? 'En curso',
    }))
    .toReversed();
});
const leaveRows = computed(() => {
  if (pagePath.value === '/vacaciones/saldos') {
    return balances.value.map((balance) => ({
      id: `${balance.employeeId}-${balance.leaveType}`,
      employee:
        employees.value.find((employee) => employee.id === balance.employeeId)
          ?.name ?? 'Persona no disponible',
      leaveType: balance.leaveType,
      entitledDays: balance.entitledDays,
      usedDays: balance.usedDays,
      pendingDays: balance.pendingDays,
      availableDays:
        balance.entitledDays - balance.usedDays - balance.pendingDays,
    }));
  }
  if (pagePath.value === '/vacaciones/tipos') {
    return leaveTypes.value.map((item) => ({
      id: item.id,
      name: item.name,
      paid: item.paid ? 'Con goce' : 'Sin goce',
      annualDays: item.annualDays ?? 'Según ley',
      annualDaysValue: item.annualDays,
      annualReset: item.annualReset ? 'Anual' : 'No aplica',
    }));
  }
  if (pagePath.value === '/vacaciones/feriados') {
    return holidays.value.map((item) => ({
      id: item.id,
      date: item.date,
      name: item.name,
      region: item.region,
    }));
  }
  return requests.value
    .filter(
      (request) => request.type === 'Vacaciones' || request.type === 'Permiso',
    )
    .map((request) => ({
      id: request.id,
      employee:
        employees.value.find((employee) => employee.id === request.employeeId)
          ?.name ?? 'Persona no disponible',
      title: request.title,
      startDate: request.startDate ?? '—',
      days: request.days,
      status: request.status,
    }));
});
const employeeRows = computed(() => {
  if (pagePath.value === '/empleados/politicas') {
    return peoplePolicies.value.map((policy) => ({
      id: policy.id,
      name: policy.name,
      category: policy.category,
      scope: policy.scope,
      summary: policy.summary,
      reviewCycle: policy.reviewCycle,
    }));
  }
  if (pagePath.value === '/empleados/grupos') {
    return groups.value.map((group) => ({
      id: group,
      name: group,
      people: employees.value.filter((employee) => employee.group === group)
        .length,
      lead:
        employees.value.find((employee) => employee.group === group)?.manager ??
        'Por asignar',
    }));
  }
  if (pagePath.value === '/empleados/horarios') {
    return employees.value.map((employee) => ({
      id: employee.id,
      employee: employee.name,
      group: employee.group,
      shift: employee.shift,
      modality: employee.modality,
    }));
  }
  return employees.value.map((employee) => ({
    id: employee.id,
    employee: employee.name,
    title: employee.title,
    group: employee.group,
    manager: employee.manager,
    status: employee.status,
  }));
});
const rows = computed<GridRow[]>(() => {
  if (isRequests.value) return filteredRequests.value as GridRow[];
  if (isAttendance.value) return attendanceRows.value as GridRow[];
  if (isLeave.value) return leaveRows.value as GridRow[];
  if (isInterview.value) return interviewRows.value as GridRow[];
  if (isTemplatePage.value) {
    const templates =
      pagePath.value === '/onboarding/plantillas'
        ? onboardingTemplates.value
        : offboardingTemplates.value;
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      stages: template.stages.join(' · '),
      stageCount: template.stages.length,
      durationDays: template.durationDays,
      summary: template.summary,
    }));
  }
  if (isOnboarding.value) return onboardingRows.value as GridRow[];
  if (isOffboarding.value) return offboardingRows.value as GridRow[];
  if (isEmployees.value) return employeeRows.value as GridRow[];
  return [];
});
const tableColumns = computed<VxeTableGridColumns>(() => {
  const fields: Record<string, Array<[string, string, number]>> = {
    '/mis-solicitudes': [
      ['type', 'Tipo', 160],
      ['title', 'Solicitud', 240],
      ['startDate', 'Fecha', 130],
      ['days', 'Días', 75],
      ['status', 'Estado', 120],
    ],
    '/aprobaciones': [
      ['employee', 'Persona', 180],
      ['type', 'Tipo', 160],
      ['title', 'Solicitud', 230],
      ['createdAt', 'Recibida', 120],
      ['status', 'Estado', 120],
    ],
    '/asistencia': [
      ['employee', 'Persona', 180],
      ['date', 'Fecha', 120],
      ['checkIn', 'Entrada', 110],
      ['checkOut', 'Salida', 110],
      ['status', 'Estado', 120],
    ],
    '/asistencia/registros': [
      ['employee', 'Persona', 180],
      ['date', 'Fecha', 120],
      ['checkIn', 'Entrada', 110],
      ['checkOut', 'Salida', 110],
      ['status', 'Estado', 120],
    ],
    '/asistencia/correcciones': [
      ['employee', 'Persona', 180],
      ['date', 'Fecha', 120],
      ['reason', 'Detalle de corrección', 320],
      ['status', 'Estado', 120],
    ],
    '/asistencia/mensual': [
      ['employee', 'Persona', 180],
      ['daysPresent', 'Días con marcación', 150],
      ['pending', 'Por validar', 110],
      ['extraMinutes', 'Minutos extra', 130],
    ],
    '/asistencia/estado-diario': [
      ['employee', 'Persona', 180],
      ['group', 'Equipo', 180],
      ['status', 'Estado', 140],
    ],
    '/vacaciones': [
      ['employee', 'Persona', 180],
      ['title', 'Solicitud', 240],
      ['startDate', 'Inicio', 130],
      ['days', 'Días', 80],
      ['status', 'Estado', 120],
    ],
    '/vacaciones/calendario': [
      ['employee', 'Persona', 180],
      ['title', 'Ausencia', 240],
      ['startDate', 'Inicio', 130],
      ['days', 'Días', 80],
      ['status', 'Estado', 120],
    ],
    '/vacaciones/saldos': [
      ['employee', 'Persona', 180],
      ['leaveType', 'Tipo de descanso', 180],
      ['entitledDays', 'Asignados', 100],
      ['usedDays', 'Usados', 90],
      ['pendingDays', 'Pendientes', 100],
      ['availableDays', 'Disponibles', 110],
    ],
    '/vacaciones/tipos': [
      ['name', 'Tipo', 220],
      ['paid', 'Condición', 140],
      ['annualDays', 'Días', 100],
      ['annualReset', 'Reinicio', 120],
    ],
    '/vacaciones/feriados': [
      ['date', 'Fecha', 140],
      ['name', 'Feriado', 240],
      ['region', 'Cobertura', 150],
    ],
    '/onboarding': [
      ['employee', 'Persona', 180],
      ['title', 'Cargo', 180],
      ['startDate', 'Inicio', 120],
      ['dueDate', 'Fecha prevista', 140],
      ['progress', 'Avance %', 110],
      ['status', 'Estado', 120],
    ],
    '/onboarding/procesos': [
      ['employee', 'Persona', 180],
      ['title', 'Cargo', 180],
      ['startDate', 'Inicio', 120],
      ['dueDate', 'Fecha prevista', 140],
      ['progress', 'Avance %', 110],
      ['status', 'Estado', 120],
    ],
    '/offboarding': [
      ['employee', 'Persona', 180],
      ['title', 'Cargo', 180],
      ['reason', 'Motivo', 170],
      ['exitDate', 'Salida', 120],
      ['progress', 'Avance %', 110],
      ['status', 'Estado', 120],
    ],
    '/offboarding/procesos': [
      ['employee', 'Persona', 180],
      ['title', 'Cargo', 180],
      ['reason', 'Motivo', 170],
      ['exitDate', 'Salida', 120],
      ['progress', 'Avance %', 110],
      ['status', 'Estado', 120],
    ],
    '/offboarding/entrevistas': [
      ['employee', 'Persona', 180],
      ['date', 'Fecha', 120],
      ['reason', 'Motivo', 180],
      ['satisfaction', 'Satisfacción', 120],
      ['recommend', 'Recomendaría', 130],
      ['comments', 'Comentarios', 280],
    ],
    '/onboarding/plantillas': [
      ['name', 'Plantilla', 200],
      ['stageCount', 'Etapas', 90],
      ['durationDays', 'Duración (días)', 140],
      ['stages', 'Recorrido', 400],
      ['summary', 'Descripción', 300],
    ],
    '/offboarding/plantillas': [
      ['name', 'Plantilla', 200],
      ['stageCount', 'Etapas', 90],
      ['durationDays', 'Duración (días)', 140],
      ['stages', 'Recorrido', 400],
      ['summary', 'Descripción', 300],
    ],
    '/empleados/grupos': [
      ['name', 'Equipo', 230],
      ['people', 'Personas', 100],
      ['lead', 'Responsable', 220],
    ],
    '/empleados/organigrama': [
      ['employee', 'Persona', 200],
      ['title', 'Cargo', 220],
      ['group', 'Equipo', 180],
      ['manager', 'Jefatura', 180],
      ['status', 'Estado', 120],
    ],
    '/empleados/horarios': [
      ['employee', 'Persona', 200],
      ['group', 'Equipo', 180],
      ['shift', 'Turno', 150],
      ['modality', 'Modalidad', 130],
    ],
    '/empleados/politicas': [
      ['name', 'Política', 200],
      ['category', 'Tema', 180],
      ['scope', 'Alcance', 180],
      ['summary', 'Resumen', 320],
      ['reviewCycle', 'Revisión', 150],
    ],
  };
  const selected =
    fields[pagePath.value] ?? fields['/empleados/organigrama'] ?? [];
  const columns: VxeTableGridColumns = selected.map(
    ([field, label, width]) => ({
      field,
      minWidth: width,
      sortable: true,
      title: label,
    }),
  );
  if (
    isRequests.value ||
    pagePath.value === '/asistencia' ||
    pagePath.value === '/asistencia/registros' ||
    pagePath.value === '/asistencia/correcciones' ||
    pagePath.value === '/onboarding' ||
    pagePath.value === '/onboarding/procesos' ||
    pagePath.value === '/offboarding' ||
    pagePath.value === '/offboarding/procesos' ||
    pagePath.value === '/empleados/grupos' ||
    pagePath.value === '/vacaciones/tipos' ||
    pagePath.value === '/vacaciones/feriados'
  ) {
    columns.push({
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: 'Acciones',
      width: 140,
    });
  }
  return columns;
});
const onboardingActive = computed(
  () =>
    onboarding.value.filter((process) => process.status === 'En curso').length,
);
const offboardingActive = computed(
  () =>
    offboarding.value.filter((process) => process.status === 'En curso').length,
);
const pendingRequestCount = computed(
  () =>
    requests.value.filter((request) => request.status === 'Solicitado').length,
);
const pendingAttendanceCount = computed(
  () =>
    attendance.value.filter((record) => record.status === 'Por validar').length,
);

async function loadData() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [
      state,
      people,
      allRequests,
      allAttendance,
      allOnboarding,
      allOffboarding,
      allExitInterviews,
      allOnboardingTemplates,
      allOffboardingTemplates,
      allPeoplePolicies,
      allGroups,
      allBalances,
      allLeaveTypes,
      allHolidays,
    ] = await Promise.all([
      readDemoState(),
      employeesService.list(),
      requestsService.list(),
      attendanceService.list(),
      onboardingService.list(),
      offboardingService.list(),
      offboardingService.listInterviews(),
      workflowCatalogService.listTemplates('onboarding'),
      workflowCatalogService.listTemplates('offboarding'),
      workflowCatalogService.listPeoplePolicies(),
      employeesService.groups(),
      leaveService.listBalances(),
      leaveService.listTypes(),
      leaveService.listHolidays(),
    ]);
    employees.value = people;
    currentEmployeeId.value = getDemoEmployee(state, getDemoRole()).id;
    demoTasks.value = state.tasks;
    requests.value = allRequests;
    attendance.value = allAttendance;
    onboarding.value = allOnboarding;
    offboarding.value = allOffboarding;
    exitInterviews.value = allExitInterviews;
    onboardingTemplates.value = allOnboardingTemplates;
    offboardingTemplates.value = allOffboardingTemplates;
    peoplePolicies.value = allPeoplePolicies;
    groups.value = allGroups;
    balances.value = allBalances;
    leaveTypes.value = allLeaveTypes;
    holidays.value = allHolidays;
    if (!employeeDraft.group) employeeDraft.group = allGroups[0] ?? '';
    if (!route.query.employeeId) {
      const requiredStatus =
        pagePath.value === '/offboarding/nuevo' ? 'Activo' : 'En onboarding';
      const eligibleEmployee = people.find(
        (employee) => employee.status === requiredStatus,
      );
      if (eligibleEmployee) processDraft.employeeId = eligibleEmployee.id;
    }
    if (!interviewDraft.employeeId) {
      interviewDraft.employeeId =
        people.find((employee) => employee.status === 'Inactivo')?.id ??
        people[0]?.id ??
        '';
    }
    if (state.employees.length === 0)
      throw new Error('No hay personas en el directorio.');
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No pudimos cargar estos datos. Vuelve a intentarlo.';
  } finally {
    loading.value = false;
  }
}

function isSelectedRowPending(row: GridRow) {
  return row.status === 'Solicitado' || row.status === 'Por validar';
}

async function reviewRequest(
  row: GridRow,
  decision: 'approve' | 'cancel' | 'reject',
) {
  busy.value = true;
  try {
    if (decision === 'approve') await requestsService.approve(String(row.id));
    else if (decision === 'reject')
      await requestsService.reject(String(row.id), 'Revisado con el equipo.');
    else await requestsService.cancel(String(row.id));
    const successMessage: Record<typeof decision, string> = {
      approve: 'La solicitud quedó aprobada.',
      reject: 'La solicitud quedó rechazada.',
      cancel: 'Cancelaste la solicitud.',
    };
    ElMessage.success(successMessage[decision]);
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos actualizar la solicitud.',
    );
  } finally {
    busy.value = false;
  }
}

async function reviewSelectedRequests() {
  const pending = selectedRows.value.filter(isSelectedRowPending);
  if (pending.length === 0) {
    ElMessage.warning('Selecciona al menos una solicitud pendiente.');
    return;
  }
  busy.value = true;
  try {
    for (const row of pending) await requestsService.approve(String(row.id));
    selectedRows.value = [];
    ElMessage.success(`Aprobaste ${pending.length} solicitudes.`);
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos completar la revisión masiva.',
    );
    await loadData();
  } finally {
    busy.value = false;
  }
}

async function validateAttendance(row: GridRow) {
  busy.value = true;
  try {
    await attendanceService.validate(String(row.id));
    ElMessage.success('La marcación quedó validada.');
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos validar la marcación.',
    );
  } finally {
    busy.value = false;
  }
}

async function validateSelectedAttendance() {
  const ids = selectedRows.value
    .filter(isSelectedRowPending)
    .map((row) => String(row.id));
  if (ids.length === 0) {
    ElMessage.warning('Selecciona al menos una marcación pendiente.');
    return;
  }
  busy.value = true;
  try {
    await attendanceService.validateMany(ids);
    selectedRows.value = [];
    ElMessage.success(`Validaste ${ids.length} marcaciones.`);
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos validar las marcaciones seleccionadas.',
    );
  } finally {
    busy.value = false;
  }
}

function openProcess(id: string, type: 'offboarding' | 'onboarding') {
  activeProcessId.value = id;
  activeTaskProcess.value = type;
  taskDialogOpen.value = true;
}

async function updateProcessTask(task: ProcessTask) {
  busy.value = true;
  try {
    const nextStatus = task.status === 'Completada' ? 'En curso' : 'Completada';
    const updateTask =
      activeTaskProcess.value === 'onboarding'
        ? onboardingService.updateTask
        : offboardingService.updateTask;
    await updateTask(activeProcessId.value, task.id, { status: nextStatus });
    ElMessage.success(
      nextStatus === 'Completada'
        ? 'Marcaste la tarea como completada.'
        : 'La tarea volvió a quedar pendiente.',
    );
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos actualizar la tarea.',
    );
  } finally {
    busy.value = false;
  }
}

async function finishProcess() {
  if (!activeProcess.value) return;
  busy.value = true;
  try {
    if (activeTaskProcess.value === 'onboarding') {
      await onboardingService.finish(activeProcessId.value);
      ElMessage.success(
        'El onboarding quedó finalizado. La persona ya está activa.',
      );
    } else {
      await offboardingService.finish(activeProcessId.value);
      ElMessage.success(
        'El offboarding quedó finalizado. La persona ya está inactiva.',
      );
    }
    taskDialogOpen.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos finalizar el proceso.',
    );
  } finally {
    busy.value = false;
  }
}

async function submitLeaveRequest() {
  if (!currentEmployee.value || !leaveDates.value[0] || !leaveDates.value[1]) {
    ElMessage.error('Elige las fechas de inicio y fin.');
    return;
  }
  if (!leaveReason.value.trim()) {
    ElMessage.error('Cuéntanos el motivo de tu solicitud.');
    return;
  }
  if (!requestedDays.value || requestedDays.value > availableDays.value) {
    ElMessage.error('Revisa la cantidad de días y tu saldo disponible.');
    return;
  }
  busy.value = true;
  try {
    await requestsService.create({
      employeeId: currentEmployee.value.id,
      type: 'Vacaciones' satisfies RequestType,
      title: `Vacaciones de ${currentEmployee.value.firstName}`,
      startDate: leaveDates.value[0] ?? null,
      endDate: leaveDates.value[1] ?? null,
      days: requestedDays.value,
      reason: leaveReason.value.trim(),
    });
    ElMessage.success('Tu solicitud quedó registrada para revisión.');
    leaveDates.value = [];
    leaveReason.value = '';
    await loadData();
    await router.push('/mis-solicitudes');
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos registrar la solicitud.',
    );
  } finally {
    busy.value = false;
  }
}

function nextEmployeeStep() {
  if (
    employeeStep.value === 0 &&
    (!employeeDraft.firstName.trim() ||
      !employeeDraft.lastName.trim() ||
      !employeeDraft.dni.trim() ||
      !employeeDraft.email.trim())
  ) {
    ElMessage.error('Completa los datos personales antes de continuar.');
    return;
  }
  if (
    employeeStep.value === 1 &&
    (!employeeDraft.title.trim() ||
      !employeeDraft.group ||
      !employeeDraft.startDate)
  ) {
    ElMessage.error('Completa el cargo, el equipo y la fecha de ingreso.');
    return;
  }
  if (employeeStep.value < 2) employeeStep.value += 1;
  else void createEmployee();
}

async function createEmployee() {
  if (!employeeDraft.bankAccount.trim()) {
    ElMessage.error('Completa la cuenta bancaria de demostración.');
    return;
  }
  busy.value = true;
  try {
    const created = await employeesService.create({
      ...employeeDraft,
      name: `${employeeDraft.firstName.trim()} ${employeeDraft.lastName.trim()}`,
      initials:
        `${employeeDraft.firstName.trim()[0] ?? ''}${employeeDraft.lastName.trim()[0] ?? ''}`.toLocaleUpperCase(
          'es-PE',
        ),
      status: 'En onboarding',
    });
    ElMessage.success(`${created.name} ya está en el directorio.`);
    processDraft.employeeId = created.id;
    await loadData();
    await router.push({
      path: '/onboarding/nuevo',
      query: { employeeId: created.id },
    });
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos guardar el registro.',
    );
  } finally {
    busy.value = false;
  }
}

function onboardingTasks(): ProcessTask[] {
  const stages: Array<[string, string, ProcessTask['responsible']]> = [
    ['Documentación', 'Completa tus datos de ingreso', 'colaborador'],
    ['Documentación', 'Revisar documentos de identidad', 'rrhh'],
    ['Equipos y accesos', 'Preparar equipo de trabajo', 'rrhh'],
    ['Equipos y accesos', 'Activar accesos de la cuenta', 'rrhh'],
    ['Inducción', 'Compartir bienvenida y cultura del equipo', 'jefe'],
    ['Capacitación', 'Programar capacitación inicial', 'jefe'],
    ['Seguimiento', 'Coordinar revisión del primer mes', 'jefe'],
  ];
  return stages.map(([stage, taskTitle, responsible], index) => ({
    id: `new-onb-${Date.now()}-${index}`,
    title: taskTitle,
    stage,
    dueDate: dayjs()
      .add(index + 1, 'day')
      .format('YYYY-MM-DD'),
    responsible,
    status: 'Pendiente',
    comment: '',
  }));
}

function offboardingTasks(): ProcessTask[] {
  const stages: Array<[string, string, ProcessTask['responsible']]> = [
    ['Formalización', 'Confirmar fecha y motivo de salida', 'rrhh'],
    ['Devolución de equipos', 'Coordinar devolución de equipo', 'rrhh'],
    ['Accesos', 'Programar cierre de accesos', 'rrhh'],
    ['Traspaso', 'Documentar el traspaso de responsabilidades', 'jefe'],
    ['Cierre administrativo', 'Completar la tarea de liquidación', 'rrhh'],
  ];
  return stages.map(([stage, taskTitle, responsible], index) => ({
    id: `new-off-${Date.now()}-${index}`,
    title: taskTitle,
    stage,
    dueDate: dayjs()
      .add(index + 1, 'day')
      .format('YYYY-MM-DD'),
    responsible,
    status: 'Pendiente',
    comment: '',
  }));
}

async function startOnboarding() {
  if (!processDraft.employeeId) {
    ElMessage.error('Selecciona a la persona que iniciará su ingreso.');
    return;
  }
  busy.value = true;
  try {
    const employee = employees.value.find(
      (item) => item.id === processDraft.employeeId,
    );
    await onboardingService.create({
      employeeId: processDraft.employeeId,
      expectedEndDate: dayjs().add(30, 'day').format('YYYY-MM-DD'),
      responsibleId: currentEmployeeId.value,
      tasks: onboardingTasks(),
    });
    ElMessage.success(
      `Iniciaste el onboarding de ${employee?.name ?? 'la persona'}.`,
    );
    await loadData();
    await router.push('/onboarding/procesos');
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos iniciar el onboarding.',
    );
  } finally {
    busy.value = false;
  }
}

async function startOffboarding() {
  if (!processDraft.employeeId || !processDraft.reason.trim()) {
    ElMessage.error('Selecciona a la persona e indica el motivo de salida.');
    return;
  }
  busy.value = true;
  try {
    const employee = employees.value.find(
      (item) => item.id === processDraft.employeeId,
    );
    await offboardingService.create({
      employeeId: processDraft.employeeId,
      reason: processDraft.reason,
      exitDate: processDraft.exitDate,
      responsibleId: currentEmployeeId.value,
      tasks: offboardingTasks(),
    });
    ElMessage.success(
      `Iniciaste el offboarding de ${employee?.name ?? 'la persona'}.`,
    );
    await loadData();
    await router.push('/offboarding/procesos');
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos iniciar el offboarding.',
    );
  } finally {
    busy.value = false;
  }
}

async function saveInterview() {
  if (
    !interviewDraft.employeeId ||
    !interviewDraft.reason.trim() ||
    !interviewDraft.comments.trim()
  ) {
    ElMessage.error('Completa la persona, el motivo y tus comentarios.');
    return;
  }
  busy.value = true;
  try {
    await offboardingService.createInterview({
      employeeId: interviewDraft.employeeId,
      reason: interviewDraft.reason,
      satisfaction: interviewDraft.satisfaction,
      recommend: interviewDraft.recommend,
      comments: interviewDraft.comments,
    });
    ElMessage.success('Guardamos la entrevista de salida.');
    interviewDraft.comments = '';
    interviewDraft.reason = '';
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos guardar la entrevista.',
    );
  } finally {
    busy.value = false;
  }
}

async function completePortalTask(task: DemoTask) {
  const employeeId = task.employeeId ?? portalEmployee.value?.id;
  if (!employeeId) {
    ElMessage.error('No encontramos tu perfil de ingreso.');
    return;
  }
  if (
    !portalDraft.phone.trim() ||
    !portalDraft.district.trim() ||
    !portalDraft.bankAccount.trim()
  ) {
    ElMessage.warning(
      'Completa tu celular, distrito y cuenta bancaria de demostración.',
    );
    return;
  }
  busy.value = true;
  try {
    await employeesService.update(employeeId, {
      bankAccount: portalDraft.bankAccount.trim(),
      birthday: portalDraft.birthday,
      district: portalDraft.district.trim(),
      phone: portalDraft.phone.trim(),
    });
    await dayService.completeTask(task.id);
    await loadData();
    ElMessage.success('Guardamos tus datos de ingreso.');
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos guardar tus datos de ingreso.',
    );
  } finally {
    busy.value = false;
  }
}

function openGroupDialog(name = '') {
  groupEditingName.value = name;
  groupDraftName.value = name;
  groupDialogOpen.value = true;
}

async function saveGroup() {
  busy.value = true;
  try {
    if (groupEditingName.value) {
      await employeesService.updateGroup(
        groupEditingName.value,
        groupDraftName.value,
      );
      ElMessage.success('Actualizamos el equipo y sus integrantes.');
    } else {
      await employeesService.createGroup(groupDraftName.value);
      ElMessage.success('El equipo ya está disponible en el directorio.');
    }
    groupDialogOpen.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : 'No pudimos guardar el equipo.',
    );
  } finally {
    busy.value = false;
  }
}

async function removeGroup(name: string) {
  try {
    await ElMessageBox.confirm(
      `¿Quieres quitar el equipo ${name}?`,
      'Confirmar acción',
      {
        confirmButtonText: 'Quitar',
        cancelButtonText: 'Volver',
        type: 'warning',
      },
    );
  } catch (error) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error('No pudimos confirmar la acción.');
    return;
  }
  try {
    await employeesService.removeGroup(name);
    ElMessage.success('Quitamos el equipo.');
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : 'No pudimos quitar el equipo.',
    );
  }
}

function openLeaveCatalog(row?: GridRow) {
  catalogEditingId.value = row ? String(row.id) : '';
  catalogName.value = row ? String(row.name ?? row.title ?? '') : '';
  if (pagePath.value === '/vacaciones/tipos') {
    catalogAnnualDays.value =
      row && typeof row.annualDaysValue === 'number' ? row.annualDaysValue : 0;
  } else {
    catalogAnnualDays.value =
      row && typeof row.annualDays === 'number' ? row.annualDays : 30;
  }
  catalogDate.value = row
    ? String(row.date ?? catalogDate.value)
    : dayjs().format('YYYY-MM-DD');
  catalogPaid.value = row?.paid !== 'Sin goce';
  catalogAnnualReset.value = row?.annualReset === 'Anual';
  catalogRegion.value = String(row?.region ?? 'Nacional');
  catalogDialogOpen.value = true;
}

async function saveLeaveCatalog() {
  busy.value = true;
  try {
    if (pagePath.value === '/vacaciones/tipos') {
      const data = {
        name: catalogName.value,
        paid: catalogPaid.value,
        annualDays: catalogAnnualDays.value || null,
        annualReset: catalogAnnualReset.value,
      };
      await (catalogEditingId.value
        ? leaveService.updateType(catalogEditingId.value, data)
        : leaveService.createType(data));
    } else {
      const data = {
        date: catalogDate.value,
        name: catalogName.value,
        region: catalogRegion.value,
      };
      await (catalogEditingId.value
        ? leaveService.updateHoliday(catalogEditingId.value, data)
        : leaveService.createHoliday(data));
    }
    catalogDialogOpen.value = false;
    ElMessage.success(
      pagePath.value === '/vacaciones/tipos'
        ? 'Guardamos el tipo de descanso.'
        : 'Guardamos el feriado.',
    );
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : 'No pudimos guardar este dato.',
    );
  } finally {
    busy.value = false;
  }
}

async function removeLeaveCatalog(id: string) {
  const isType = pagePath.value === '/vacaciones/tipos';
  try {
    await ElMessageBox.confirm(
      isType
        ? '¿Quieres quitar este tipo de descanso?'
        : '¿Quieres quitar este feriado del calendario?',
      'Confirmar acción',
      {
        confirmButtonText: 'Quitar',
        cancelButtonText: 'Volver',
        type: 'warning',
      },
    );
  } catch (error) {
    if (error === 'cancel' || error === 'close') return;
    ElMessage.error('No pudimos confirmar la acción.');
    return;
  }
  try {
    await (isType
      ? leaveService.removeType(id)
      : leaveService.removeHoliday(id));
    ElMessage.success('Quitamos el registro.');
    await loadData();
  } catch (error) {
    ElMessage.error(
      error instanceof Error ? error.message : 'No pudimos quitar el registro.',
    );
  }
}

function go(path: string) {
  void router.push(path);
}

function calendarItems(date: string) {
  const holidayItems = holidays.value
    .filter((holiday) => holiday.date === date)
    .map((holiday) => ({
      id: holiday.id,
      label: holiday.name,
      kind: 'holiday',
    }));
  const leaveItems = requests.value
    .filter(
      (request) =>
        request.type === 'Vacaciones' &&
        request.status === 'Aprobado' &&
        request.startDate &&
        request.endDate &&
        request.startDate <= date &&
        request.endDate >= date,
    )
    .map((request) => ({
      id: request.id,
      label:
        employees.value.find((employee) => employee.id === request.employeeId)
          ?.firstName ?? 'Ausencia',
      kind: 'leave',
    }));
  return [...holidayItems, ...leaveItems].slice(0, 2);
}

watch(
  () => route.path,
  () => {
    selectedRows.value = [];
    if (route.query.employeeId)
      processDraft.employeeId = String(route.query.employeeId);
    void loadData();
  },
);

onMounted(() => void loadData());
</script>

<template>
  <Page auto-content-height class="module-page">
    <div class="module-shell">
      <PageHeading
        :eyebrow="
          isAttendance
            ? 'Jornada y registro'
            : isLeave
              ? 'Tiempo para recargar'
              : isOnboarding
                ? 'Acompañar cada ingreso'
                : isOffboarding
                  ? 'Cerrar cada etapa con cuidado'
                  : isRequests
                    ? 'Seguimiento y acuerdos'
                    : 'Personas y equipos'
        "
        :title="title"
        :description="
          isNewEmployee
            ? 'Registra la información personal y laboral en tres pasos.'
            : isLeaveRequest
              ? 'Elige tus fechas y revisa cómo queda el equipo antes de enviar.'
              : 'Revisa la información y continúa con la siguiente acción.'
        "
      >
        <template #actions>
          <ElButton
            v-if="isOnboarding && !isPortal && !isNewOnboarding"
            type="primary"
            @click="go('/onboarding/nuevo')"
          >
            Iniciar onboarding
          </ElButton>
          <ElButton
            v-if="isOffboarding && !isInterview && !isNewOffboarding"
            type="primary"
            @click="go('/offboarding/nuevo')"
          >
            Iniciar offboarding
          </ElButton>
          <ElButton
            v-if="isEmployees && !isNewEmployee"
            type="primary"
            @click="go('/empleados/nuevo')"
          >
            Agregar persona
          </ElButton>
          <ElButton
            v-if="isLeave && !isLeaveRequest"
            type="primary"
            @click="go('/vacaciones/solicitar')"
          >
            Solicitar descanso
          </ElButton>
        </template>
      </PageHeading>

      <nav
        v-if="
          !isNewEmployee &&
          !isLeaveRequest &&
          !isNewOnboarding &&
          !isNewOffboarding &&
          !isInterview &&
          !isPortal
        "
        class="module-nav"
        aria-label="Secciones del módulo"
      >
        <template v-if="isRequests">
          <RouterLink to="/mis-solicitudes">Mis solicitudes</RouterLink>
          <RouterLink v-if="route.path === '/aprobaciones'" to="/aprobaciones">
            Aprobaciones
          </RouterLink>
        </template>
        <template v-else-if="isAttendance">
          <RouterLink to="/asistencia">Resumen</RouterLink><RouterLink to="/asistencia/registros">Registros</RouterLink><RouterLink to="/asistencia/correcciones">Correcciones</RouterLink><RouterLink to="/asistencia/mensual">Resumen mensual</RouterLink><RouterLink to="/asistencia/estado-diario">Estado diario</RouterLink>
        </template>
        <template v-else-if="isLeave">
          <RouterLink to="/vacaciones">Resumen</RouterLink><RouterLink to="/vacaciones/calendario">Calendario</RouterLink><RouterLink to="/vacaciones/saldos">Saldos</RouterLink><RouterLink v-if="userCanManageLeave" to="/vacaciones/tipos">
            Tipos
</RouterLink><RouterLink v-if="userCanManageLeave" to="/vacaciones/feriados">
            Feriados
          </RouterLink>
        </template>
        <template v-else-if="isOnboarding">
          <RouterLink to="/onboarding">Panel</RouterLink><RouterLink to="/onboarding/procesos">Procesos</RouterLink><RouterLink to="/onboarding/plantillas"> Plantillas </RouterLink>
        </template>
        <template v-else-if="isOffboarding">
          <RouterLink to="/offboarding">Panel</RouterLink><RouterLink to="/offboarding/procesos">Procesos</RouterLink><RouterLink to="/offboarding/entrevistas">Entrevistas</RouterLink><RouterLink to="/offboarding/plantillas"> Plantillas </RouterLink>
        </template>
        <template v-else-if="isEmployees">
          <RouterLink to="/empleados">Directorio</RouterLink><RouterLink to="/empleados/grupos">Equipos</RouterLink><RouterLink to="/empleados/organigrama">Organigrama</RouterLink><RouterLink to="/empleados/horarios">Horarios</RouterLink><RouterLink to="/empleados/politicas"> Políticas </RouterLink>
        </template>
      </nav>

      <StatePanel v-if="loading" loading aria-label="Cargando información" />
      <StatePanel
        v-else-if="errorMessage"
        title="No pudimos cargar esta vista"
        :error="errorMessage"
        @retry="loadData"
      />

      <template v-else>
        <div v-if="isRequests" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="Por revisar"
              :value="pendingRequestCount"
              description="Solicitudes recibidas"
            />
            <KpiCard
              label="En tu historial"
              :value="filteredRequests.length"
              description="Actualizadas desde un solo lugar"
            />
            <KpiCard
              label="Descansos"
              :value="
                requests.filter((request) => request.type === 'Vacaciones')
                  .length
              "
              description="Solicitudes de vacaciones"
            />
          </div>
          <section class="table-container" aria-label="Bandeja de solicitudes">
            <div class="table-container__head">
              <div>
                <h2>
                  {{
                    isApprovals
                      ? 'Solicitudes por revisar'
                      : 'Tu actividad reciente'
                  }}
                </h2>
                <p>
                  {{
                    isApprovals
                      ? 'Resuelve cada caso con el contexto necesario.'
                      : 'Consulta el estado y los detalles de tus pedidos.'
                  }}
                </p>
              </div>
            </div>
            <DataTable
              :rows="filteredRequests as GridRow[]"
              :columns="tableColumns"
              :title="
                isApprovals ? 'Bandeja de aprobaciones' : 'Historial personal'
              "
              :selectable="isApprovals"
              @selection-change="selectedRows = $event"
            >
              <template #toolbar-actions>
                <ElButton
                  v-if="isApprovals"
                  :disabled="!selectedRows.length"
                  :loading="busy"
                  @click="reviewSelectedRequests"
                >
                  Aprobar seleccionadas
                </ElButton>
              </template>
              <template #action="{ row }">
                <ElButton
                  v-if="row.status === 'Solicitado' && isApprovals"
                  text
                  type="primary"
                  :loading="busy"
                  @click="reviewRequest(row, 'approve')"
                >
                  Aprobar
                </ElButton>
                <ElButton
                  v-else-if="row.status === 'Solicitado'"
                  text
                  type="danger"
                  :loading="busy"
                  @click="reviewRequest(row, isApprovals ? 'reject' : 'cancel')"
                >
                  {{ isApprovals ? 'Rechazar' : 'Cancelar' }}
                </ElButton>
                <ElTag v-else effect="plain">{{ row.status }}</ElTag>
              </template>
            </DataTable>
          </section>
        </div>

        <div v-else-if="isLeaveRequest" class="leave-request-layout">
          <section class="surface-panel">
            <h2>Elige tus fechas</h2>
            <ElForm label-position="top">
              <ElFormItem label="Periodo solicitado">
                <ElDatePicker
                  v-model="leaveDates"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  format="DD/MM/YYYY"
                  range-separator="a"
                  start-placeholder="Primer día"
                  end-placeholder="Último día"
                />
              </ElFormItem>
              <p class="form-hint">
                Contamos días laborables y excluimos sábados y domingos.
              </p>
              <ElFormItem label="Motivo">
                <ElInput
                  v-model="leaveReason"
                  type="textarea"
                  :rows="3"
                  maxlength="240"
                  show-word-limit
                  placeholder="Comparte el contexto que ayudará a coordinar tu ausencia."
                />
              </ElFormItem>
            </ElForm>
            <ElButton
              type="primary"
              :loading="busy"
              @click="submitLeaveRequest"
            >
              Enviar solicitud
            </ElButton>
          </section>
          <aside class="surface-panel leave-preview">
            <p class="eyebrow">Antes de enviar</p>
            <h2>Saldo disponible</h2>
            <strong>{{ availableDays }} días</strong>
            <p>Solicitas {{ requestedDays }} días de descanso.</p>
            <div class="preview-divider"></div>
            <h3>Tu equipo en esas fechas</h3>
            <p v-if="affectedColleagues.length">
              Coinciden con una ausencia aprobada de
              {{
                affectedColleagues.map((employee) => employee.name).join(', ')
              }}.
            </p>
            <p v-else>
              Por ahora no vemos descansos aprobados de tu equipo en ese
              periodo.
            </p>
            <ElCalendar v-model="calendarDate" class="leave-calendar">
              <template #date-cell="{ data }">
                <div class="calendar-day-cell">
                  <span>{{ data.day.slice(-2) }}</span>
                  <span
                    v-for="item in calendarItems(data.day)"
                    :key="item.id"
                    class="calendar-event"
                    :class="`calendar-event--${item.kind}`"
                    :title="item.label"
                    >{{ item.label }}</span>
                </div>
              </template>
            </ElCalendar>
          </aside>
        </div>

        <div v-else-if="isNewEmployee" class="surface-panel wizard-panel">
          <div class="wizard-steps">
            <span
              v-for="(label, index) in [
                'Datos personales',
                'Datos laborales',
                'Datos bancarios',
              ]"
              :key="label"
              :class="{
                'is-current': employeeStep === index,
                'is-complete': employeeStep > index,
              }"
              >{{ index + 1 }} · {{ label }}</span>
          </div>
          <ElForm label-position="top" class="wizard-grid">
            <template v-if="employeeStep === 0">
              <ElFormItem label="Nombres">
                <ElInput
                  v-model="employeeDraft.firstName"
                  autocomplete="given-name"
                />
              </ElFormItem>
              <ElFormItem label="Apellidos">
                <ElInput
                  v-model="employeeDraft.lastName"
                  autocomplete="family-name"
                />
              </ElFormItem>
              <ElFormItem label="Correo de trabajo">
                <ElInput v-model="employeeDraft.email" type="email" />
              </ElFormItem>
              <ElFormItem label="DNI ficticio">
                <ElInput v-model="employeeDraft.dni" maxlength="8" />
              </ElFormItem>
              <ElFormItem label="Celular">
                <ElInput v-model="employeeDraft.phone" />
              </ElFormItem>
              <ElFormItem label="Distrito">
                <ElInput v-model="employeeDraft.district" />
              </ElFormItem>
            </template>
            <template v-else-if="employeeStep === 1">
              <ElFormItem label="Cargo">
                <ElInput v-model="employeeDraft.title" />
              </ElFormItem>
              <ElFormItem label="Equipo">
                <ElSelect v-model="employeeDraft.group">
                  <ElOption
                    v-for="group in groups"
                    :key="group"
                    :label="group"
                    :value="group"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="Jefatura directa">
                <ElInput v-model="employeeDraft.manager" />
              </ElFormItem>
              <ElFormItem label="Turno">
                <ElSelect v-model="employeeDraft.shift">
                  <ElOption
                    label="09:00 a 18:00"
                    value="09:00 a 18:00"
                  /><ElOption label="08:00 a 17:00" value="08:00 a 17:00" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="Modalidad">
                <ElSelect v-model="employeeDraft.modality">
                  <ElOption label="Presencial" value="Presencial" /><ElOption
                    label="Remoto"
                    value="Remoto"
                  /><ElOption label="Híbrido" value="Híbrido" />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="Fecha de ingreso">
                <ElDatePicker
                  v-model="employeeDraft.startDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
            </template>
            <template v-else>
              <ElFormItem label="Cuenta bancaria de demostración">
                <ElInput
                  v-model="employeeDraft.bankAccount"
                  placeholder="Número ficticio para la demo"
                />
              </ElFormItem>
              <ElFormItem label="Fecha de cumpleaños">
                <ElDatePicker
                  v-model="employeeDraft.birthday"
                  type="date"
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
              <p class="form-hint full-span">
                Al guardar, la persona queda en estado de ingreso y podrás
                iniciar su onboarding a continuación.
              </p>
            </template>
          </ElForm>
          <div class="wizard-actions">
            <ElButton v-if="employeeStep > 0" @click="employeeStep -= 1">
              Volver
</ElButton><ElButton type="primary" :loading="busy" @click="nextEmployeeStep">
              {{ employeeStep === 2 ? 'Guardar y continuar' : 'Continuar' }}
            </ElButton>
          </div>
        </div>

        <div
          v-else-if="isNewOnboarding || isNewOffboarding"
          class="surface-panel wizard-panel"
        >
          <p class="eyebrow">
            {{
              isNewOnboarding
                ? 'Acompañar desde el primer día'
                : 'Preparar una salida ordenada'
            }}
          </p>
          <h2>
            {{
              isNewOnboarding
                ? 'Prepara el ingreso'
                : 'Organiza el proceso de salida'
            }}
          </h2>
          <ElForm label-position="top" class="wizard-grid">
            <ElFormItem label="Persona">
              <ElSelect v-model="processDraft.employeeId" filterable>
                <ElOption
                  v-for="employee in employees.filter((person) =>
                    isNewOffboarding
                      ? person.status === 'Activo'
                      : person.status === 'En onboarding',
                  )"
                  :key="employee.id"
                  :label="employee.name"
                  :value="employee.id"
                />
              </ElSelect>
            </ElFormItem>
            <template v-if="isNewOffboarding">
              <ElFormItem label="Motivo de salida">
                <ElSelect v-model="processDraft.reason">
                  <ElOption
                    v-for="reason in [
                      'Renuncia voluntaria',
                      'Fin de contrato',
                      'Despido',
                      'Mejor oferta',
                      'Motivos personales',
                      'Jubilación',
                    ]"
                    :key="reason"
                    :label="reason"
                    :value="reason"
                  />
                </ElSelect>
              </ElFormItem>
              <ElFormItem label="Fecha de salida">
                <ElDatePicker
                  v-model="processDraft.exitDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                />
              </ElFormItem>
            </template>
          </ElForm>
          <div class="process-preview">
            <h3>Etapas incluidas</h3>
            <p>
              {{
                isNewOnboarding
                  ? 'Documentación · Equipos y accesos · Inducción · Capacitación · Seguimiento'
                  : 'Formalización · Devolución de equipos · Accesos · Traspaso · Cierre administrativo'
              }}
            </p>
          </div>
          <div class="wizard-actions">
            <ElButton @click="router.back()">Volver</ElButton><ElButton
              type="primary"
              :loading="busy"
              @click="isNewOnboarding ? startOnboarding() : startOffboarding()"
            >
              Iniciar proceso
            </ElButton>
          </div>
        </div>

        <div v-else-if="isInterview" class="surface-panel wizard-panel">
          <p class="eyebrow">Cierre y aprendizaje</p>
          <h2>Entrevista de salida</h2>
          <ElForm label-position="top" class="wizard-grid">
            <ElFormItem label="Persona">
              <ElSelect v-model="interviewDraft.employeeId" filterable>
                <ElOption
                  v-for="employee in employees.filter(
                    (person) => person.status === 'Inactivo',
                  )"
                  :key="employee.id"
                  :label="employee.name"
                  :value="employee.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="Motivo">
              <ElInput v-model="interviewDraft.reason" />
            </ElFormItem>
            <ElFormItem label="Satisfacción (1 a 5)">
              <ElSelect v-model="interviewDraft.satisfaction">
                <ElOption
                  v-for="score in [1, 2, 3, 4, 5]"
                  :key="score"
                  :label="`${score} de 5`"
                  :value="score"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="¿Recomendaría el equipo?">
              <ElSelect v-model="interviewDraft.recommend">
                <ElOption label="Sí" value="Sí" /><ElOption
                  label="No"
                  value="No"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="Comentarios" class="full-span">
              <ElInput
                v-model="interviewDraft.comments"
                type="textarea"
                :rows="4"
              />
            </ElFormItem>
          </ElForm>
          <div class="wizard-actions">
            <ElButton type="primary" :loading="busy" @click="saveInterview">
              Guardar entrevista
            </ElButton>
          </div>
          <section class="table-container interview-history">
            <div class="table-container__head">
              <div>
                <h2>Entrevistas registradas</h2>
                <p>
                  El registro queda separado de las solicitudes de las personas.
                </p>
              </div>
            </div>
            <DataTable :rows="rows" :columns="tableColumns" :title="title" />
          </section>
        </div>

        <div v-else-if="isPortal" class="surface-panel">
          <p class="eyebrow">Tu primer recorrido</p>
          <h2>Bienvenida a Ayni</h2>
          <p class="panel-copy">
            Confirma tus datos para que el equipo prepare tu primer día.
          </p>
          <ElForm
            v-if="portalTask && portalEmployee"
            label-position="top"
            class="portal-form"
            @submit.prevent="completePortalTask(portalTask)"
          >
            <p class="portal-task__title">{{ portalTask.title }}</p>
            <ElFormItem label="Celular">
              <ElInput
                v-model="portalDraft.phone"
                autocomplete="tel"
                inputmode="tel"
                maxlength="20"
              />
            </ElFormItem>
            <ElFormItem label="Distrito">
              <ElInput v-model="portalDraft.district" maxlength="80" />
            </ElFormItem>
            <ElFormItem label="Fecha de cumpleaños">
              <ElDatePicker
                v-model="portalDraft.birthday"
                type="date"
                value-format="YYYY-MM-DD"
                format="DD/MM/YYYY"
                placeholder="Selecciona una fecha"
                clearable
              />
            </ElFormItem>
            <ElFormItem label="Cuenta bancaria de demostración">
              <ElInput
                v-model="portalDraft.bankAccount"
                autocomplete="off"
                inputmode="numeric"
                maxlength="24"
              />
            </ElFormItem>
            <ElButton
              type="primary"
              :loading="busy"
              @click="completePortalTask(portalTask)"
            >
              Guardar datos y completar
            </ElButton>
          </ElForm>
          <p v-else class="empty-note">
            No tienes datos de ingreso pendientes. Tu información está al día.
          </p>
        </div>

        <div v-else-if="isAttendance" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="Por validar"
              :value="pendingAttendanceCount"
              description="Marcaciones que esperan revisión"
            />
            <KpiCard
              label="Registros del periodo"
              :value="attendance.length"
              description="Datos del último mes"
            />
            <KpiCard
              label="Solicitudes de corrección"
              :value="
                requests.filter(
                  (request) =>
                    request.type === 'Corrección de asistencia' &&
                    request.status === 'Solicitado',
                ).length
              "
              description="Pendientes de respuesta"
            />
          </div>
          <section class="table-container">
            <div class="table-container__head">
              <div>
                <h2>{{ title }}</h2>
                <p>
                  Consulta, filtra y valida sin perder de vista el registro
                  original.
                </p>
              </div>
            </div>
            <DataTable
              :rows="rows"
              :columns="tableColumns"
              :title="title"
              :selectable="
                pagePath === '/asistencia' ||
                pagePath === '/asistencia/registros'
              "
              @selection-change="selectedRows = $event"
            >
              <template #toolbar-actions>
                <ElButton
                  v-if="
                    pagePath === '/asistencia' ||
                    pagePath === '/asistencia/registros'
                  "
                  :disabled="!selectedRows.length"
                  :loading="busy"
                  @click="validateSelectedAttendance"
                >
                  Validar seleccionadas
                </ElButton>
              </template>
              <template #action="{ row }">
                <template
                  v-if="
                    pagePath === '/asistencia/correcciones' &&
                    row.status === 'Solicitado'
                  "
                >
                  <ElButton
                    text
                    type="primary"
                    :loading="busy"
                    @click="reviewRequest(row, 'approve')"
                  >
                    Aceptar
                  </ElButton>
                  <ElButton
                    text
                    type="danger"
                    :loading="busy"
                    @click="reviewRequest(row, 'reject')"
                  >
                    Rechazar
                  </ElButton>
                </template>
                <ElButton
                  v-else-if="row.status === 'Por validar'"
                  text
                  type="primary"
                  :loading="busy"
                  @click="validateAttendance(row)"
                >
                  Validar
                </ElButton>
                <ElTag v-else effect="plain">{{ row.status }}</ElTag>
              </template>
            </DataTable>
          </section>
        </div>

        <div v-else-if="isLeave" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="Disponibles"
              :value="currentBalance?.availableDays ?? 0"
              description="Días de descanso anual"
            />
            <KpiCard
              label="En revisión"
              :value="
                requests.filter(
                  (request) =>
                    request.type === 'Vacaciones' &&
                    request.status === 'Solicitado',
                ).length
              "
              description="Solicitudes por resolver"
            />
            <KpiCard
              label="Próximo feriado"
              :value="
                holidays[0] ? dayjs(holidays[0].date).format('D MMM') : '—'
              "
              :description="holidays[0]?.name ?? 'Sin fechas registradas'"
            />
          </div>
          <section
            v-if="pagePath === '/vacaciones/calendario'"
            class="surface-panel"
          >
            <p class="eyebrow">Planificación compartida</p>
            <h2>Calendario de ausencias</h2>
            <ElCalendar v-model="calendarDate" class="leave-calendar" />
          </section>
          <section class="table-container">
            <div class="table-container__head">
              <div>
                <h2>{{ title }}</h2>
                <p>
                  Las solicitudes y los saldos se actualizan desde una fuente
                  común.
                </p>
              </div>
            </div>
            <DataTable :rows="rows" :columns="tableColumns" :title="title">
              <template
                v-if="
                  pagePath === '/vacaciones/tipos' ||
                  pagePath === '/vacaciones/feriados'
                "
                #toolbar-tools
              >
                <ElButton type="primary" @click="openLeaveCatalog()">
                  {{
                    pagePath === '/vacaciones/tipos'
                      ? 'Agregar tipo'
                      : 'Agregar feriado'
                  }}
                </ElButton>
              </template>
              <template
                v-if="
                  pagePath === '/vacaciones/tipos' ||
                  pagePath === '/vacaciones/feriados'
                "
                #action="{ row }"
              >
                <ElButton text type="primary" @click="openLeaveCatalog(row)">
                  Editar
                </ElButton>
                <ElButton
                  text
                  type="danger"
                  @click="removeLeaveCatalog(String(row.id))"
                >
                  Quitar
                </ElButton>
              </template>
            </DataTable>
          </section>
        </div>

        <div v-else-if="isOnboarding" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="En curso"
              :value="onboardingActive"
              description="Personas que empiezan"
            /><KpiCard
              label="Completados"
              :value="
                onboarding.filter((process) => process.status === 'Completado')
                  .length
              "
              description="Ingresos finalizados"
            /><KpiCard
              label="Tareas abiertas"
              :value="
                onboarding
                  .flatMap((process) => process.tasks)
                  .filter((task) => task.status !== 'Completada').length
              "
              description="En todas las etapas"
            />
          </div>
          <section class="table-container">
            <div class="table-container__head">
              <div>
                <h2>{{ title }}</h2>
                <p>El avance reúne tareas de la persona, su equipo y RR. HH.</p>
              </div>
            </div>
            <DataTable :rows="rows" :columns="tableColumns" :title="title">
              <template #action="{ row }">
                <ElButton
                  text
                  type="primary"
                  @click="openProcess(String(row.id), 'onboarding')"
                >
                  Ver etapas
                </ElButton>
              </template>
            </DataTable>
          </section>
        </div>

        <div v-else-if="isOffboarding" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="En curso"
              :value="offboardingActive"
              description="Salidas acompañadas"
            /><KpiCard
              label="Salidas del mes"
              :value="
                offboarding.filter((process) =>
                  dayjs(process.exitDate).isSame(dayjs(), 'month'),
                ).length
              "
              description="Con fecha este mes"
            /><KpiCard
              label="Tareas abiertas"
              :value="
                offboarding
                  .filter((process) => process.status === 'En curso')
                  .flatMap((process) => process.tasks)
                  .filter((task) => task.status !== 'Completada').length
              "
              description="Antes del cierre"
            />
          </div>
          <section class="table-container">
            <div class="table-container__head">
              <div>
                <h2>{{ title }}</h2>
                <p>Coordina cada devolución, acceso y traspaso con claridad.</p>
              </div>
            </div>
            <DataTable :rows="rows" :columns="tableColumns" :title="title">
              <template #action="{ row }">
                <ElButton
                  text
                  type="primary"
                  @click="openProcess(String(row.id), 'offboarding')"
                >
                  Ver etapas
                </ElButton>
              </template>
            </DataTable>
          </section>
        </div>

        <div v-else-if="isEmployees" class="module-content">
          <div class="kpi-grid">
            <KpiCard
              label="Personas activas"
              :value="
                employees.filter((employee) => employee.status === 'Activo')
                  .length
              "
              description="En todos los equipos"
            /><KpiCard
              label="Equipos"
              :value="groups.length"
              description="Áreas con personas asignadas"
            /><KpiCard
              label="Ingresos en curso"
              :value="
                employees.filter(
                  (employee) => employee.status === 'En onboarding',
                ).length
              "
              description="Acompañados desde el inicio"
            />
          </div>
          <section class="table-container">
            <div class="table-container__head">
              <div>
                <h2>{{ title }}</h2>
                <p>
                  Usa el menú de columnas, la búsqueda y la paginación del
                  directorio.
                </p>
              </div>
            </div>
            <DataTable :rows="rows" :columns="tableColumns" :title="title">
              <template v-if="pagePath === '/empleados/grupos'" #toolbar-tools>
                <ElButton type="primary" @click="openGroupDialog()">
                  Crear equipo
                </ElButton>
              </template>
              <template
                v-if="pagePath === '/empleados/grupos'"
                #action="{ row }"
              >
                <ElButton
                  text
                  type="primary"
                  @click="openGroupDialog(String(row.id))"
                >
                  Editar
                </ElButton>
                <ElButton
                  text
                  type="danger"
                  @click="removeGroup(String(row.id))"
                >
                  Quitar
                </ElButton>
              </template>
            </DataTable>
          </section>
        </div>
      </template>

      <ElDialog
        v-model="taskDialogOpen"
        :title="
          activeTaskProcess === 'onboarding'
            ? 'Etapas de ingreso'
            : 'Etapas de salida'
        "
        width="min(46rem, 92vw)"
        destroy-on-close
      >
        <div v-if="activeProcess" class="task-dialog">
          <div class="task-progress">
            <strong>{{
                activeProcess.tasks.filter(
                  (task) => task.status === 'Completada',
                ).length
              }}
              / {{ activeProcess.tasks.length }} tareas</strong><ElTag effect="plain">{{ activeProcess.status }}</ElTag>
          </div>
          <article
            v-for="task in processTasks"
            :key="task.id"
            class="process-task"
          >
            <ElCheckbox
              :model-value="task.status === 'Completada'"
              :disabled="activeProcess.status !== 'En curso'"
              @change="updateProcessTask(task)"
            >
              {{ task.title }}
            </ElCheckbox>
            <p>
              {{ task.stage }} · Responsable: {{ task.responsible }} · Fecha
              límite: {{ task.dueDate }}
            </p>
          </article>
          <ElButton
            type="primary"
            :disabled="activeProcess.status !== 'En curso'"
            :loading="busy"
            @click="finishProcess"
          >
            {{
              activeTaskProcess === 'onboarding'
                ? 'Finalizar onboarding'
                : 'Finalizar offboarding'
            }}
          </ElButton>
        </div>
      </ElDialog>
      <ElDialog
        v-model="groupDialogOpen"
        :title="groupEditingName ? 'Editar equipo' : 'Crear equipo'"
        width="min(32rem, 92vw)"
        destroy-on-close
      >
        <ElForm label-position="top" @submit.prevent="saveGroup">
          <ElFormItem label="Nombre del equipo">
            <ElInput
              v-model="groupDraftName"
              maxlength="80"
              @keyup.enter="saveGroup"
            />
          </ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="groupDialogOpen = false">Volver</ElButton><ElButton type="primary" :loading="busy" @click="saveGroup">
            Guardar equipo
          </ElButton>
        </template>
      </ElDialog>
      <ElDialog
        v-model="catalogDialogOpen"
        :title="
          pagePath === '/vacaciones/tipos' ? 'Tipo de descanso' : 'Feriado'
        "
        width="min(34rem, 92vw)"
        destroy-on-close
      >
        <ElForm label-position="top">
          <ElFormItem
            :label="
              pagePath === '/vacaciones/tipos' ? 'Nombre' : 'Nombre del feriado'
            "
          >
            <ElInput v-model="catalogName" maxlength="100" />
          </ElFormItem>
          <template v-if="pagePath === '/vacaciones/tipos'">
            <ElFormItem label="Días anuales">
              <ElInputNumber v-model="catalogAnnualDays" :min="0" :max="365" />
            </ElFormItem>
            <ElFormItem label="Condición de pago">
              <ElSelect v-model="catalogPaid">
                <ElOption label="Con goce" :value="true" /><ElOption
                  label="Sin goce"
                  :value="false"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="Reinicio anual">
              <ElSelect v-model="catalogAnnualReset">
                <ElOption label="Sí" :value="true" /><ElOption
                  label="No"
                  :value="false"
                />
              </ElSelect>
            </ElFormItem>
          </template>
          <template v-else>
            <ElFormItem label="Fecha">
              <ElDatePicker
                v-model="catalogDate"
                type="date"
                value-format="YYYY-MM-DD"
              />
            </ElFormItem>
            <ElFormItem label="Cobertura">
              <ElInput v-model="catalogRegion" />
            </ElFormItem>
          </template>
        </ElForm>
        <template #footer>
          <ElButton @click="catalogDialogOpen = false">Volver</ElButton><ElButton type="primary" :loading="busy" @click="saveLeaveCatalog">
            Guardar
          </ElButton>
        </template>
      </ElDialog>
    </div>
  </Page>
</template>

<style scoped>
.module-page {
  min-width: 0;
}

.module-shell {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-4);
}

.module-content {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.module-nav {
  display: flex;
  gap: var(--space-2);
  min-width: 0;
  overflow-x: auto;
  border-bottom: var(--border-width) solid var(--color-line);
}

.module-nav a {
  flex: 0 0 auto;
  padding: var(--space-2) var(--space-3);
  color: var(--color-ink-muted);
  text-decoration: none;
  border-bottom: 0.125rem solid transparent;
}

.module-nav a.router-link-active {
  font-weight: 650;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.table-container,
.surface-panel {
  min-width: 0;
  padding: var(--space-4);
  overflow: hidden;
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.table-container__head {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: 0 0 var(--space-3);
}

.table-container__head h2,
.surface-panel h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-20);
}

.table-container__head p,
.panel-copy,
.form-hint {
  margin: var(--space-1) 0 0;
  color: var(--color-ink-muted);
}

.leave-request-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
  gap: var(--space-4);
}

.leave-preview > strong {
  display: block;
  margin-top: var(--space-2);
  font-family: var(--font-display);
  font-size: var(--font-size-32);
  color: var(--color-primary);
}

.leave-preview h3,
.process-preview h3 {
  margin: var(--space-3) 0 var(--space-1);
  font-size: var(--font-size-16);
}

.leave-preview p,
.process-preview p {
  line-height: 1.55;
  color: var(--color-ink-muted);
}

.preview-divider {
  height: var(--border-width);
  margin: var(--space-4) 0;
  background: var(--color-line);
}

.leave-calendar {
  height: 22rem;
  overflow: hidden;
}

.leave-calendar :deep(.el-calendar-day) {
  height: 3.8rem;
  padding: var(--space-1);
}

.calendar-day-cell {
  display: grid;
  gap: 0.125rem;
  align-content: start;
  min-width: 0;
  height: 100%;
}

.calendar-event {
  padding: 0.0625rem var(--space-1);
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--font-size-12);
  color: var(--color-ink);
  white-space: nowrap;
  border-radius: var(--radius-control);
}

.calendar-event--holiday {
  background: var(--color-accent-soft);
}

.calendar-event--leave {
  background: var(--color-primary-soft);
}

.interview-history {
  margin-top: var(--space-3);
}

.wizard-panel {
  display: grid;
  gap: var(--space-4);
}

.wizard-panel > h2 {
  margin-top: calc(-1 * var(--space-3));
}

.wizard-steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.wizard-steps span {
  padding: var(--space-2) var(--space-3);
  color: var(--color-ink-muted);
  background: var(--color-surface);
  border-radius: var(--radius-pill);
}

.wizard-steps .is-current {
  font-weight: 650;
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.wizard-steps .is-complete {
  color: var(--color-card);
  background: var(--color-success);
}

.wizard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--space-4);
}

.wizard-grid :deep(.el-select),
.wizard-grid :deep(.el-date-editor) {
  width: 100%;
}

.full-span {
  grid-column: 1 / -1;
}

.wizard-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
}

.process-preview {
  padding: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-control);
}

.process-task {
  padding: var(--space-3) 0;
  border-top: var(--border-width) solid var(--color-line);
}

.process-task p {
  margin: var(--space-1) 0 0 var(--space-6);
  color: var(--color-ink-muted);
}

.portal-form {
  max-width: 40rem;
}

.portal-form :deep(.el-date-editor) {
  width: 100%;
}

.portal-task__title {
  margin-bottom: var(--space-3);
  font-weight: 600;
  color: var(--color-ink);
}

.task-dialog {
  display: grid;
  gap: var(--space-2);
}

.task-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: var(--space-2);
}

.task-dialog > .el-button {
  justify-self: end;
  margin-top: var(--space-3);
}

.surface-panel :deep(.el-form-item) {
  margin-bottom: var(--space-3);
}

.module-shell :deep(.vben-page-content) {
  min-width: 0;
}

@media (max-width: 52rem) {
  .module-shell {
    padding: var(--space-3);
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .leave-request-layout {
    grid-template-columns: 1fr;
  }

  .wizard-grid {
    grid-template-columns: 1fr;
  }

  .full-span {
    grid-column: auto;
  }
}
</style>
