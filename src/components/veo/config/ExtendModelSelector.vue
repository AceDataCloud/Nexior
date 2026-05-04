<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_EXTEND_MODEL, VEO_EXTEND_MODELS } from '@/constants';

// Subset of model picker that only exposes the veo31 series — the only
// models the upstream provider supports for /veo/extend.
export default defineComponent({
  name: 'ExtendModelSelector',
  components: { ElSelect, ElOption },
  computed: {
    options() {
      return VEO_EXTEND_MODELS.map((v) => ({ value: v, label: v }));
    },
    value: {
      get() {
        return this.$store.state.veo?.config?.model;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value || !(VEO_EXTEND_MODELS as readonly string[]).includes(this.value)) {
      this.value = VEO_DEFAULT_EXTEND_MODEL;
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
