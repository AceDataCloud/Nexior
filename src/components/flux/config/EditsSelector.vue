<template>
  <div class="field">
    <h2 class="title">{{ $t('flux.name.isEdits') }}</h2>
    <el-switch v-model="value" class="value" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';

const DEFAULT_IS_EDITS = false;

export default defineComponent({
  name: 'EditsSelector',
  components: {
    ElSwitch
  },
  computed: {
    value: {
      get() {
        return this.$store.state.flux?.config?.is_edits;
      },
      set(val: boolean) {
        console.debug('set action', val);
        this.$store.commit('flux/setConfig', {
          ...this.$store.state.flux.config,
          is_edits: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = DEFAULT_IS_EDITS;
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
  .info {
    width: 20px;
  }
}
</style>
