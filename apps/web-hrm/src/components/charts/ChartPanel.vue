<script setup lang="ts">
import type { ECOption, EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = withDefaults(
  defineProps<{
    ariaLabel: string;
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
      :aria-label="ariaLabel"
      role="img"
      :height="height"
    />
  </section>
</template>

<style scoped>
.chart-panel {
  min-width: 0;
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-4);
}

.chart-panel__title {
  margin: 0;
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-16);
  font-weight: 600;
}

.chart-panel__chart {
  display: block;
  width: 100%;
  margin-top: var(--space-3);
}
</style>
