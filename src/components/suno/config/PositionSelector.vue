<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.position') }}</h2>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.position')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { QRART_DEFAULT_POSITION } from '@/constants';
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
          value: 'center',
          label: this.$t('qrart.position.center')
        },
        {
          value: 'top',
          label: this.$t('qrart.position.top')
        },
        {
          value: 'right',
          label: this.$t('qrart.position.right')
        },
        {
          value: 'bottom',
          label: this.$t('qrart.position.bottom')
        },
        {
          value: 'left',
          label: this.$t('qrart.position.left')
        },
        {
          value: 'top-left',
          label: this.$t('qrart.position.topLeft')
        },
        {
          value: 'top-right',
          label: this.$t('qrart.position.topRight')
        },
        {
          value: 'bottom-left',
          label: this.$t('qrart.position.bottomLeft')
        },
        {
          value: 'bottom-right',
          label: this.$t('qrart.position.bottomRight')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.position;
      },
      set(val) {
        console.debug('set position', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          position: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_POSITION;
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
