<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('nanobanana.name.model') }}</h2>
        <info-icon :content="modelDescription" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import {
  NANOBANANA_DEFAULT_MODEL,
  NANOBANANA_MODEL_NANO_BANANA,
  NANOBANANA_MODEL_NANO_BANANA_PRO,
  NANOBANANA_MODEL_NANO_BANANA_2
} from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'NanobananaModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: NANOBANANA_MODEL_NANO_BANANA,
          label: this.$t('nanobanana.model.nanoBanana')
        },
        {
          value: NANOBANANA_MODEL_NANO_BANANA_PRO,
          label: this.$t('nanobanana.model.nanoBananaPro')
        },
        {
          value: NANOBANANA_MODEL_NANO_BANANA_2,
          label: this.$t('nanobanana.model.nanoBanana2')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.model;
      },
      set(val: string) {
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana?.config,
          model: val
        });
      }
    },
    modelDescription(): string {
      return this.$t('nanobanana.description.model');
    }
  },
  mounted() {
    if (!this.value) {
      this.value = NANOBANANA_DEFAULT_MODEL;
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
