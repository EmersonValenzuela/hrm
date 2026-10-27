<script setup lang="ts">
import type { EchartsUIType, ECOption } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = withDefaults(
  defineProps<{
    accessibleLabel: string;
    height?: string;
    option: ECOption;
    title: string;
  }>(),
  {
    height: '18rem',
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

function render() {
  const chartColors = [
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim(),
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim(),
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-info')
      .trim(),
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-success')
      .trim(),
  ].filter(Boolean);

  void renderEcharts({
    color: chartColors,
    ...props.option,
  });
}

onMounted(render);
watch(() => props.option, render, { deep: true });
</script>

<template>
  <section class="chart-panel" :aria-label="title">
    <h2 class="chart-panel__title">{{ title }}</h2>
    <EchartsUI
      ref="chartRef"
      class="chart-panel__chart"
      :aria-label="accessibleLabel"
      role="img"
      :height="height"
    />
  </section>
</template>

<style scoped>
.chart-panel {
  min-width: 0;
  padding: var(--space-4);
  background: var(--color-card);
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
}

.chart-panel__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-16);
  font-weight: 600;
  color: var(--color-ink);
}

.chart-panel__chart {
  display: block;
  width: 100%;
  margin-top: var(--space-3);
}
</style>
