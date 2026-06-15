<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('kling.name.mode') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { KLING_TALKING_PHOTO_DEFAULT_MODE } from '@/constants';

export default defineComponent({
  name: 'TalkingPhotoModeSelector',
  components: {
    ElSelect,
    ElOption
  },
  computed: {
    options() {
      return [
        { value: 'std', label: this.$t('kling.name.modeStd') },
        { value: 'pro', label: this.$t('kling.name.modePro') }
      ];
    },
    value: {
      get(): 'std' | 'pro' {
        return this.$store.state.kling?.talkingPhotoConfig?.mode || KLING_TALKING_PHOTO_DEFAULT_MODE;
      },
      set(val: 'std' | 'pro') {
        this.$store.commit('kling/setTalkingPhotoConfig', {
          ...this.$store.state.kling?.talkingPhotoConfig,
          mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.talkingPhotoConfig?.mode) {
      this.value = KLING_TALKING_PHOTO_DEFAULT_MODE;
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
    width: 160px;
  }
}
</style>
