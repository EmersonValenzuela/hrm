import { attendanceMock } from '#/mocks/attendance';
import { employeeMock } from '#/mocks/employees';
import { dateHighlightsMock } from '#/mocks/events';
import {
  leaveBalancesMock,
  leaveTypesMock,
  peruHolidaysMock,
} from '#/mocks/leaves';
import { offboardingMock, onboardingMock } from '#/mocks/processes';
import { requestsMock } from '#/mocks/requests';

import type {
  AttendanceRecord,
  DateHighlight,
  DemoRequest,
  DemoRole,
  DemoTask,
  Employee,
  LeaveBalance,
  LeaveType,
  OffboardingProcess,
  OnboardingProcess,
  PeruHoliday,
} from './domain';

export type { DemoRole } from './domain';

export interface DemoState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  requests: DemoRequest[];
  leaveBalances: LeaveBalance[];
  leaveTypes: LeaveType[];
  holidays: PeruHoliday[];
  dateHighlights: DateHighlight[];
  onboarding: OnboardingProcess[];
  offboarding: OffboardingProcess[];
  clockedIn: boolean;
  lastClockTime: string | null;
  vacationDays: number;
  tasks: DemoTask[];
}

const demoStorageKey = 'ayni-demo-state-v2';
const roleStorageKey = 'ayni-demo-role-v1';

const initialState: DemoState = {
  employees: employeeMock,
  attendance: attendanceMock,
  requests: requestsMock,
  leaveBalances: leaveBalancesMock,
  leaveTypes: leaveTypesMock,
  holidays: peruHolidaysMock,
  dateHighlights: dateHighlightsMock,
  onboarding: onboardingMock,
  offboarding: offboardingMock,
  clockedIn: false,
  lastClockTime: null,
  vacationDays: 18,
  tasks: [
    {
      id: 'welcome-form',
      title: 'Completa tus datos de ingreso',
      detail: 'Tu información ayuda a preparar tu primer día.',
      role: 'colaborador',
      done: false,
      employeeId: 'emp-0030',
    },
    {
      id: 'team-review',
      title: 'Revisa las solicitudes del equipo',
      detail: 'Hay una solicitud pendiente de aprobación.',
      role: 'jefe',
      done: false,
    },
    {
      id: 'people-check',
      title: 'Da la bienvenida a una nueva persona',
      detail: 'Hay un ingreso próximo en Operaciones.',
      role: 'rrhh',
      done: false,
    },
  ],
};

let state: DemoState | undefined;
let resetVersion = 0;
let writeQueue: Promise<void> = Promise.resolve();

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.employees) &&
    Array.isArray(record.attendance) &&
    Array.isArray(record.requests) &&
    Array.isArray(record.leaveBalances) &&
    Array.isArray(record.leaveTypes) &&
    Array.isArray(record.holidays) &&
    Array.isArray(record.dateHighlights) &&
    Array.isArray(record.onboarding) &&
    Array.isArray(record.offboarding) &&
    typeof record.clockedIn === 'boolean' &&
    (record.lastClockTime === null ||
      typeof record.lastClockTime === 'string') &&
    typeof record.vacationDays === 'number' &&
    Array.isArray(record.tasks)
  );
}

function getState(): DemoState {
  if (state) {
    return state;
  }
  if (typeof window === 'undefined') {
    state = structuredClone(initialState);
    return state;
  }

  const storedState = window.localStorage.getItem(demoStorageKey);
  if (!storedState) {
    state = structuredClone(initialState);
    return state;
  }

  let parsedState: unknown;
  try {
    parsedState = JSON.parse(storedState);
  } catch (error) {
    console.error('No se pudo leer el estado guardado de la demo.', error);
    throw new Error(
      'Los datos guardados de la demo no tienen un formato válido.',
      { cause: error },
    );
  }
  if (!isDemoState(parsedState)) {
    throw new Error(
      'Los datos guardados de la demo no tienen un formato válido.',
    );
  }
  state = parsedState;
  return state;
}

async function waitForMock() {
  const delay = 200 + Math.floor(Math.random() * 201);
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
}

function persist(nextState: DemoState) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(demoStorageKey, JSON.stringify(nextState));
  }
}

export async function readDemoState() {
  await waitForMock();
  await writeQueue;
  return structuredClone(getState());
}

export async function updateDemoState(update: (nextState: DemoState) => void) {
  const expectedResetVersion = resetVersion;
  await waitForMock();
  const nextWrite = writeQueue.then(() => {
    if (expectedResetVersion !== resetVersion) {
      throw new Error('La demo se restableció antes de completar la acción.');
    }
    const nextState = structuredClone(getState());
    update(nextState);
    persist(nextState);
    state = nextState;
    return structuredClone(nextState);
  });
  writeQueue = nextWrite.then(
    () => undefined,
    () => undefined,
  );
  return nextWrite;
}

export function getDemoRole(): DemoRole {
  if (typeof window === 'undefined') {
    return 'colaborador';
  }
  const savedRole = window.localStorage.getItem(roleStorageKey);
  return savedRole === 'jefe' || savedRole === 'rrhh'
    ? savedRole
    : 'colaborador';
}

export function saveDemoRole(role: DemoRole) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(roleStorageKey, role);
  }
}

export function resetDemo() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(demoStorageKey);
    window.localStorage.removeItem(roleStorageKey);
  }
  resetVersion += 1;
  state = undefined;
}
