<template>
  <div class="kling-tabs">
    <div
      v-for="tab in tabs"
      :key="tab.value"
      :class="{ tab: true, active: tab.value === modelValue, disabled: tab.disabled }"
      @click="onSelect(tab)"
    >
      <font-awesome-icon v-if="tab.icon" :icon="tab.icon" class="mr-2" />
      <span>{{ tab.label }}</span>
      <el-tooltip v-if="tab.disabled && tab.disabledReason" effect="dark" :content="tab.disabledReason" placement="top">
        <font-awesome-icon icon="fa-solid fa-info" class="info ml-2" />
      </el-tooltip>
      <el-tag v-if="tab.badge" size="small" type="warning" class="ml-2 badge">{{ tab.badge }}</el-tag>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTooltip, ElTag } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IKlingTaskType } from '@/models';

interface ITab {
  value: IKlingTaskType | 'avatar';
  label: string;
  icon?: string;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string;
}

export default defineComponent({
  name: 'KlingTabSwitcher',
  components: {
    ElTooltip,
    ElTag,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: String as PropType<IKlingTaskType>,
      default: 'videos'
    }
  },
  emits: ['update:modelValue'],
  computed: {
    tabs(): ITab[] {
      return [
        {
          value: 'videos',
          label: this.$t('kling.tab.videoGeneration'),
          icon: 'fa-solid fa-film'
        },
        {
          value: 'motion',
          label: this.$t('kling.tab.motionControl'),
          icon: 'fa-solid fa-person-running'
        },
        {
          value: 'avatar',
          label: this.$t('kling.tab.avatar'),
          icon: 'fa-solid fa-user-tie',
          disabled: true,
          disabledReason: this.$t('kling.tab.avatarComingSoon'),
          badge: this.$t('kling.tab.comingSoon')
        }
      ];
    }
  },
  methods: {
    onSelect(tab: ITab) {
      if (tab.disabled) return;
      if (tab.value === 'avatar') return;
      this.$emit('update:modelValue', tab.value);
    }
  }
});
</script>

<style lang="scss" scoped>
.kling-tabs {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--app-border-subtle);
  background-color: var(--app-content-bg);
  overflow-x: auto;

  .tab {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 14px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;

    &:hover:not(.disabled):not(.active) {
      background-color: var(--el-fill-color);
    }

    &.active {
      background-color: var(--el-color-primary);
      color: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    }

    &.disabled {
      color: var(--el-text-color-disabled);
      cursor: not-allowed;
    }

    .info {
      font-size: 11px;
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-radius: 50%;
      padding: 2px;
      transform: scale(0.8);
      opacity: 0.7;
    }

    .badge {
      font-size: 10px;
      height: 18px;
      line-height: 16px;
    }
  }
}

@media (max-width: 767px) {
  .kling-tabs {
    padding: 8px 12px;
    gap: 4px;
    .tab {
      padding: 4px 10px;
      font-size: 12px;
    }
  }
}
</style>
