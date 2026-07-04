<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('flux.name.ratio') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('flux.placeholder.select')">
      <el-option v-for="item in options" :key="item" :label="item" :value="item" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { FLUX_ASPECT_RATIOS, FLUX_DEFAULT_SIZE } from '@/constants';

export default defineComponent({
  name: 'SizeSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: FLUX_ASPECT_RATIOS
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux?.config?.size;
      },
      set(val: string) {
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux?.config,
          size: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = FLUX_DEFAULT_SIZE;
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
