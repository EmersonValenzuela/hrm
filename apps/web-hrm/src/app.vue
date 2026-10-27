<script lang="ts" setup>
import { ElConfigProvider } from 'element-plus';

import { elementLocale } from '#/locales';
</script>

<template>
  <ElConfigProvider :locale="elementLocale">
    <RouterView />
  </ElConfigProvider>
</template>
