<template>
  <div class="field">
    <el-switch v-model="instrumental" class="value mr-2" />
    <h2 class="title inline-block">{{ $t('suno.name.instrumental') }}</h2>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';

export const DEFAULT_INSTRUMENTAL = false;

export default defineComponent({
  name: 'InstrumentSwitch',
  components: {
    ElSwitch
  },
  data() {
    return {};
  },
  computed: {
    instrumental: {
      get() {
        return this.$store.state.suno?.config?.instrumental;
      },
      set(val) {
        console.debug('set instrumental', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          instrumental: val
        });
      }
    }
  },
  mounted() {
    if (this.instrumental === undefined) {
      this.instrumental = DEFAULT_INSTRUMENTAL;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 120px;

  .title {
    font-size: 14px;
    margin: 0;
    flex: 1;
  }

  .value {
    width: 50px;
  }
}
</style>
