export type DemoRole = 'colaborador' | 'jefe' | 'rrhh';

export type RequestType =
  | 'Cambio de turno'
  | 'Corrección de asistencia'
  | 'Documento'
  | 'Permiso'
  | 'Vacaciones';

export type RequestStatus =
  | 'Aprobado'
  | 'Cancelado'
  | 'Rechazado'
  | 'Solicitado';

export type AttendanceStatus = 'Observada' | 'Por validar' | 'Validada';

export type ProcessTaskStatus =
  | 'Completada'
  | 'En curso'
  | 'Pendiente'
  | 'Vencida';

export interface Employee {
  id: string;
  code: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  group: string;
  email: string;
  phone: string;
  dni: string;
  manager: string;
  shift: string;
  modality: string;
  startDate: string;
  birthday: string;
  status: 'Activo' | 'En onboarding' | 'Inactivo';
  initials: string;
  district: string;
  bankAccount: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: null | string;
  checkOut: null | string;
  status: AttendanceStatus;
  extraMinutes: number;
  source: 'Marcación personal' | 'Registro de demo';
}

export interface DemoRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  title: string;
  status: RequestStatus;
  createdAt: string;
  startDate: null | string;
  endDate: null | string;
  days: number;
  reason: string;
  reviewerComment: string;
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: string;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
}

export interface LeaveType {
  id: string;
  name: string;
  paid: boolean;
  annualDays: null | number;
  annualReset: boolean;
}

export interface PeruHoliday {
  id: string;
  date: string;
  name: string;
  region: string;
}

export interface DateHighlight {
  id: string;
  date: string;
  label: string;
  detail: string;
  kind: 'Aniversario' | 'Cumpleaños' | 'Feriado';
}

export interface ProcessTask {
  id: string;
  title: string;
  stage: string;
  dueDate: string;
  responsible: DemoRole;
  status: ProcessTaskStatus;
  comment: string;
}

export interface OnboardingProcess {
  id: string;
  employeeId: string;
  startedAt: string;
  expectedEndDate: string;
  responsibleId: string;
  status: 'Completado' | 'En curso';
  tasks: ProcessTask[];
  completedAt: null | string;
}

export interface OffboardingProcess {
  id: string;
  employeeId: string;
  reason: string;
  startedAt: string;
  exitDate: string;
  responsibleId: string;
  status: 'Completado' | 'En curso';
  tasks: ProcessTask[];
  completedAt: null | string;
}

export interface ExitInterview {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  satisfaction: number;
  recommend: 'No' | 'Sí';
  comments: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  process: 'offboarding' | 'onboarding';
  stages: string[];
  durationDays: number;
  summary: string;
}

export interface PeoplePolicy {
  id: string;
  name: string;
  category: string;
  scope: string;
  summary: string;
  reviewCycle: string;
}

export interface DemoTask {
  id: string;
  title: string;
  detail: string;
  role: DemoRole;
  done: boolean;
  employeeId?: string;
}
