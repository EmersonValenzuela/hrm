<script lang="ts" setup>
import type { DemoRole } from '#/services/api';
import type { DaySummary } from '#/services/day.service';
import type { DemoTask } from '#/services/domain';

import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ArrowRight, Check, Clock3, Sun } from '@lucide/vue';
import dayjs from 'dayjs';
import {
  ElButton,
  ElMessage,
  ElProgress,
  ElSkeleton,
  ElTag,
} from 'element-plus';

import KpiCard from '#/components/data/KpiCard.vue';
import { dayService } from '#/services/day.service';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const summary = ref<DaySummary | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const actionLoading = ref(false);

const role = computed<DemoRole>(() =>
  userStore.userRoles[0] === 'jefe' || userStore.userRoles[0] === 'rrhh'
    ? userStore.userRoles[0]
    : 'colaborador',
);
const roleLabel = computed(() => {
  if (role.value === 'jefe') return 'Jefe de equipo';
  if (role.value === 'rrhh') return 'Personas y cultura';
  return 'Colaborador';
});
const todayLabel = dayjs().format('dddd, D [de] MMMM');
const pendingTasks = computed(
  () => summary.value?.tasks.filter((task) => !task.done) ?? [],
);
const completedTasks = computed(
  () => summary.value?.tasks.filter((task) => task.done) ?? [],
);

async function loadSummary() {
  loading.value = true;
  errorMessage.value = '';
  try {
    summary.value = await dayService.getSummary(role.value);
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No pudimos cargar tu resumen. Vuelve a intentarlo.';
  } finally {
    loading.value = false;
  }
}

async function toggleAttendance() {
  actionLoading.value = true;
  try {
    await dayService.toggleAttendance(role.value);
    await loadSummary();
    ElMessage.success(
      summary.value?.clockedIn
        ? 'Tu entrada quedó registrada.'
        : 'Tu salida quedó registrada.',
    );
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos guardar tu marcación.',
    );
  } finally {
    actionLoading.value = false;
  }
}

async function toggleTask(taskId: string) {
  try {
    await dayService.completeTask(taskId);
    await loadSummary();
    ElMessage.success('Actualizamos tu lista de tareas.');
  } catch (error) {
    ElMessage.error(
      error instanceof Error
        ? error.message
        : 'No pudimos actualizar la tarea.',
    );
  }
}

async function openTask(task: DemoTask) {
  if (task.id.startsWith('onb-')) {
    await router.push('/onboarding/mi-ingreso');
    return;
  }
  await toggleTask(task.id);
}

function taskActionLabel(task: DemoTask) {
  return task.id.startsWith('onb-')
    ? `Abrir formulario de ingreso: ${task.title}`
    : `Completar tarea: ${task.title}`;
}

watch(
  () => [role.value, route.path],
  () => void loadSummary(),
  { immediate: true },
);
</script>

