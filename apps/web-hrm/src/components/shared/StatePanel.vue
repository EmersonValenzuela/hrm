<script setup lang="ts">
import { ElButton, ElEmpty, ElSkeleton } from 'element-plus';

withDefaults(
  defineProps<{
    description?: string;
    error?: string;
    loading?: boolean;
    retryLabel?: string;
    title?: string;
  }>(),
  {
    description: '',
    error: '',
    loading: false,
    retryLabel: 'Intentar de nuevo',
    title: '',
  },
);

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div
    v-if="loading"
    class="state-panel state-panel--loading"
    aria-live="polite"
  >
    <ElSkeleton :rows="4" animated />
  </div>
  <div v-else-if="error" class="state-panel state-panel--error" role="alert">
    <h2 v-if="title">{{ title }}</h2>
    <p>{{ error }}</p>
    <ElButton type="primary" @click="emit('retry')">
      {{ retryLabel }}
    </ElButton>
  </div>
  <div v-else class="state-panel state-panel--empty">
    <ElEmpty :description="description || 'No hay información para mostrar.'" />
    <slot name="actions" />
  </div>
</template>

<style scoped>
.state-panel {
  border-radius: var(--radius-card);
  background: var(--color-card);
  padding: var(--space-5);
}

.state-panel--error {
  border: var(--border-width) solid var(--el-color-error);
}

.state-panel--error h2,
.state-panel--error p {
  margin: 0 0 var(--space-3);
}

.state-panel--error h2 {
  color: var(--color-ink);
  font-size: var(--font-size-16);
}

.state-panel--error p {
  color: var(--color-ink-muted);
}

.state-panel--empty {
  display: grid;
  justify-items: center;
}
</style>
