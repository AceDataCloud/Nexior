<template>
  <div class="field">
    <div class="header">
      <h2 class="title font-bold">{{ $t('kling.name.motionModel') }}</h2>
      <info-icon :content="$t('kling.description.motionModel')" />
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

type IKlingMotionModel = 'kling-v2-6' | 'kling-v3';
const DEFAULT: IKlingMotionModel = 'kling-v2-6';

export default defineComponent({
  name: 'MotionModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  computed: {
    options() {
      return [
        { value: 'kling-v2-6', label: 'Kling 2.6' },
        { value: 'kling-v3', label: 'Kling 3.0' }
      ];
    },
    value: {
      get(): IKlingMotionModel {
        return this.$store.state.kling?.motionConfig?.model_name || DEFAULT;
      },
      set(val: IKlingMotionModel) {
        this.$store.commit('kling/setMotionConfig', {
          ...this.$store.state.kling?.motionConfig,
          model_name: val
        });
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.motionConfig?.model_name) {
      this.value = DEFAULT;
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

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 50%;

    .title {
      font-size: 14px;
      margin: 0;
    }
  }
  .value {
    width: 120px;
  }
}
</style>
