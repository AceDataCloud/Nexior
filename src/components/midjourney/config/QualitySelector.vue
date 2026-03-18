<template>
  <div class="field">
    <span class="text-sm font-bold">{{ $t('midjourney.name.quality') }}</span>
    <el-radio-group v-model="value" size="small" class="quality">
      <el-radio-button v-for="item in options" :key="item.value" :label="item.value">
        {{ item.label }}
      </el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRadioButton, ElRadioGroup } from 'element-plus';
import { MIDJOURNEY_DEFAULT_QUALITY } from '@/constants';

export default defineComponent({
  name: 'QualitySelector',
  components: {
    ElRadioButton,
    ElRadioGroup
  },
  computed: {
    version(): string {
      return this.$store.state.midjourney.config.version || '';
    },
    isV8(): boolean {
      return this.version === '8';
    },
    options() {
      if (this.isV8) {
        return [
          { label: this.$t('midjourney.button.standard'), value: '1' },
          { label: this.$t('midjourney.button.ultra'), value: '4' }
        ];
      }
      return [
        { label: this.$t('midjourney.button.low'), value: '.25' },
        { label: this.$t('midjourney.button.medium'), value: '.5' },
        { label: this.$t('midjourney.button.high'), value: '1' }
      ];
    },
    value: {
      get() {
        return this.$store.state.midjourney.config.quality;
      },
      set(val: string) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          quality: val
        });
      }
    }
  },
  watch: {
    isV8(newVal) {
      if (newVal && this.value !== '1' && this.value !== '4') {
        this.value = MIDJOURNEY_DEFAULT_QUALITY;
      } else if (!newVal && this.value === '4') {
        this.value = MIDJOURNEY_DEFAULT_QUALITY;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = MIDJOURNEY_DEFAULT_QUALITY;
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
