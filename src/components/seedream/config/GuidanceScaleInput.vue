<template>
  <div v-if="supported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.guidanceScale') }}</h2>
        <info-icon :content="$t('seedream.description.guidanceScale')" class="info" />
      </div>
    </div>
    <div class="value">
      <el-input-number
        v-model="value"
        :min="1"
        :max="10"
        :step="0.1"
        :precision="1"
        size="default"
        controls-position="right"
        class="counter"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_GUIDANCE_SCALE_DEFAULTS, supportsSeedreamGuidanceScale } from '@/constants';

export default defineComponent({
  name: 'SeedreamGuidanceScaleInput',
  components: {
    ElInputNumber,
    InfoIcon
  },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    supported(): boolean {
      return supportsSeedreamGuidanceScale(this.config?.model);
    },
    defaultValue(): number {
      const m: string | undefined = this.config?.model;
      return (m && SEEDREAM_GUIDANCE_SCALE_DEFAULTS[m]) || 2.5;
    },
    value: {
      get(): number {
        const v = this.config?.guidance_scale;
        return typeof v === 'number' ? v : this.defaultValue;
      },
      set(val: number) {
        const cfg = { ...(this.config || {}) };
        const next = typeof val === 'number' && val >= 1 && val <= 10 ? val : this.defaultValue;
        cfg.guidance_scale = next;
        this.$store.commit('seedream/setConfig', cfg);
      }
    }
  },
  watch: {
    supported: {
      immediate: true,
      handler(v: boolean) {
        if (v) return;
        const cfg = { ...(this.config || {}) };
        if (cfg.guidance_scale !== undefined) {
          delete cfg.guidance_scale;
          this.$store.commit('seedream/setConfig', cfg);
        }
      }
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
    display: flex;
    justify-content: flex-end;

    .counter {
      width: 140px;
    }
  }
}
</style>
