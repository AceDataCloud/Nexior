<template>
  <el-tabs :model-value="value" class="action-tabs scenario-tabs scenario-tabs--divided" @update:model-value="onUpdate">
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
// Width follows each label with fixed 16px whitespace so long locales stay on
// one line; the nav scrolls horizontally if all tabs together overflow. This
// tab bar sits inside ConfigPanel's p-5 column, so the wrapper adds no padding.
.action-tabs {
  :deep(.el-tabs__item) {
    height: 38px;
    line-height: 38px;
    font-size: 13px;
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
  }
}
</style>
