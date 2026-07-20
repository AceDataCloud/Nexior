<template>
  <div class="field">
    <h2 class="title font-bold">
      {{ $t('webextrator.name.enableLlm') }}
      <el-tooltip effect="dark" :content="$t('webextrator.description.enableLlm')" placement="top">
        <info-icon
          class="ml-1 text-[var(--el-text-color-secondary)] text-xs"
          :size="'1em' as any"
          aria-hidden="true"
          focusable="false"
        />
      </el-tooltip>
    </h2>
    <el-switch v-model="value" class="value" />
  </div>
</template>

<script lang="ts">
import { InfoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElSwitch, ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'LlmToggle',
  components: {
    InfoIcon,
    ElSwitch,
    ElTooltip
  },
  computed: {
    value: {
      get(): boolean {
        return !!this.$store.state.webextrator?.config?.enable_llm;
      },
      set(val: boolean) {
        this.$store.commit('webextrator/setConfig', {
          ...this.$store.state.webextrator?.config,
          enable_llm: val
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

  .title {
    font-size: 14px;
    margin: 0;
  }
}
</style>
