<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useUserStore } from '@vben/stores';

import { ArrowRight, Check, Clock3, Sun } from '@lucide/vue';
import {
  ElButton,
  ElMessage,
  ElProgress,
  ElSkeleton,
  ElTag,
} from 'element-plus';
import dayjs from 'dayjs';

import type { DemoRole } from '#/services/api';
import type { DaySummary } from '#/services/day.service';

import { dayService } from '#/services/day.service';

const userStore = useUserStore();
const route = useRoute();
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
    await dayService.toggleAttendance();
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

watch(
  () => [role.value, route.path],
  () => void loadSummary(),
  { immediate: true },
);
</script>

<template>
  <section class="day-page" aria-labelledby="day-heading">
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
              <span class="welcome-card__icon"
                ><Sun :size="18" aria-hidden="true"
              /></span>
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
            <span v-else class="attendance-time"
              >Turno habitual · 09:00 a 18:00</span
            >
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
                :aria-label="`Completar tarea: ${task.title}`"
                @click="toggleTask(task.id)"
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
    </template>
  </section>
</template>

<style scoped>
.day-page {
  display: grid;
  gap: var(--space-5);
}

.day-loading {
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-6);
}

.page-intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
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
  color: var(--color-primary);
  font-size: var(--font-size-12);
  font-weight: 650;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-4);
}

.welcome-card {
  display: flex;
  min-height: 15rem;
  grid-column: span 4;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  border-radius: var(--radius-card);
  background:
    radial-gradient(
      ellipse at 92% 10%,
      var(--color-primary-soft),
      transparent 50%
    ),
    var(--color-card);
  padding: var(--space-6);
}

.welcome-card__copy {
  max-width: 34rem;
}

.welcome-card__label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  font-weight: 650;
}

.welcome-card__icon {
  display: grid;
  width: var(--space-6);
  height: var(--space-6);
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-primary-soft);
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
  color: var(--color-ink-muted);
  line-height: 1.6;
}

.attendance-control {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
}

.attendance-button {
  min-height: var(--space-8);
  gap: var(--space-2);
  padding-inline: var(--space-5);
}

.attendance-time {
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
}

.welcome-card__metric {
  display: grid;
  min-width: 9rem;
  gap: var(--space-1);
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
}

.welcome-card__metric strong {
  color: var(--color-primary);
  font-family: var(--font-display);
  font-size: var(--font-size-32);
}

.surface-card {
  min-width: 0;
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-5);
}

.tasks-card {
  grid-column: span 4;
  grid-row: span 2;
}

.balance-card,
.events-card {
  grid-column: span 2;
}

.profile-card {
  display: flex;
  grid-column: span 2;
  align-items: center;
  gap: var(--space-3);
}

.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.card-heading h3 {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-20);
}

.count-badge {
  display: grid;
  min-width: var(--space-6);
  height: var(--space-6);
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}

.task-list {
  display: grid;
  margin-top: var(--space-3);
}

.task-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
  padding-block: var(--space-3);
}

.task-row__marker {
  width: var(--space-2);
  height: var(--space-2);
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  background: var(--color-accent);
}

.task-row__copy {
  min-width: 0;
  flex: 1;
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
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
  line-height: 1.5;
}

.empty-note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
  color: var(--color-success);
}

.completed-note {
  border-top: var(--border-width) solid var(--color-line);
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
  padding-top: var(--space-3);
}

.balance-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-4);
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
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
}

.card-footnote {
  margin: var(--space-3) 0 0;
}

.muted-icon {
  color: var(--color-ink-muted);
}

.event-row {
  display: flex;
  align-items: start;
  gap: var(--space-3);
  border-top: var(--border-width) solid var(--color-line);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
}

.event-date {
  min-width: 4.5rem;
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
  padding: var(--space-2);
  text-align: center;
}

.profile-avatar {
  display: grid;
  width: var(--space-8);
  height: var(--space-8);
  flex: 0 0 auto;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}

.profile-card__body h3 {
  margin: var(--space-1) 0;
  font-size: var(--font-size-16);
}

.profile-card__body p,
.profile-card__body span {
  display: block;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--font-size-12);
}

.profile-card__body span {
  margin-top: var(--space-1);
}

.state-panel {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-6);
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
