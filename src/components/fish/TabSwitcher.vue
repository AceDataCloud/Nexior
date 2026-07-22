<template>
  <el-tabs :model-value="active" class="fish-tabs scenario-tabs scenario-tabs--divided" @update:model-value="onUpdate">
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
  // Match the p-5 (20px) side gutters of the panels below and add top breathing
  // room so the bar doesn't hug the panel's top edge. See `.scenario-tabs` in
  // _common.scss (first/last item padding is zeroed there to keep labels flush).
  padding: 12px 20px 0;
  background-color: var(--app-sidebar-bg);

  :deep(.el-tabs__item) {
    height: 38px;
    line-height: 38px;
    font-size: 13px;
    // Width follows the label with fixed whitespace; no wrap.
    padding: 0 16px;
    white-space: nowrap;
  }
}
</style>