<template>
  <Page auto-content-height class="day-page" aria-labelledby="day-heading">
    <div v-if="loading" class="day-loading" aria-label="Cargando tu resumen">
      <ElSkeleton :rows="7" animated />
    </div>
    <div v-else-if="errorMessage" class="state-panel" role="alert">
      <h2>No pudimos abrir tu resumen</h2>
      <p>{{ errorMessage }}</p>
      <ElButton type="primary" @click="loadSummary">Intentar de nuevo</ElButton>
    </div>
    <template v-else-if="summary">
      <div class="page-intro">
        <div>
          <p class="eyebrow">{{ todayLabel }}</p>
          <h2 id="day-heading">
            Hola, {{ summary.currentEmployee.name.split(' ')[0] }}
          </h2>
          <p class="page-intro__subheading">
            Este es tu espacio para empezar con claridad.
          </p>
        </div>
        <ElTag effect="plain" round>{{ roleLabel }}</ElTag>
      </div>

      <div class="day-grid">
        <section class="welcome-card" aria-label="Resumen de la jornada">
          <div class="welcome-card__copy">
            <div class="welcome-card__label">
              <span class="welcome-card__icon"><Sun :size="18" aria-hidden="true" /></span>
              <span>Tu jornada de hoy</span>
            </div>
            <h3>
              {{
                role === 'rrhh'
                  ? 'Un buen día empieza con un equipo acompañado.'
                  : role === 'jefe'
                    ? 'Tu equipo cuenta contigo para avanzar.'
                    : 'Haz una pausa, organiza tu día y empieza.'
              }}
            </h3>
            <p>
              {{
                role === 'rrhh'
                  ? 'Revisa las novedades y da seguimiento a los ingresos próximos.'
                  : role === 'jefe'
                    ? 'Mira las novedades del equipo y atiende lo que necesita tu atención.'
                    : 'Tus pendientes y datos importantes están reunidos en un solo lugar.'
              }}
            </p>
          </div>
          <div v-if="role === 'colaborador'" class="attendance-control">
            <ElTag
              :type="summary.clockedIn ? 'success' : 'info'"
              effect="light"
            >
              {{
                summary.clockedIn ? 'Jornada en curso' : 'Aún no marcas entrada'
              }}
            </ElTag>
            <ElButton
              class="attendance-button"
              type="primary"
              :loading="actionLoading"
              @click="toggleAttendance"
            >
              <Clock3 :size="17" aria-hidden="true" />
              {{ summary.clockedIn ? 'Marcar salida' : 'Marcar entrada' }}
            </ElButton>
            <span v-if="summary.lastClockTime" class="attendance-time">
              Última marcación · {{ summary.lastClockTime }}
            </span>
            <span v-else class="attendance-time">Turno habitual · 09:00 a 18:00</span>
          </div>
          <div v-else class="welcome-card__metric">
            <span>{{
              role === 'rrhh' ? 'Personas activas' : 'Personas en tu equipo'
            }}</span>
            <strong>{{ summary.activeEmployees }}</strong>
            <span>{{
              role === 'rrhh'
                ? 'en el directorio'
                : 'con información disponible'
            }}</span>
          </div>
        </section>

        <section
          class="surface-card tasks-card"
          aria-labelledby="tasks-heading"
        >
          <div class="card-heading">
            <div>
              <p class="eyebrow">En tu radar</p>
              <h3 id="tasks-heading">Pendientes</h3>
            </div>
            <span class="count-badge">{{ pendingTasks.length }}</span>
          </div>
          <div v-if="pendingTasks.length" class="task-list">
            <article
              v-for="task in pendingTasks"
              :key="task.id"
              class="task-row"
            >
              <span class="task-row__marker" aria-hidden="true"></span>
              <div class="task-row__copy">
                <h4>{{ task.title }}</h4>
                <p>{{ task.detail }}</p>
              </div>
              <ElButton
                text
                type="primary"
                :aria-label="taskActionLabel(task)"
                @click="openTask(task)"
              >
                <Check :size="17" aria-hidden="true" />
              </ElButton>
            </article>
          </div>
          <div v-else class="empty-note">
            <Check :size="18" aria-hidden="true" />
            <span>Todo al día. No tienes pendientes.</span>
          </div>
          <div v-if="completedTasks.length" class="completed-note">
            {{ completedTasks.length }} tarea{{
              completedTasks.length > 1 ? 's' : ''
            }}
            completada{{ completedTasks.length > 1 ? 's' : '' }}
          </div>
        </section>

        <section
          v-if="role === 'colaborador'"
          class="surface-card balance-card"
          aria-labelledby="balance-heading"
        >
          <div class="card-heading">
            <div>
              <p class="eyebrow">Tiempo para recargar</p>
              <h3 id="balance-heading">Descanso disponible</h3>
            </div>
            <ArrowRight :size="18" class="muted-icon" aria-hidden="true" />
          </div>
          <div class="balance-card__body">
            <ElProgress
              type="circle"
              :percentage="Math.round((summary.vacationDays / 30) * 100)"
              :width="92"
              :stroke-width="8"
              :show-text="false"
            />
            <div>
              <strong>{{ summary.vacationDays }} días</strong>
              <span>de 30 disponibles</span>
            </div>
          </div>
          <p class="card-footnote">
            Tu saldo está actualizado para este periodo.
          </p>
        </section>

        <section
          v-if="role === 'colaborador'"
          class="surface-card events-card"
          aria-labelledby="events-heading"
        >
          <div class="card-heading">
            <div>
              <p class="eyebrow">Para tener presente</p>
              <h3 id="events-heading">Próximas fechas</h3>
            </div>
          </div>
          <article
            v-for="event in summary.events"
            :key="event.label"
            class="event-row"
          >
            <span class="event-date">{{ event.date }}</span>
            <div>
              <h4>{{ event.label }}</h4>
              <p>{{ event.detail }}</p>
            </div>
          </article>
        </section>

        <section
          v-if="role === 'colaborador'"
          class="surface-card profile-card"
          aria-labelledby="profile-heading"
        >
          <div class="profile-avatar" aria-hidden="true">
            {{ summary.currentEmployee.initials }}
          </div>
          <div class="profile-card__body">
            <p class="eyebrow">Tu equipo</p>
            <h3 id="profile-heading">{{ summary.currentEmployee.name }}</h3>
            <p>{{ summary.currentEmployee.title }}</p>
            <span>{{ summary.currentEmployee.group }}</span>
          </div>
        </section>
      </div>
      <section
        v-if="role === 'jefe'"
        class="surface-card team-dashboard"
        aria-labelledby="team-dashboard-title"
      >
        <div class="card-heading">
          <div>
            <p class="eyebrow">Personas a tu cargo</p>
            <h3 id="team-dashboard-title">Estado de tu equipo</h3>
          </div>
          <RouterLink to="/aprobaciones">Ir a aprobaciones</RouterLink>
        </div>
        <div class="team-list">
          <article
            v-for="person in summary.teamMembers"
            :key="person.id"
            class="team-row"
          >
            <span class="person-avatar" aria-hidden="true">{{
              person.initials
            }}</span>
            <div>
              <strong>{{ person.name }}</strong>
              <p>{{ person.title }}</p>
            </div>
            <ElTag effect="plain">{{ person.status }}</ElTag>
          </article>
        </div>
        <div class="team-shortcuts">
          <RouterLink to="/aprobaciones">
            {{ summary.pendingRequests }} solicitudes por atender
          </RouterLink>
          <RouterLink to="/vacaciones/calendario">
            Consultar ausencias
          </RouterLink>
        </div>
      </section>
      <section
        v-if="role === 'rrhh'"
        class="people-dashboard"
        aria-label="Resumen de gestión de personas"
      >
        <div class="people-kpis">
          <KpiCard
            label="Personas activas"
            :value="summary.activeEmployees"
            note="En el directorio"
          />
          <KpiCard
            label="Asistencias por validar"
            :value="summary.pendingAttendance"
            note="Marcaciones de hoy"
          />
          <KpiCard
            label="Solicitudes pendientes"
            :value="summary.pendingRequests"
            note="En toda la organización"
          />
          <KpiCard
            label="Ingresos en curso"
            :value="summary.onboardingActive"
            note="Procesos de onboarding"
          />
          <KpiCard
            label="Salidas acompañadas"
            :value="summary.offboardingActive"
            note="Procesos de offboarding"
          />
        </div>
        <div class="people-shortcuts">
          <RouterLink to="/empleados">Directorio de personas</RouterLink>
          <RouterLink to="/asistencia">Revisar asistencia</RouterLink>
          <RouterLink to="/onboarding/procesos">Acompañar ingresos</RouterLink>
          <RouterLink to="/offboarding/procesos">Acompañar salidas</RouterLink>
        </div>
      </section>
    </template>
  </Page>
