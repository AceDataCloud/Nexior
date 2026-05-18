<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.ratio') }}</h2>
        <info-icon :content="$t('seedance.description.ratio')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('seedance.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  SEEDANCE_DEFAULT_RATIO,
  SEEDANCE_RATIO_16_9,
  SEEDANCE_RATIO_4_3,
  SEEDANCE_RATIO_1_1,
  SEEDANCE_RATIO_3_4,
  SEEDANCE_RATIO_9_16,
  SEEDANCE_RATIO_21_9,
  SEEDANCE_RATIO_ADAPTIVE
} from '@/constants';

export default defineComponent({
  name: 'SeedanceRatioSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  computed: {
    options() {
      return [
        { value: SEEDANCE_RATIO_16_9, label: '16:9' },
        { value: SEEDANCE_RATIO_9_16, label: '9:16' },
        { value: SEEDANCE_RATIO_4_3, label: '4:3' },
        { value: SEEDANCE_RATIO_3_4, label: '3:4' },
        { value: SEEDANCE_RATIO_1_1, label: '1:1' },
        { value: SEEDANCE_RATIO_21_9, label: '21:9' },
        { value: SEEDANCE_RATIO_ADAPTIVE, label: this.$t('seedance.ratio.adaptive') }
      ];
    },
    value: {
      get(): string | undefined {
        return this.$store.state.seedance?.config?.ratio;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_RATIO;
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
    width: 130px;
  }
}
</style>
