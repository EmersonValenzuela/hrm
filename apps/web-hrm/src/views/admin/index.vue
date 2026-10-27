<script setup lang="ts">
import type { ECOption } from '@vben/plugins/echarts';

import type { AdminDashboardSummary } from '#/services/admin-dashboard.service';

import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ArrowUpRight,
  CalendarClock,
  ChartNoAxesCombined,
  CircleAlert,
  ClipboardCheck,
  UserRoundCheck,
  UsersRound,
} from '@lucide/vue';
import dayjs from 'dayjs';
import { ElButton, ElSkeleton } from 'element-plus';

import ChartPanel from '#/components/charts/ChartPanel.vue';
import KpiCard from '#/components/data/KpiCard.vue';
import { adminDashboardService } from '#/services/admin-dashboard.service';

const summary = ref<AdminDashboardSummary | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const todayLabel = dayjs().format('dddd, D [de] MMMM [de] YYYY');

const groupOption = computed<ECOption>(() => ({
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['55%', '78%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: 'var(--color-card)', borderWidth: 3 },
      label: {
        show: true,
        position: 'center',
        formatter: `{total|${summary.value?.activeEmployees ?? 0}}\n{caption|personas}`,
        rich: {
          total: {
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 32,
          },
          caption: {
            color: 'var(--color-ink-muted)',
            fontSize: 12,
            lineHeight: 20,
          },
        },
      },
      labelLine: { show: false },
      data:
        summary.value?.groupDistribution.map((item) => ({
          name: item.group,
          value: item.people,
        })) ?? [],
    },
  ],
}));

const attendanceOption = computed<ECOption>(() => ({
  grid: { top: 16, right: 12, bottom: 20, left: 28 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: summary.value?.attendanceTrend.map((item) => item.day) ?? [],
    axisLine: { lineStyle: { color: 'var(--color-line)' } },
    axisTick: { show: false },
    axisLabel: { color: 'var(--color-ink-muted)' },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: summary.value?.activeEmployees ?? 1,
    splitLine: { lineStyle: { color: 'var(--color-line)' } },
    axisLabel: { color: 'var(--color-ink-muted)' },
  },
  series: [
    {
      type: 'line',
      smooth: true,
      symbolSize: 7,
      data: summary.value?.attendanceTrend.map((item) => item.present) ?? [],
      areaStyle: { opacity: 0.12 },
    },
  ],
}));

const movementOption = computed<ECOption>(() => ({
  grid: { top: 16, right: 12, bottom: 20, left: 28 },
  tooltip: { trigger: 'axis' },
  legend: {
    bottom: 0,
    textStyle: { color: 'var(--color-ink-muted)' },
  },
  xAxis: {
    type: 'category',
    data: summary.value?.movement.map((item) => item.month) ?? [],
    axisLine: { lineStyle: { color: 'var(--color-line)' } },
    axisTick: { show: false },
    axisLabel: { color: 'var(--color-ink-muted)' },
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
    splitLine: { lineStyle: { color: 'var(--color-line)' } },
    axisLabel: { color: 'var(--color-ink-muted)' },
  },
  series: [
    {
      name: 'Ingresos',
      type: 'bar',
      barMaxWidth: 24,
      data: summary.value?.movement.map((item) => item.entries) ?? [],
    },
    {
      name: 'Salidas',
      type: 'bar',
      barMaxWidth: 24,
      data: summary.value?.movement.map((item) => item.exits) ?? [],
    },
  ],
}));

