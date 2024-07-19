<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.type') }}</h2>
    <el-switch v-model="custom" class="value" />
    <el-select v-model="model" class="value" :placeholder="$t('suno.placeholder.select')" style="width: 3px">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElSwitch } from 'element-plus';
import { SUNO_DEFAULT_MODEL } from '@/constants';

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
          label: this.$t('suno.model.model_1'),
          value: this.$t('suno.value.model_1'),
          description: 'chirp-v2的模型'
        },
        {
          label: this.$t('suno.model.model_2'),
          value: this.$t('suno.value.model_2'),
          description: 'chirp-v3的模型'
        },
        {
          label: this.$t('suno.model.model_3'),
          value: this.$t('suno.value.model_3'),
          description: 'chirp-v3-5的模型'
        }
      ]
    };
  },
  computed: {
    custom: {
      get() {
        return this.$store.state.suno?.config?.custom;
      },
      set(val) {
        console.debug('set custom', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          custom: val
        });
      }
    },
    model: {
      get() {
        return this.$store.state.suno?.config?.model;
      },
      set(val) {
        console.debug('set model', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.model) {
      console.debug('set default type', SUNO_DEFAULT_MODEL);
      this.model = SUNO_DEFAULT_MODEL;
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
