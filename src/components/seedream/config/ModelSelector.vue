<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.model') }}</h2>
        <info-icon :content="$t('seedream.description.model')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('seedream.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  SEEDREAM_DEFAULT_MODEL,
  SEEDREAM_MODEL_3_0_T2I,
  SEEDREAM_MODEL_4_0,
  SEEDREAM_MODEL_4_5,
  SEEDREAM_MODEL_SEEDEDIT_3_0_I2I
} from '@/constants';

export default defineComponent({
  name: 'SeedreamModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: SEEDREAM_MODEL_4_5,
          label: this.$t('seedream.model.seedream45')
        },
        {
          value: SEEDREAM_MODEL_4_0,
          label: this.$t('seedream.model.seedream40')
        },
        {
          value: SEEDREAM_MODEL_3_0_T2I,
          label: this.$t('seedream.model.seedream30t2i')
        },
        {
          value: SEEDREAM_MODEL_SEEDEDIT_3_0_I2I,
          label: this.$t('seedream.model.seededit30i2i')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.seedream?.config?.model;
      },
      set(val: string) {
        this.$store.commit('seedream/setConfig', {
          ...this.$store.state.seedream?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SEEDREAM_DEFAULT_MODEL;
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

