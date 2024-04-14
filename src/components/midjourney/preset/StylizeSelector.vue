<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.stylize') }}</h2>
    <el-slider v-model="value" :min="0" :max="1000" :step="1" class="value" />
    <info-icon :content="$t('midjourney.description.stylize')" class="info" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSlider } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { MIDJOURNEY_DEFAULT_STYLIZE } from '@/constants';

export default defineComponent({
  name: 'StylizeSelector',
  components: {
    ElSlider,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.preset?.stylize;
      },
      set(val) {
        console.debug('set stylize', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          stylize: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_STYLIZE;
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
