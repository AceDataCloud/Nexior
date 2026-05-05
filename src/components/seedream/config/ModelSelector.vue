<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.model') }}</h2>
        <info-icon :content="$t('seedream.description.model')" class="info" />
      </div>
    </div>
    <el-select
      :key="revertKey"
      :model-value="value"
      class="value"
      :placeholder="$t('seedream.placeholder.select')"
      @change="onChange"
    >
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  SEEDREAM_DEFAULT_MODEL,
  SEEDREAM_MODEL_3_0_T2I,
  SEEDREAM_MODEL_4_0,
  SEEDREAM_MODEL_4_5,
  SEEDREAM_MODEL_5_0,
  SEEDREAM_MODEL_SEEDEDIT_3_0_I2I
} from '@/constants';
import { findSeedreamConflicts, clearSeedreamConflicts } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      // Bumped to force el-select to re-render and revert its internal display
      // when the user cancels a model switch.
      revertKey: 0,
      options: [
        { value: SEEDREAM_MODEL_5_0, label: this.$t('seedream.model.seedream50') },
        { value: SEEDREAM_MODEL_4_5, label: this.$t('seedream.model.seedream45') },
        { value: SEEDREAM_MODEL_4_0, label: this.$t('seedream.model.seedream40') },
        { value: SEEDREAM_MODEL_3_0_T2I, label: this.$t('seedream.model.seedream30t2i') },
        { value: SEEDREAM_MODEL_SEEDEDIT_3_0_I2I, label: this.$t('seedream.model.seededit30i2i') }
      ]
    };
  },
  computed: {
    value(): string | undefined {
      return this.$store.state.seedream?.config?.model;
    }
  },
  mounted() {
    if (!this.value) {
      this.applyModel(SEEDREAM_DEFAULT_MODEL);
    }
  },
  methods: {
    async onChange(val: string) {
      const config = this.$store.state.seedream?.config || {};
      const conflicts = findSeedreamConflicts(config, { model: val });
      if (conflicts.length === 0) {
        this.applyModel(val);
        return;
      }
      const fields = conflicts.map((c) => this.$t(c.i18nLabel)).join('、');
      try {
        await ElMessageBox.confirm(
          this.$t('seedream.message.featureNotSupportedBody', { fields }),
          this.$t('seedream.message.featureNotSupportedTitle'),
          {
            confirmButtonText: this.$t('seedream.button.confirmContinue'),
            cancelButtonText: this.$t('seedream.button.cancelSwitch'),
            type: 'warning'
          }
        );
        const cleared = clearSeedreamConflicts({ ...config, model: val }, conflicts, { model: val });
        this.$store.commit('seedream/setConfig', cleared);
        ElMessage.success(this.$t('seedream.message.featureRemovedNotice', { fields }));
      } catch {
        // User cancelled — force el-select to repaint with the current store value.
        this.revertKey += 1;
      }
    },
    applyModel(val: string) {
      this.$store.commit('seedream/setConfig', {
        ...this.$store.state.seedream?.config,
        model: val
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
  }
}
</style>
