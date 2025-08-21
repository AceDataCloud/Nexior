<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('midjourney.name.resolution') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('midjourney.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { MIDJOURNEY_DEFAULT_RESOLUTION } from '@/constants';

export default defineComponent({
  name: 'ResolutionSelector',
  components: {
    ElSelect,
    ElOption
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        {
          value: '480',
          label: '480p'
        },
        {
          value: '720p',
          label: '720p'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('pixverse/setConfig', {
          ...this.$store.state.midjourney.config,
          resolution: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_RESOLUTION;
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
    width: 80px;
  }
}
</style>