</template>

<style scoped>
.day-page {
  display: grid;
  gap: var(--space-5);
  min-width: 0;
  padding: var(--space-4);
}

.team-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--space-2);
}

.team-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-control);
}

.team-row > div {
  flex: 1;
  min-width: 0;
}

.team-row p {
  margin: var(--space-1) 0 0;
  color: var(--color-ink-muted);
}

.team-shortcuts,
.people-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.team-shortcuts a,
.people-shortcuts a,
.card-heading a {
  font-weight: 650;
  color: var(--color-primary);
  text-decoration: none;
}

.people-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--space-3);
}

.people-shortcuts a {
  padding: var(--space-3);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-control);
}

.day-loading {
  padding: var(--space-6);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.page-intro {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  justify-content: space-between;
}

.page-intro h2,
.page-intro p {
  margin: 0;
}

.page-intro h2,
.card-heading h3,
.profile-card h3 {
  font-family: var(--font-display);
}

.page-intro h2 {
  margin-top: var(--space-1);
  font-size: var(--font-size-32);
  letter-spacing: -0.035em;
}

.page-intro__subheading {
  margin-top: var(--space-2) !important;
  color: var(--color-ink-muted);
}

.eyebrow {
  margin: 0;
  font-size: var(--font-size-12);
  font-weight: 650;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.045em;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-4);
}

.welcome-card {
  display: flex;
  grid-column: span 4;
  gap: var(--space-5);
  align-items: center;
  justify-content: space-between;
  min-height: 15rem;
  padding: var(--space-6);
  background:
    radial-gradient(
      ellipse at 92% 10%,
      var(--color-primary-soft),
      transparent 50%
    ),
    var(--color-card);
  border-radius: var(--radius-card);
}

