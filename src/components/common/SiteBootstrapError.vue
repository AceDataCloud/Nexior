<template>
  <main class="bootstrap-error" role="alert">
    <CloudOff :size="36" :stroke-width="1.5" aria-hidden="true" />
    <h1>{{ $t('common.bootstrap.failed') }}</h1>
    <p>{{ $t('common.bootstrap.description') }}</p>
    <el-button type="primary" :loading="retrying" @click="retry">
      {{ $t('common.bootstrap.retry') }}
    </el-button>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ElButton } from 'element-plus';
import { CloudOff } from '@lucide/vue';

const retrying = ref(false);
const retry = () => {
  if (retrying.value) return;
  retrying.value = true;
  // Restart locale, account and site-dependent initialization together.
  // Keep the original URL so deep links survive a failed startup.
  window.location.reload();
};
onMounted(() => window.addEventListener('online', retry));
onBeforeUnmount(() => window.removeEventListener('online', retry));
</script>

<style scoped lang="scss">
.bootstrap-error {
  min-height: 100dvh;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
  background: var(--app-content-bg);
  color: var(--el-text-color-regular);

  h1 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  p {
    max-width: 360px;
    margin: 0 0 8px;
    line-height: 1.6;
  }
}
</style>
