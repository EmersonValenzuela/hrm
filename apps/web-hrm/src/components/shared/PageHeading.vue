<script setup lang="ts">
withDefaults(
  defineProps<{
    description?: string;
    eyebrow?: string;
    title: string;
  }>(),
  {
    description: '',
    eyebrow: '',
  },
);
</script>

<template>
  <header class="page-heading">
    <div class="page-heading__copy">
      <p v-if="eyebrow" class="page-heading__eyebrow">{{ eyebrow }}</p>
      <h1 class="page-heading__title">{{ title }}</h1>
      <p v-if="description" class="page-heading__description">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="page-heading__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-heading__copy {
  min-width: 0;
}

.page-heading__eyebrow,
.page-heading__description,
.page-heading__title {
  margin: 0;
}

.page-heading__eyebrow {
  color: var(--color-primary);
  font-size: var(--font-size-12);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.page-heading__title {
  margin-top: var(--space-1);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-size: var(--font-size-24);
  line-height: 1.25;
}

.page-heading__description {
  margin-top: var(--space-2);
  color: var(--color-ink-muted);
  font-size: var(--font-size-14);
}

.page-heading__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
</style>
