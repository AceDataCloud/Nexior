<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('sora.name.action') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('sora.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { SORA_DEFAULT_ACTION } from '@/constants';

export default defineComponent({
  name: 'ActionSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {};
  },
  computed: {
    options() {
      return [
        {
          value: 'text2video',
          label: this.$t('sora.button.action1')
        },
        {
          value: 'image2video',
          label: this.$t('sora.button.action2')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.sora?.config?.action;
      },
      set(val: string) {
        this.$store.commit('sora/setConfig', {
          ...this.$store.state.sora?.config,
          action: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SORA_DEFAULT_ACTION;
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
