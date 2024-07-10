<template>
  <div class="field">
    <h2 class="type">{{ $t('suno.name.type') }}</h2>
    <el-switch v-model="custom" class="value" />
    <el-select v-model="model" class="value" :placeholder="$t('suno.placeholder.select')" style="width: 240px">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span style="float: left">{{ item.label }}</span>
        <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
          {{ item.description }}
        </span>
      </el-option>
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
          value: 'text',
          description: 'Newest model'
        },
        {
          label: this.$t('suno.type.link'),
          value: 'link',
          description: 'Newest model'
        },
        {
          label: this.$t('suno.type.email'),
          value: 'email',
          description: 'Newest model'
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

  .type {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
