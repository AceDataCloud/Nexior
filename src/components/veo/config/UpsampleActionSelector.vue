<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.upsampleAction') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_UPSAMPLE_ACTION, VEO_UPSAMPLE_ACTIONS } from '@/constants';

export default defineComponent({
  name: 'UpsampleActionSelector',
  components: { ElSelect, ElOption },
  computed: {
    options() {
      return VEO_UPSAMPLE_ACTIONS.map((v) => ({ value: v, label: v }));
    },
    value: {
      get() {
        return this.$store.state.veo?.config?.upsample_action;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          upsample_action: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_UPSAMPLE_ACTION;
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
