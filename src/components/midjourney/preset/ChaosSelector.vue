<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.chaos') }}</h2>
    <el-slider v-model="value" :min="0" :max="100" :step="1" class="value" />
    <info-icon :content="$t('midjourney.description.chaos')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT_CHAOS = 0;

export default defineComponent({
  name: 'ChaosSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.preset?.chaos;
      },
      set(val) {
        console.debug('set quality', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          chaos: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_CHAOS;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

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
