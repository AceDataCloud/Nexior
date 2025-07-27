<template>
  <div class="text-center text-gray-400">
    <font-awesome-icon icon="fa-solid fa-magic" />
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
