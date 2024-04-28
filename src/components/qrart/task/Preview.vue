<template>
  <div class="preview">
    <el-image
      v-if="modelValue?.response"
      v-loading="!modelValue?.response?.image_url"
      :src="modelValue?.response?.image_url"
      fit="contain"
      class="image"
    />
    <el-image v-else class="image error">
      <template #error>
        <div class="image-slot">{{ $t('qrart.message.generating') }}</div>
      </template>
    </el-image>
    <p class="prompt">
      {{ modelValue?.request?.prompt }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';
import { IQrartTask } from '@/models';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage
  },
  props: {
    modelValue: {
      type: Object as () => IQrartTask | undefined,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.qrart?.application;
    }
  },
  methods: {
    onReload(event: Event) {
      const target = event.target as HTMLImageElement;
      // append a random url query to existing url query, to force reload the image
      // extract exiting url query
      const url = new URL(target.src);
      // extract `retry` query
      const retry = url.searchParams.get('retry');
      if (!retry) {
        // if no retry query, set it as random string
        url.searchParams.set('retry', '1');
      } else if (parseInt(retry) < 2) {
        // if retry < 3, increase it by 1
        url.searchParams.set('retry', (parseInt(retry) + 1).toString());
      } else {
        return;
      }
      // set the new url
      target.src = url.toString();
    },
    onDownload(url: string) {
      // download image using javascript
      const link = document.createElement('a');
      link.href = url;
      link.download = url.split('/').pop() as string;
      link.click();
    }
  }
});
</script>

<style lang="scss" scoped>
.preview {
  width: 250px;
  height: 280px;
  padding: 15px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  border-radius: 15px;
  .image {
    width: 220px;
    height: 220px;
    display: block;
    margin: auto;
  }
  .prompt {
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

<style lang="scss">
.preview {
  .image.error {
    background: var(--el-bg-color-page);
    .image-slot {
      font-size: 14px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }
}
</style>
