<template>
  <div class="field">
    <h2 class="title">{{ $t('headshots.name.mode') }}</h2>
    <el-radio-group v-model="value" size="small" class="mode">
      <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
        {{ item.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';

export const DEFAULT_MODE = 'fast';

export default defineComponent({
  name: 'ModeSelector',
  components: {
    ElRadioButton,
    ElRadioGroup
  },
  data() {
    return {
      options: [
        {
          label: this.$t('headshots.button.fast'),
          value: 'fast'
        },
        {
          label: this.$t('headshots.button.relax'),
          value: 'relax'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.headshots.config?.mode;
      },
      set(val) {
        console.debug('set mode', val);
        this.$store.commit('headshots/setConfig', {
          ...this.$store.state.headshots.config,
          mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_MODE;
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

<style lang="scss">
.mode {
  .el-radio-button--small .el-radio-button__inner {
    padding: 8px 11px;
  }
}
</style>