async function loadSummary() {
  loading.value = true;
  errorMessage.value = '';
  try {
    summary.value = await adminDashboardService.getSummary();
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'No pudimos cargar el panel. Vuelve a intentarlo.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => void loadSummary());
</script>

<template>
  <Page auto-content-height class="admin-page" aria-labelledby="admin-title">
    <div v-if="loading" class="admin-state" aria-label="Cargando el panel">
      <ElSkeleton :rows="9" animated />
    </div>
    <section v-else-if="errorMessage" class="admin-state" role="alert">
      <CircleAlert :size="24" aria-hidden="true" />
      <h2>No pudimos abrir el panel</h2>
      <p>{{ errorMessage }}</p>
      <ElButton type="primary" @click="loadSummary">Intentar de nuevo</ElButton>
    </section>
    <template v-else-if="summary">
      <header class="admin-heading">
        <div>
          <p class="eyebrow">{{ todayLabel }}</p>
          <h1 id="admin-title">Panel de gestión</h1>
          <p class="admin-heading__description">
            Una mirada clara a las personas y los procesos de hoy.
          </p>
        </div>
        <RouterLink class="primary-link" to="/empleados">
          Abrir directorio
          <ArrowUpRight :size="17" aria-hidden="true" />
        </RouterLink>
      </header>

      <section class="summary-grid" aria-label="Indicadores principales">
        <KpiCard
          label="Personas activas"
          :value="summary.activeEmployees"
          note="En el directorio"
        >
          <template #icon><UsersRound :size="18" /></template>
        </KpiCard>
        <KpiCard
          label="Asistencia de hoy"
          :value="`${summary.attendanceToday.percentage}%`"
          :note="`${summary.attendanceToday.present} personas presentes`"
        >
          <template #icon><UserRoundCheck :size="18" /></template>
        </KpiCard>
        <KpiCard
          label="Solicitudes pendientes"
          :value="summary.pendingRequests"
          note="Por revisar"
        >
          <template #icon><ClipboardCheck :size="18" /></template>
        </KpiCard>
        <KpiCard
          label="Procesos en curso"
          :value="summary.processesInProgress"
          note="Ingresos y salidas"
        >
          <template #icon><CalendarClock :size="18" /></template>
        </KpiCard>
      </section>

      <div class="admin-content">
        <main class="analytics">
          <div class="analytics-grid">
            <ChartPanel
              class="group-panel"
              title="Personas por área"
              accessible-label="Distribución de personas activas por área"
              :option="groupOption"
              height="15rem"
            />
            <ChartPanel
              title="Asistencia durante la semana"
              accessible-label="Tendencia de asistencia de los últimos siete días hábiles"
              :option="attendanceOption"
              height="15rem"
            />
            <ChartPanel
              class="movement-panel"
              title="Ingresos y salidas"
              accessible-label="Ingresos y salidas de los últimos seis meses"
              :option="movementOption"
              height="15rem"
            />
          </div>
          <section class="process-panel" aria-labelledby="process-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Acompañamiento</p>
                <h2 id="process-title">Ingresos en curso</h2>
              </div>
              <RouterLink to="/onboarding/procesos">Ver procesos</RouterLink>
            </div>
            <ul v-if="summary.onboarding.length" class="process-list">
              <li v-for="process in summary.onboarding" :key="process.id">
                <span class="process-avatar" aria-hidden="true">
                  {{
                    process.employee
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                  }}
                </span>
                <span class="process-name">{{ process.employee }}</span>
                <span class="process-date">
                  Próximo hito ·
                  {{ dayjs(process.expectedEndDate).format('D MMM') }}
                </span>
              </li>
            </ul>
            <p v-else class="empty-note">
              No hay ingresos en curso por el momento.
            </p>
          </section>
        </main>

        <aside class="admin-aside" aria-label="Seguimiento">
          <section class="attention-panel" aria-labelledby="attention-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Seguimiento</p>
                <h2 id="attention-title">Para atender</h2>
              </div>
              <CircleAlert :size="19" aria-hidden="true" />
            </div>
            <ul class="attention-list">
              <li
                v-for="item in summary.attention"
                :key="item.id"
                :class="`attention-item attention-item--${item.tone}`"
              >
                <RouterLink :to="item.route">
                  <span class="attention-count">{{ item.count }}</span>
                  <span class="attention-copy">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.detail }}</span>
                  </span>
                  <ArrowUpRight :size="16" aria-hidden="true" />
                </RouterLink>
              </li>
            </ul>
          </section>

          <section class="pulse-panel" aria-labelledby="pulse-title">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Hoy</p>
                <h2 id="pulse-title">Pulso del equipo</h2>
              </div>
              <ChartNoAxesCombined :size="19" aria-hidden="true" />
            </div>
            <div class="pulse-stat">
              <span>Marcaciones por validar</span>
              <strong>{{ summary.attendanceToday.pending }}</strong>
            </div>
            <div class="pulse-stat">
              <span>Ingresos acompañados</span>
              <strong>{{ summary.onboarding.length }}</strong>
            </div>
            <div class="pulse-stat">
              <span>Salidas en curso</span>
              <strong>
                {{ summary.processesInProgress - summary.onboarding.length }}
              </strong>
            </div>
            <RouterLink class="pulse-link" to="/asistencia">
              Revisar asistencia
              <ArrowUpRight :size="16" aria-hidden="true" />
            </RouterLink>
          </section>
        </aside>
      </div>
    </template>
  </Page>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-5);
}

