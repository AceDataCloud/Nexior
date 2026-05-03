<template>
  <el-tabs :model-value="modelValue" class="kling-tabs" stretch @update:model-value="onUpdate">
    <el-tab-pane v-for="tab in tabs" :key="tab.value" :name="tab.value" :disabled="tab.disabled">
      <template #label>
        <span class="tab-label" :title="tab.disabled ? tab.disabledReason : undefined">
          <span class="text">{{ tab.label }}</span>
          <el-tag v-if="tab.badge" size="small" type="warning" class="badge">{{ tab.badge }}</el-tag>
        </span>
      </template>
    </el-tab-pane>
  </el-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElTabs, ElTabPane, ElTag } from 'element-plus';
import { IKlingTaskType } from '@/models';

interface ITab {
  value: IKlingTaskType | 'avatar';
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string;
}

export default defineComponent({
  name: 'KlingTabSwitcher',
  components: {
    ElTabs,
    ElTabPane,
    ElTag
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
          label: this.$t('kling.tab.videoGeneration')
        },
        {
          value: 'motion',
          label: this.$t('kling.tab.motionControl')
        },
        {
          value: 'avatar',
          label: this.$t('kling.tab.avatar'),
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
  flex: none;
  padding: 0 8px;
  background-color: var(--app-sidebar-bg);

  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__item) {
    height: 38px;
    line-height: 38px;
    font-size: 13px;
    padding: 0 6px;
  }

  .tab-label {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;

    .text {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge {
      margin-left: 4px;
      font-size: 9px;
      height: 16px;
      line-height: 14px;
      padding: 0 4px;
    }
  }
}
</style>
