<template>
  <el-tabs
    :model-value="modelValue"
    class="kling-tabs scenario-tabs scenario-tabs--divided"
    @update:model-value="onUpdate"
  >
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
  value: IKlingTaskType;
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
          value: 'talking-photo',
          label: this.$t('kling.tab.talkingPhoto')
        }
      ];
    }
  },
  methods: {
    onUpdate(value: string | number) {
      this.$emit('update:modelValue', value as IKlingTaskType);
    }
  }
});
</script>

<style lang="scss" scoped>
.kling-tabs {
  flex: none;
  // Match the p-5 (20px) side gutters of the panels below and add top breathing
  // room so the bar doesn't hug the panel's top edge. See `.scenario-tabs` in
  // _common.scss (first/last item padding is zeroed there to keep labels flush).
  padding: 12px 20px 0;
  background-color: var(--app-sidebar-bg);

  :deep(.el-tabs__item) {
    height: 38px;
    line-height: 38px;
    font-size: 13px;
    // Width follows each label with fixed 16px whitespace, so longer
    // locales (English) stay on one line; the nav scrolls if they overflow.
    padding: 0 16px;
    white-space: nowrap;
  }

  .tab-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;

    .text {
      overflow: hidden;
      text-align: center;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .badge {
      flex: none;
      margin-left: 4px;
      font-size: 9px;
      height: 16px;
      line-height: 14px;
      padding: 0 4px;
    }
  }
}
</style>
