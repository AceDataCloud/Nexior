<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.type') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('qrart.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { QRART_DEFAULT_TYPE } from '@/constants';

export default defineComponent({
  name: 'VersionSelector',
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
          label: this.$t('qrart.type.text'),
          value: 'text'
        },
        {
          label: this.$t('qrart.type.link'),
          value: 'link'
        },
        {
          label: this.$t('qrart.type.email'),
          value: 'email'
        },
        {
          label: this.$t('qrart.type.phone'),
          value: 'phone'
        },
        {
          label: this.$t('qrart.type.sms'),
          value: 'sms'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.type;
      },
      set(val) {
        console.debug('set type', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          type: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      console.debug('set default type', QRART_DEFAULT_TYPE);
      this.value = QRART_DEFAULT_TYPE;
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