.admin-heading,
.section-heading {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
}

.admin-heading h1,
.admin-heading p,
.section-heading h2,
.section-heading p {
  margin: 0;
}

.admin-heading h1 {
  margin-top: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--font-size-32);
  letter-spacing: -0.035em;
}

.admin-heading__description {
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

.primary-link,
.section-heading > a,
.pulse-link {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  font-weight: 650;
  color: var(--color-primary);
  text-decoration: none;
}

.primary-link {
  min-height: var(--space-8);
  padding-inline: var(--space-4);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-control);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.admin-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.34fr);
  gap: var(--space-4);
  align-items: start;
}

.analytics,
.admin-aside {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.movement-panel {
  grid-column: 1 / -1;
}

.process-panel,
.attention-panel,
.pulse-panel {
  min-width: 0;
  padding: var(--space-4);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.section-heading {
  align-items: flex-start;
}

.section-heading h2 {
  margin-top: var(--space-1);
  font-family: var(--font-display);
  font-size: var(--font-size-20);
}

.section-heading > svg {
  flex: none;
  color: var(--color-primary);
}

.attention-list,
.process-list {
  padding: 0;
  margin: var(--space-3) 0 0;
  list-style: none;
}

.attention-item {
  border-top: var(--border-width) solid var(--color-line);
}

.attention-item a {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: 4.75rem;
  padding-block: var(--space-2);
  color: inherit;
  text-decoration: none;
}

.attention-count {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--space-7);
  height: var(--space-7);
  font-weight: 700;
  color: var(--color-warning);
  background: var(--color-accent-soft);
  border-radius: var(--radius-control);
}

.attention-item--info .attention-count {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.attention-copy {
  display: grid;
  flex: 1;
  gap: var(--space-1);
  min-width: 0;
}

.attention-copy strong {
  font-size: var(--font-size-14);
}

.attention-copy > span {
  font-size: var(--font-size-12);
  line-height: 1.4;
  color: var(--color-ink-muted);
}

.attention-item a > svg {
  flex: none;
  color: var(--color-ink-muted);
}

.process-list li {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-height: 3.75rem;
  border-top: var(--border-width) solid var(--color-line);
}

.process-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--space-7);
  height: var(--space-7);
  font-size: var(--font-size-12);
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border-radius: var(--radius-pill);
}

.process-name {
  flex: 1;
  min-width: 0;
  font-weight: 600;
}

.process-date {
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
}

.empty-note {
  margin: var(--space-4) 0 0;
  color: var(--color-ink-muted);
}

.pulse-stat {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding-block: var(--space-3);
  border-bottom: var(--border-width) solid var(--color-line);
}

.pulse-stat:first-of-type {
  margin-top: var(--space-2);
}

.pulse-stat span {
  color: var(--color-ink-muted);
}

.pulse-stat strong {
  font-family: var(--font-display);
  font-size: var(--font-size-20);
}

.pulse-link {
  margin-top: var(--space-4);
}

.admin-state {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
  padding: var(--space-6);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.admin-state h2,
.admin-state p {
  margin: 0;
}

.admin-state p {
  color: var(--color-ink-muted);
}

@media (max-width: 75rem) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-content {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-aside {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 48rem) {
  .admin-page {
    padding: var(--space-3);
  }

  .admin-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-heading h1 {
    font-size: var(--font-size-24);
  }

  .summary-grid,
  .analytics-grid,
  .admin-aside {
    grid-template-columns: minmax(0, 1fr);
  }

  .movement-panel {
    grid-column: auto;
  }

  .process-list li {
    flex-wrap: wrap;
    padding-block: var(--space-2);
  }

  .process-date {
    width: 100%;
    padding-left: calc(var(--space-7) + var(--space-3));
  }
}
</style>
