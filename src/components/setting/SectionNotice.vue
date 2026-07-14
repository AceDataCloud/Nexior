<template>
  <div :class="['setting-notice', tone]">
    <component :is="resolvedIcon" class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
    <span class="text">
      <slot>{{ text }}</slot>
    </span>
  </div>
</template>

<script lang="ts">
import { AdminIcon, GlobeIcon, InfoIcon } from '@acedatacloud/core/icons/components';
import { defineComponent, type Component, type PropType } from 'vue';

type Tone = 'info' | 'admin' | 'official';

const TONE_ICON: Record<Tone, Component> = {
  info: InfoIcon,
  admin: AdminIcon,
  official: GlobeIcon
};

export default defineComponent({
  name: 'SettingSectionNotice',
  props: {
    text: {
      type: String,
      default: ''
    },
    tone: {
      type: String as PropType<Tone>,
      default: 'info',
      validator: (value: string) => ['info', 'admin', 'official'].includes(value)
    }
  },
  computed: {
    resolvedIcon(): Component {
      return TONE_ICON[this.tone as Tone] || InfoIcon;
    }
  }
});
</script>

<style lang="scss" scoped>
.setting-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  border-radius: 8px;
  background: var(--el-color-info-light-9);
  border: 1px solid var(--el-color-info-light-7);
  // The tone backgrounds are always light-9 (light in every theme), so the text
  // must stay dark or it turns invisible on the light banner in dark mode.
  color: var(--el-color-info-dark-2);

  .icon {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-color-info);
  }

  .text {
    flex: 1;
    word-break: break-word;
    color: inherit;
  }

  &.admin {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);

    .icon {
      color: var(--el-color-primary);
    }
  }

  &.official {
    background: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-7);
    color: var(--el-color-success-dark-2);

    .icon {
      color: var(--el-color-success);
    }
  }
}
</style>