.welcome-card__copy {
  max-width: 34rem;
}

.welcome-card__label {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  font-weight: 650;
  color: var(--color-primary);
}

.welcome-card__icon {
  display: grid;
  place-items: center;
  width: var(--space-6);
  height: var(--space-6);
  background: var(--color-primary-soft);
  border-radius: var(--radius-control);
}

.welcome-card h3 {
  max-width: 30rem;
  margin: var(--space-4) 0 var(--space-2);
  font-family: var(--font-display);
  font-size: var(--font-size-24);
  line-height: 1.25;
}

.welcome-card p {
  margin: 0;
  line-height: 1.6;
  color: var(--color-ink-muted);
}

.attendance-control {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.attendance-button {
  gap: var(--space-2);
  min-height: var(--space-8);
  padding-inline: var(--space-5);
}

.attendance-time {
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.welcome-card__metric {
  display: grid;
  gap: var(--space-1);
  min-width: 9rem;
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.welcome-card__metric strong {
  font-family: var(--font-display);
  font-size: var(--font-size-32);
  color: var(--color-primary);
}

.surface-card {
  min-width: 0;
  padding: var(--space-5);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.tasks-card {
  grid-row: span 2;
  grid-column: span 4;
}

.balance-card,
.events-card {
  grid-column: span 2;
}

.profile-card {
  display: flex;
  grid-column: span 2;
  gap: var(--space-3);
  align-items: center;
}

.card-heading {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.card-heading h3 {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-20);
}

.count-badge {
  display: grid;
  place-items: center;
  min-width: var(--space-6);
  height: var(--space-6);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-pill);
}

.task-list {
  display: grid;
  margin-top: var(--space-3);
}

.task-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding-block: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
}

.task-row__marker {
  flex: 0 0 auto;
  width: var(--space-2);
  height: var(--space-2);
  background: var(--color-accent);
  border-radius: var(--radius-pill);
}

.task-row__copy {
  flex: 1;
  min-width: 0;
}

.task-row h4,
.task-row p,
.event-row h4,
.event-row p {
  margin: 0;
}

.task-row h4,
.event-row h4 {
  font-size: var(--font-size-14);
  font-weight: 650;
}

.task-row p,
.event-row p {
  margin-top: var(--space-1);
  font-size: var(--font-size-12);
  line-height: 1.5;
  color: var(--color-ink-muted);
}

.empty-note {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-4);
  color: var(--color-success);
}

.completed-note {
  padding-top: var(--space-3);
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
  border-top: var(--border-width) solid var(--color-line);
}

.balance-card__body {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  margin-top: var(--space-4);
}

.balance-card__body strong,
.balance-card__body span {
  display: block;
}

.balance-card__body strong {
  font-family: var(--font-display);
  font-size: var(--font-size-20);
}

.balance-card__body span,
.card-footnote {
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.card-footnote {
  margin: var(--space-3) 0 0;
}

.muted-icon {
  color: var(--color-ink-muted);
}

.event-row {
  display: flex;
  gap: var(--space-3);
  align-items: start;
  padding-top: var(--space-3);
  margin-top: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
}

.event-date {
  min-width: 4.5rem;
  padding: var(--space-2);
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
  text-align: center;
  background: var(--color-surface);
  border-radius: var(--radius-control);
}

.profile-avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: var(--space-8);
  height: var(--space-8);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-pill);
}

.profile-card__body h3 {
  margin: var(--space-1) 0;
  font-size: var(--font-size-16);
}

.profile-card__body p,
.profile-card__body span {
  display: block;
  margin: 0;
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.profile-card__body span {
  margin-top: var(--space-1);
}

.state-panel {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  padding: var(--space-6);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.state-panel h2,
.state-panel p {
  margin: 0;
}

.state-panel p {
  color: var(--color-ink-muted);
}

@media (max-width: 70rem) {
  .welcome-card,
  .tasks-card {
    grid-column: span 6;
  }

  .tasks-card {
    grid-row: auto;
  }

  .balance-card,
  .events-card,
  .profile-card {
    grid-column: span 3;
  }
}

@media (max-width: 42rem) {
  .page-intro h2 {
    font-size: var(--font-size-24);
  }

  .day-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .welcome-card,
  .tasks-card,
  .balance-card,
  .events-card,
  .profile-card {
    grid-column: auto;
  }

  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
