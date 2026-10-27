<script setup lang="ts">
import { computed } from 'vue';

import { ElTag } from 'element-plus';

type StatusTone = 'danger' | 'info' | 'success' | 'warning';

const props = withDefaults(
  defineProps<{
    label: string;
    tone?: StatusTone;
  }>(),
  {
    tone: 'info',
  },
);

const tagType = computed(() => props.tone);
</script>

<template>
  <ElTag :type="tagType" effect="light" round>{{ label }}</ElTag>
</template>
