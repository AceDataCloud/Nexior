<template>
  <div class="resolution">
    <div class="header">
      <h2 class="title font-bold">{{ $t('grokvideo.name.resolution') }}</h2>
      <info-icon :content="$t('grokvideo.description.resolution')" class="info" />
    </div>
    <div class="items">
      <div
        v-for="item in options"
        :key="item.value"
        class="item"
        :class="{ active: value === item.value }"
        @click="value = item.value"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  GROKVIDEO_DEFAULT_RESOLUTION,
  GROKVIDEO_RESOLUTION_480P,
  GROKVIDEO_RESOLUTION_720P,
  GROKVIDEO_RESOLUTION_1080P
} from '@/constants';

export default defineComponent({
  name: 'GrokVideoResolutionSelector',
  components: {
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: GROKVIDEO_RESOLUTION_480P, label: '480p' },
        { value: GROKVIDEO_RESOLUTION_720P, label: '720p' },
        { value: GROKVIDEO_RESOLUTION_1080P, label: '1080p' }
      ]
    };
  },
  computed: {
    value: {
      get(): string | undefined {
        return this.$store.state.grokvideo?.config?.resolution;
      },
      set(val: string) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
          resolution: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = GROKVIDEO_DEFAULT_RESOLUTION;
    }
  }
});
</script>

<style lang="scss" scoped>
.resolution {
  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;

    .title {
      font-size: 14px;
      margin: 0;
    }

    .info {
      margin-left: 6px;
    }
  }

  .items {
    display: flex;
    flex-direction: row;
    gap: 8px;

    .item {
      flex: 1;
      text-align: center;
      padding: 8px 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease,
        color 0.15s ease;
      background-color: var(--el-fill-color-lighter);

      &:hover {
        background-color: var(--el-fill-color);
        border-color: var(--el-border-color-hover);
      }

      &.active {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }
}
</style>
