<template>
  <div class="filter-bar">
    <slot />
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
}

.filter-bar :deep(.el-form-item) {
  margin: 0;
}
</style>
