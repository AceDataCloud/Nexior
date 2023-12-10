<template>
  <div v-if="application" class="status">
    <span class="info">
      {{ $t('common.message.usedCount') }}: {{ application?.used_amount }} {{ $t('common.message.remainingCount') }}:
      {{ application?.remaining_amount }}
    </span>
    <span class="actions">
      <el-button size="small" type="primary" @click="onBuy">{{ $t('common.button.buyMore') }}</el-button>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApplication } from '@/operators';
import { ElButton } from 'element-plus';
export default defineComponent({
  name: 'ApiStatus',
  components: { ElButton },
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
  methods: {
    onBuy() {
      const url = `https://data.zhishuyun.com/console/applications/${this.application?.id}/buy`;
      window.open(url, '_blank');
    }
  }
});
</script>

<style lang="scss" scoped>
.status {
  display: block;
  width: fit-content;
  margin: auto;
}
.info {
  font-size: 14px;
  color: var(--el-text-color-regular);
  display: inline-block;
  text-align: center;
}
.actions {
  margin: 0 5px;
  display: inline-block;
  .el-button {
    border-radius: 20px;
  }
}
</style>
