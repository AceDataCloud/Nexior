<template>
  <el-tabs
    :model-value="value"
    class="action-tabs scenario-tabs scenario-tabs--divided"
    stretch
    @update:model-value="onUpdate"
  >
    <el-tab-pane v-for="item in options" :key="item.value" :name="item.value">
      <template #label>
        <span class="tab-label">
          <span class="text">{{ item.label }}</span>
        </span>
      </template>
    </el-tab-pane>
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
// Mirror the shared Kling tab pattern so all scenario tab bars stay uniform:
// fixed 48px header (tight top/bottom) with a 2-line clamp for long locales
// (ru/ar) instead of a taller fixed height that leaves dead space above CJK.
// No horizontal padding here — unlike Kling's standalone header, this tab bar
// sits inside ConfigPanel's p-5 column and must align with the fields below.
.action-tabs {
  :deep(.el-tabs__item) {
    height: 48px;
    line-height: 16px;
    font-size: 13px;
    padding: 0 6px;
    white-space: normal;
  }

  .tab-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;

    .text {
      display: -webkit-box;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-align: center;
      overflow-wrap: anywhere;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
  }
}
</style>
