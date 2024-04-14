<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.imageWeight') }}</h2>
    <el-slider v-model="value" :min="0" :max="2" :step="0.1" class="value" />
    <info-icon :content="$t('midjourney.description.imageWeight')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { MIDJOURNEY_DEFAULT_IMAGE_WEIGHT } from '@/constants';

export default defineComponent({
  name: 'ImageWeightSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.preset?.iw;
      },
      set(val) {
        console.debug('set iw', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          iw: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_IMAGE_WEIGHT;
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
