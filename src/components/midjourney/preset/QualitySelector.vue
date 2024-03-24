<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.quality') }}</h2>
    <el-radio-group v-model="value" size="small" class="quality">
      <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
        {{ item.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';

export const DEFAULT_QUALITY = '.5';

export default defineComponent({
  name: 'QualitySelector',
  components: {
    ElRadioButton,
    ElRadioGroup
  },
  data() {
    return {
      options: [
        {
          label: this.$t('midjourney.button.low'),
          value: '.25'
        },
        {
          label: this.$t('midjourney.button.medium'),
          value: '.5'
        },
        {
          label: this.$t('midjourney.button.high'),
          value: '1'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.preset?.quality;
      },
      set(val) {
        console.debug('set quality', val);
        this.$store.commit('midjourney/setPreset', {
          ...this.$store.state.midjourney.preset,
          quality: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_QUALITY;
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
.quality {
  .el-radio-button--small .el-radio-button__inner {
    padding: 8px 11px;
  }
}
</style>
