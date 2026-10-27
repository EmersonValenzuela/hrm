<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    note?: string;
    value: string | number;
  }>(),
  {
    note: '',
  },
);
</script>

<template>
  <article class="kpi-card">
    <div class="kpi-card__top">
      <p class="kpi-card__label">{{ label }}</p>
      <span v-if="$slots.icon" class="kpi-card__icon" aria-hidden="true">
        <slot name="icon" />
      </span>
    </div>
    <p class="kpi-card__value">{{ value }}</p>
    <p v-if="note" class="kpi-card__note">{{ note }}</p>
  </article>
</template>

<style scoped>
.kpi-card {
  min-width: 0;
  border: var(--border-width) solid var(--color-line);
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-4);
}

.kpi-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.kpi-card__label,
.kpi-card__value,
.kpi-card__note {
  margin: 0;
}

.kpi-card__label,
.kpi-card__note {
  color: var(--color-ink-muted);
  font-size: var(--font-size-14);
}

.kpi-card__value {
  margin-top: var(--space-3);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-32);
  font-weight: 700;
  line-height: 1;
}

.kpi-card__note {
  margin-top: var(--space-2);
}

.kpi-card__icon {
  display: grid;
  width: var(--space-6);
  height: var(--space-6);
  flex: none;
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}
</style>
