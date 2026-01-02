<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedance.name.model') }}</h2>
        <info-icon :content="$t('seedance.description.model')" class="info" />
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
  SEEDANCE_DEFAULT_MODEL,
  SEEDANCE_MODEL_1_0_LITE_I2V,
  SEEDANCE_MODEL_1_0_LITE_T2V,
  SEEDANCE_MODEL_1_0_PRO,
  SEEDANCE_MODEL_1_0_PRO_FAST,
  SEEDANCE_MODEL_1_5_PRO
} from '@/constants';

export default defineComponent({
  name: 'SeedanceModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: SEEDANCE_MODEL_1_0_PRO, label: this.$t('seedance.model.seedance10pro') },
        { value: SEEDANCE_MODEL_1_0_PRO_FAST, label: this.$t('seedance.model.seedance10proFast') },
        { value: SEEDANCE_MODEL_1_5_PRO, label: this.$t('seedance.model.seedance15pro') },
        { value: SEEDANCE_MODEL_1_0_LITE_T2V, label: this.$t('seedance.model.seedance10liteT2v') },
        { value: SEEDANCE_MODEL_1_0_LITE_I2V, label: this.$t('seedance.model.seedance10liteI2v') }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.seedance?.config?.model;
      },
      set(val: string) {
        this.$store.commit('seedance/setConfig', {
          ...this.$store.state.seedance?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDANCE_DEFAULT_MODEL;
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

