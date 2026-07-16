<template>
  <el-tabs :model-value="value" class="action-tabs" stretch @update:model-value="onUpdate">
    <el-tab-pane v-for="item in options" :key="item.value" :name="item.value" :label="item.label" />
  </el-tabs>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTabs, ElTabPane } from 'element-plus';
import { VEO_DEFAULT_ACTION } from '@/constants';
import { normalizeVeoConfigForAction, VeoAction } from '@/utils/veo/config';

export default defineComponent({
  name: 'ActionSelector',
  components: {
    ElTabs,
    ElTabPane
  },
  data() {
    return {};
  },
  computed: {
    options() {
      return [
        {
          value: 'text2video',
          label: this.$t('veo.button.action1')
        },
        {
          value: 'image2video',
          label: this.$t('veo.button.action2')
        },
        {
          value: 'ingredients2video',
          label: this.$t('veo.button.actionIngredients')
        }
      ];
    },
    value() {
      return this.$store.state.veo?.config?.action || VEO_DEFAULT_ACTION;
    }
  },
  mounted() {
    if (!this.$store.state.veo?.config?.action) {
      this.onUpdate(VEO_DEFAULT_ACTION);
    }
  },
  methods: {
    onUpdate(value: string | number) {
      this.$store.commit(
        'veo/setConfig',
        normalizeVeoConfigForAction(this.$store.state.veo?.config, value as VeoAction)
      );
    }
  }
});
</script>

<style lang="scss" scoped>
.action-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    height: 64px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__nav-scroll) {
    overflow: visible;
    height: 64px;
  }

  :deep(.el-tabs__nav) {
    width: 100%;
    height: 64px;
    transform: none !important;
  }

  :deep(.el-tabs__nav-wrap) {
    height: 64px;
  }

  :deep(.el-tabs__nav-prev),
  :deep(.el-tabs__nav-next) {
    display: none;
  }

  :deep(.el-tabs__active-bar) {
    display: none;
  }

  :deep(.el-tabs__item) {
    flex: 1;
    min-width: 0;
    height: 64px;
    padding: 0 6px;
    border-bottom: 2px solid transparent;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: 0;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    align-items: center;
    justify-content: center;
  }

  :deep(.el-tabs__item.is-active) {
    border-bottom-color: var(--el-color-primary);
  }
}
</style>
