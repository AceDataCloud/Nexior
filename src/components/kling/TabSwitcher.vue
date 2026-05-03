<template>
  <el-tabs :model-value="modelValue" class="kling-tabs" stretch @update:model-value="onUpdate">
    <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value" :disabled="tab.disabled">
      <template #label>
        <span class="tab-label">
          <font-awesome-icon v-if="tab.icon" :icon="tab.icon" class="mr-2" />
          <span>{{ tab.label }}</span>
          <el-tooltip
            v-if="tab.disabled && tab.disabledReason"
            effect="dark"
            :content="tab.disabledReason"
            placement="top"
          >
            <font-awesome-icon icon="fa-solid fa-info" class="info ml-2" />
          </el-tooltip>
          <el-tag v-if="tab.badge" size="small" type="warning" class="ml-2 badge">{{ tab.badge }}</el-tag>
        </span>
      </template>
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTabs, ElTabPane, ElTooltip, ElTag } from 'element-plus';
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
    ElTabs,
    ElTabPane,
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
    onUpdate(value: string | number) {
      if (value === 'avatar') return;
      this.$emit('update:modelValue', value as IKlingTaskType);
    }
  }
});
</script>

<style lang="scss" scoped>
.kling-tabs {
  padding: 0 16px;
  background-color: var(--app-content-bg);
  border-bottom: 1px solid var(--app-border-subtle);

  :deep(.el-tabs__header) {
    margin: 0;
    border-bottom: none;
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    height: 44px;
    line-height: 44px;
    font-size: 14px;
    padding: 0 16px;
  }

  .tab-label {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

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
    padding: 0 8px;

    :deep(.el-tabs__item) {
      height: 38px;
      line-height: 38px;
      font-size: 12px;
      padding: 0 10px;
    }
  }
}
</style>
