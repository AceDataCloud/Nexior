<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('kling.name.model') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('kling.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { KLING_TALKING_PHOTO_MODELS, KLING_TALKING_PHOTO_DEFAULT_MODEL } from '@/constants';

const LABELS: Record<string, string> = {
  'kling-v2-6': 'v2.6',
  'kling-v2-5-turbo': 'v2.5-Turbo',
  'kling-v2-1-master': 'v2.1-Master',
  'kling-v2-master': 'v2-Master',
  'kling-v1-6': 'v1.6',
  'kling-v1': 'v1'
};

export default defineComponent({
  name: 'TalkingPhotoModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: KLING_TALKING_PHOTO_MODELS.map((value) => ({ value, label: LABELS[value] || value }))
    };
  },
  computed: {
    value: {
      get(): string {
        return this.$store.state.kling?.talkingPhotoConfig?.model || KLING_TALKING_PHOTO_DEFAULT_MODEL;
      },
      set(val: string) {
        this.$store.commit('kling/setTalkingPhotoConfig', {
          ...this.$store.state.kling?.talkingPhotoConfig,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.talkingPhotoConfig?.model) {
      this.value = KLING_TALKING_PHOTO_DEFAULT_MODEL;
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
