<template>
  <div v-if="supported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.seed') }}</h2>
        <info-icon :content="$t('seedream.description.seed')" class="info" />
      </div>
    </div>
    <div class="value">
      <el-input-number
        v-model="value"
        :min="-1"
        :max="2147483647"
        :step="1"
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
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamSeedInput',
  components: {
    ElInputNumber,
    InfoIcon
  },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    supported(): boolean {
      return getSeedreamCapabilities(this.config?.model).seed;
    },
    value: {
      get(): number {
        const v = this.config?.seed;
        return typeof v === 'number' ? v : -1;
      },
      set(val: number) {
        const cfg = { ...(this.config || {}) };
        const next = typeof val === 'number' && Number.isInteger(val) ? val : -1;
        cfg.seed = next;
        this.$store.commit('seedream/setConfig', cfg);
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
