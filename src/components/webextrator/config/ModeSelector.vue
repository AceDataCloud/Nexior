<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('webextrator.name.mode') }}</h2>
    <el-radio-group v-model="value" class="value w-full">
      <el-radio-button label="extract" value="extract">
        <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('webextrator.mode.extract') }}
      </el-radio-button>
      <el-radio-button label="render" value="render">
        <globe-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('webextrator.mode.render') }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { GlobeIcon, MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElRadioGroup, ElRadioButton } from 'element-plus';
import { IWebextratorMode } from '@/models';

export default defineComponent({
  name: 'ModeSelector',
  components: {
    GlobeIcon,
    MagicIcon,
    ElRadioGroup,
    ElRadioButton
  },
  computed: {
    value: {
      get(): IWebextratorMode | undefined {
        return this.$store.state.webextrator?.config?.mode;
      },
      set(val: IWebextratorMode) {
        this.$store.commit('webextrator/setConfig', {
          ...this.$store.state.webextrator?.config,
          mode: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .title {
    font-size: 14px;
    margin-bottom: 8px;
  }
  :deep(.el-radio-button) {
    flex: 1;
  }
  :deep(.el-radio-button__inner) {
    width: 100%;
  }
}
</style>
