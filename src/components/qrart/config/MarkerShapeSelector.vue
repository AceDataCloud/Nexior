<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.markerShape') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.markerShape')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_MARKER_SHAPE } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'MarkerShapeSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 'square',
          label: this.$t('qrart.markerShape.square')
        },
        {
          value: 'circle',
          label: this.$t('qrart.markerShape.circle')
        },
        {
          value: 'plus',
          label: this.$t('qrart.markerShape.plus')
        },
        {
          value: 'box',
          label: this.$t('qrart.markerShape.box')
        },
        {
          value: 'octagon',
          label: this.$t('qrart.markerShape.octagon')
        },
        {
          value: 'tiny-plus',
          label: this.$t('qrart.markerShape.tinyPlus')
        },
        {
          value: 'random',
          label: this.$t('qrart.markerShape.random')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.marker_shape;
      },
      set(val) {
        console.debug('set marker_shape', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          marker_shape: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_MARKER_SHAPE;
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
