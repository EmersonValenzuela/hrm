<script lang="ts" setup>
import type { DemoRole } from '#/services/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { BasicLayout, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useTabbarStore, useUserStore } from '@vben/stores';

import { ElMessage, ElOption, ElSelect } from 'element-plus';

import { APP_NAME } from '#/config';
import {
  getDemoHomePath,
  getDemoRole,
  resetDemo,
  saveDemoRole,
} from '#/services/api';

const appRouter = useRouter();
const tabbarStore = useTabbarStore();
const userStore = useUserStore();
const activeRole = ref<DemoRole>(getDemoRole());
const resetNoticeKey = 'ayni-demo-reset-notice-v1';
const roleOptions: Array<{ label: string; value: DemoRole }> = [
  { label: 'Colaborador', value: 'colaborador' },
  { label: 'Jefe', value: 'jefe' },
  { label: 'RR. HH.', value: 'rrhh' },
];

const avatar = computed(
  () => userStore.userInfo?.avatar ?? preferences.app.defaultAvatar,
);
const menus = [
  {
    handler: onResetDemo,
    icon: 'lucide:rotate-ccw',
    text: 'Restablecer demo',
  },
];

onMounted(() => {
  if (window.sessionStorage.getItem(resetNoticeKey) === 'true') {
    window.sessionStorage.removeItem(resetNoticeKey);
    ElMessage.success('La demostración volvió a su estado inicial.');
  }
});

async function applyRole(role: DemoRole, showResetNotice = false) {
  const currentUser = userStore.userInfo;
  if (!currentUser) {
    throw new Error('No encontramos la cuenta local de la demostración.');
  }
  const homePath = getDemoHomePath(role);

  activeRole.value = role;
  saveDemoRole(role);
  userStore.setUserInfo({ ...currentUser, roles: [role], homePath });
  await tabbarStore.closeAllTabs(appRouter);
  if (showResetNotice) {
    window.sessionStorage.setItem(resetNoticeKey, 'true');
  }
  window.location.reload();
}

async function onRoleChange(role: DemoRole) {
  await applyRole(role);
}

async function onResetDemo() {
  resetDemo();
  await applyRole('colaborador', true);
}
</script>

<template>
  <BasicLayout
    :avatar
    logo-src="/favicon.svg"
    :logo-text="APP_NAME"
    :text="userStore.userInfo?.realName"
  >
    <template #header-right-1>
      <label class="role-switch">
        <span>Ver como</span>
        <ElSelect
          v-model="activeRole"
          aria-label="Ver como"
          @change="onRoleChange"
        >
          <ElOption
            v-for="option in roleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
      </label>
    </template>
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        description="Cuenta de demostración"
      />
    </template>
  </BasicLayout>
</template>

<style scoped>
.role-switch {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding-inline: var(--space-2);
  font-size: var(--font-size-12);
  color: var(--color-ink-muted);
  white-space: nowrap;
}

.role-switch :deep(.el-select) {
  width: 9.5rem;
}
</style>
