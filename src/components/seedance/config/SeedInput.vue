<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.seed') }}</h2>
        <info-icon :content="$t('seedance.description.seed')" class="info" />
      </div>
    </div>
    <el-input-number
      v-model="value"
      class="value"
      :min="-1"
      :max="2147483647"
      :step="1"
      step-strictly
      :placeholder="$t('seedance.placeholder.seed')"
      :controls="false"
      clearable
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInputNumber } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'SeedanceSeedInput',
  components: {
    ElInputNumber,
    InfoIcon
  },
  computed: {
    value: {
      get(): number | undefined {
        return this.$store.state.seedance?.config?.seed;
      },
      set(val: number | undefined) {
        const next = { ...this.$store.state.seedance?.config };
        if (typeof val === 'number' && !Number.isNaN(val)) {
          next.seed = val;
        } else {
          delete next.seed;
        }
        this.$store.commit('seedance/setConfig', next);
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
    width: 140px;
  }
}
</style>
