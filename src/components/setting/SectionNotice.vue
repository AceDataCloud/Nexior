<template>
  <div :class="['setting-notice', tone]">
    <font-awesome-icon :icon="resolvedIcon" class="icon" />
    <span class="text">
      <slot>{{ text }}</slot>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCircleInfo, faShieldHalved, faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Tone = 'info' | 'admin' | 'official';

const TONE_ICON: Record<Tone, IconDefinition> = {
  info: faCircleInfo,
  admin: faShieldHalved,
  official: faGlobe
};

export default defineComponent({
  name: 'SettingSectionNotice',
  components: { FontAwesomeIcon },
  props: {
    text: {
      type: String,
      default: ''
    },
    tone: {
      type: String as PropType<Tone>,
      default: 'info',
      validator: (value: string) => ['info', 'admin', 'official'].includes(value)
    },
    icon: {
      type: Object as PropType<IconDefinition | null>,
      default: null
    }
  },
  computed: {
    resolvedIcon(): IconDefinition {
      return this.icon || TONE_ICON[this.tone as Tone] || faCircleInfo;
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
  color: var(--el-text-color-regular);

  .icon {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-color-info);
  }

  .text {
    flex: 1;
    word-break: break-word;
  }

  &.admin {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);

    .icon {
      color: var(--el-color-primary);
    }
  }

  &.official {
    background: var(--el-color-success-light-9);
    border-color: var(--el-color-success-light-7);

    .icon {
      color: var(--el-color-success);
    }
  }
}
</style>
