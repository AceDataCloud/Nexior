<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('nanobanana.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { NANOBANANA_DEFAULT_MODEL, NANOBANANA_MODEL_NANO_BANANA, NANOBANANA_MODEL_NANO_BANANA_PRO } from '@/constants';

export default defineComponent({
  name: 'NanobananaModelSelector',
  components: {
    ElSelect,
    ElOption
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

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }

  .value {
    width: 160px;
  }
}
</style>
