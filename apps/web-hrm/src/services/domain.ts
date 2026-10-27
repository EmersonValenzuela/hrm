export type DemoRole = 'colaborador' | 'jefe' | 'rrhh';

export type RequestType =
  | 'Vacaciones'
  | 'Permiso'
  | 'Documento'
  | 'Corrección de asistencia'
  | 'Cambio de turno';

export type RequestStatus =
  | 'Solicitado'
  | 'Aprobado'
  | 'Rechazado'
  | 'Cancelado';

export type AttendanceStatus = 'Por validar' | 'Validada' | 'Observada';

export type ProcessTaskStatus =
  | 'Pendiente'
  | 'En curso'
  | 'Completada'
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
  status: 'En onboarding' | 'Activo' | 'Inactivo';
  initials: string;
  district: string;
  bankAccount: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  extraMinutes: number;
  source: 'Registro de demo' | 'Marcación personal';
}

export interface DemoRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  title: string;
  status: RequestStatus;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
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
  annualDays: number | null;
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
  kind: 'Cumpleaños' | 'Aniversario' | 'Feriado';
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
  status: 'En curso' | 'Completado';
  tasks: ProcessTask[];
  completedAt: string | null;
}

export interface OffboardingProcess {
  id: string;
  employeeId: string;
  reason: string;
  startedAt: string;
  exitDate: string;
  responsibleId: string;
  status: 'En curso' | 'Completado';
  tasks: ProcessTask[];
  completedAt: string | null;
}

export interface DemoTask {
  id: string;
  title: string;
  detail: string;
  role: DemoRole;
  done: boolean;
  employeeId?: string;
}
