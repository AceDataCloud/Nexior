<template>
  <div
    class="image w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden shadow-sm bg-[var(--el-fill-color-lighter)]"
  >
    <img class="w-full h-full object-cover cursor-zoom-in" :src="url" :alt="name" @click.stop="onPreview" />
    <el-image-viewer v-if="showViewer" :url-list="[url]" teleported hide-on-click-modal @close="showViewer = false" />
    <div v-show="isUploading" class="overlay absolute inset-0 bg-[var(--el-mask-color)] backdrop-blur-[1px]"></div>
    <el-progress
      v-show="isUploading"
      type="circle"
      :stroke-width="4"
      :percentage="displayPercentage"
      :width="34"
      class="absolute inset-0 z-[10] flex items-center justify-center text-[12px]"
    />
    <button
      v-if="closable"
      type="button"
      class="close absolute cursor-pointer top-[4px] right-[4px] bg-[rgba(0,0,0,0.65)] text-white w-[16px] h-[16px] rounded-full flex text-[10px] text-center items-center justify-center hover:bg-[rgba(0,0,0,0.8)]"
      :aria-label="$t('common.button.close')"
      :title="$t('common.button.close')"
      @click.stop="$emit('remove')"
    >
      <close-icon class="icon icon-close" :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
  </div>
</template>

<script lang="ts">
import { CloseIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElProgress, ElImageViewer } from 'element-plus';

export default defineComponent({
  name: 'ImagePreview',
  components: {
    CloseIcon,
    ElProgress,
    ElImageViewer
  },
  props: {
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: false,
      default: undefined
    },
    closable: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  emits: ['remove'],
  data() {
    return {
      showViewer: false
    };
  },
  computed: {
    isUploading(): boolean {
      return typeof this.percentage === 'number' && this.percentage < 100;
    },
    displayPercentage(): number {
      return typeof this.percentage === 'number' ? this.percentage : 0;
    }
  },
  methods: {
    onPreview(): void {
      if (this.isUploading || !this.url) {
        return;
      }
      this.showViewer = true;
    }
  }
});
</script>
