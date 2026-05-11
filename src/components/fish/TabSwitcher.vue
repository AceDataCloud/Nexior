<template>
  <el-tabs :model-value="active" class="fish-tabs" stretch @update:model-value="onUpdate">
    <el-tab-pane :label="$t('fish.tab.tts')" :name="ROUTE_FISH_TTS_INDEX" />
    <el-tab-pane :label="$t('fish.tab.model')" :name="ROUTE_FISH_MODEL_INDEX" />
  </el-tabs>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTabs, ElTabPane } from 'element-plus';
import { ROUTE_FISH_TTS_INDEX, ROUTE_FISH_MODEL_INDEX } from '@/router/constants';

export default defineComponent({
  name: 'FishTabSwitcher',
  components: {
    ElTabs,
    ElTabPane
  },
  data() {
    return {
      ROUTE_FISH_TTS_INDEX,
      ROUTE_FISH_MODEL_INDEX
    };
  },
  computed: {
    active(): string {
      const name = (this.$route?.name as string) || '';
      if (name === ROUTE_FISH_MODEL_INDEX) return ROUTE_FISH_MODEL_INDEX;
      return ROUTE_FISH_TTS_INDEX;
    }
  },
  methods: {
    onUpdate(name: string | number) {
      const target = String(name);
      if (target === this.active) return;
      this.$router.push({ name: target });
    }
  }
});
</script>

<style lang="scss" scoped>
.fish-tabs {
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
    padding: 0 12px;
  }
}
</style>
