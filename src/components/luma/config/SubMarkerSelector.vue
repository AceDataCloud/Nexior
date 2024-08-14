<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.subMarker') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.subMarker')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_SUB_MARKER } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'SubMarkerSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 'square',
          label: this.$t('qrart.subMarker.square')
        },
        {
          value: 'circle',
          label: this.$t('qrart.subMarker.circle')
        },
        {
          value: 'plus',
          label: this.$t('qrart.subMarker.plus')
        },
        {
          value: 'box',
          label: this.$t('qrart.subMarker.box')
        },
        {
          value: 'random',
          label: this.$t('qrart.subMarker.random')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.sub_marker;
      },
      set(val) {
        console.debug('set sub_marker', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          sub_marker: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_SUB_MARKER;
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
