<template>
  <div class="field">
    <h2 class="title">{{ $t('midjourney.name.translation') }}</h2>
    <el-switch v-model="value" class="value" />
    <info-icon :content="$t('midjourney.description.translation')" class="info" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT_TRANSLATION = true;

export default defineComponent({
  name: 'TranslationSelector',
  components: {
    ElSwitch,
    InfoIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.translation;
      },
      set(val: boolean) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          translation: val
        });
      }
    }
  },
  mounted() {
    if (this.value === undefined) {
      this.value = DEFAULT_TRANSLATION;
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
