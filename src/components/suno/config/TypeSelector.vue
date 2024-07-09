<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.type') }}</h2>
    <el-switch v-model="value" class="value" />
    <el-select v-model="value" class="value" :placeholder="$t('suno.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import { SUNO_DEFAULT_TYPE } from '@/constants';

export default defineComponent({
  name: 'VersionSelector',
  components: {
    ElSelect,
    ElOption,
    ElSwitch
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
          label: this.$t('suno.type.text'),
          value: 'text'
        },
        {
          label: this.$t('suno.type.link'),
          value: 'link'
        },
        {
          label: this.$t('suno.type.email'),
          value: 'email'
        },
        {
          label: this.$t('suno.type.phone'),
          value: 'phone'
        },
        {
          label: this.$t('suno.type.sms'),
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
      console.debug('set default type', SUNO_DEFAULT_TYPE);
      this.value = SUNO_DEFAULT_TYPE;
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
