<template>
  <div class="field">
    <span class="text-sm font-bold">
      {{ $t('midjourney.name.hd') }}
      <el-tooltip :content="$t('midjourney.description.hd')" placement="top">
        <info-icon class="info-icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
      </el-tooltip>
    </span>
    <el-switch v-model="value" />
  </div>
</template>

<script lang="ts">
import { InfoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElSwitch, ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'HdSelector',
  components: {
    InfoIcon,
    ElSwitch,
    ElTooltip
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.hd || false;
      },
      set(val: boolean) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          hd: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .info-icon {
    margin-left: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
  }
}
</style>
