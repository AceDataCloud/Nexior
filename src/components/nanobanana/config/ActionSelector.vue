<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('nanobanana.name.task') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { NANOBANANA_DEFAULT_ACTION } from '@/constants';

export default defineComponent({
  name: 'ActionSelector',
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
          value: 'generate',
          label: this.$t('nanobanana.name.generate')
        },
        {
          value: 'edit',
          label: this.$t('nanobanana.name.edits')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.action;
      },
      set(val: string) {
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana.config,
          action: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = NANOBANANA_DEFAULT_ACTION;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }

  .value {
    width: 160px;
  }
}
</style>

