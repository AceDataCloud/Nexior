<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')" :disabled="isModelLocked">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_MODEL } from '@/constants';
import { VEO_GENERATION_MODELS, VEO_INGREDIENTS_MODEL } from '@/utils/veo/config';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    isModelLocked() {
      return this.$store.state.veo?.config?.action === 'ingredients2video';
    },
    options() {
      if (this.isModelLocked) {
        return [{ value: VEO_INGREDIENTS_MODEL, label: 'Veo 3.1 Fast' }];
      }
      return VEO_GENERATION_MODELS;
    },
    value: {
      get() {
        return this.$store.state.veo?.config?.model;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_MODEL;
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
    flex: 1;
  }
}
</style>
