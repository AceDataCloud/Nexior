<template>
  <span v-if="application" class="info">
    {{ $t('conversation.message.usedCount') }}: {{ application?.used_amount }}
    {{ $t('conversation.message.remainingCount') }}: {{ application?.remaining_amount }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApplication } from '@/operators';

export default defineComponent({
  name: 'ApiStatus',
  components: {},
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss">
.info {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
</style>
