<template>
  <div v-if="supported" class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('seedream.name.outputFormat') }}</h2>
        <info-icon :content="$t('seedream.description.outputFormat')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('seedream.placeholder.select')">
      <el-option v-for="item in options" :key="item" :label="item.toUpperCase()" :value="item" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { SEEDREAM_OUTPUT_FORMATS } from '@/constants';
import { getSeedreamCapabilities } from '@/utils/seedream/capabilities';

export default defineComponent({
  name: 'SeedreamOutputFormatSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [...SEEDREAM_OUTPUT_FORMATS]
    };
  },
  computed: {
    config(): any {
      return this.$store.state.seedream?.config || {};
    },
    supported(): boolean {
      return getSeedreamCapabilities(this.config?.model).outputFormat;
    },
    value: {
      get(): string | undefined {
        return this.config?.output_format;
      },
      set(val: string) {
        const cfg = { ...(this.config || {}) };
        cfg.output_format = val;
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
  }
}
</style>
