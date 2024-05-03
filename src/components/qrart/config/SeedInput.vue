<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.seed') }}</h2>
    <el-input v-model="value" class="value" :placeholder="$t('qrart.placeholder.seed')" />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';

export default defineComponent({
  name: 'SeedInput',
  components: {
    ElInput
  },
  data() {
    return {};
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.seed;
      },
      set(val) {
        console.debug('set seed', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          seed: val ? parseInt(val) : undefined
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
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
