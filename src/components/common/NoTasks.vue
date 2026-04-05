<template>
  <div class="text-center text-[var(--el-text-color-secondary)] py-16">
    <font-awesome-icon icon="fa-solid fa-magic" class="text-3xl mb-2 text-[var(--el-color-primary-light-5)]" />
    <p class="mt-4 text-sm">{{ $t('common.message.noTasks') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'NoTasks',
  components: {
    FontAwesomeIcon
  }
});
</script>
