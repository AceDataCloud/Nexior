<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/seedream_image.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('seedream.name.seedreamBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <div
          v-if="Array.isArray(modelValue?.request?.image) && modelValue?.request?.image.length > 0"
          class="flex justify-start items-center gap-2 mt-2 w-full overflow-x-auto"
        >
          <image-preview
            v-for="(url, idx) in modelValue?.request?.image"
            :key="idx"
            :url="url"
            :name="`image-${idx + 1}`"
            :closable="false"
          />
        </div>
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('seedream.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div class="flex justify-start items-center gap-4 w-full overflow-x-auto">
          <image-wrapper
            v-for="(image, imageIndex) in images"
            :key="imageIndex"
            :src="image?.image_url!"
            :raw-src="image?.image_url!"
          />
        </div>
        <div :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <el-tooltip class="box-item" effect="dark" :content="$t('common.button.edit')" placement="top-start">
            <el-button type="info" size="small" class="btn-action" @click.stop="onEdit(images?.[0]?.image_url)">
              {{ $t('common.button.edit') }}
            </el-button>
          </el-tooltip>
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('seedream.name.model') }}:
            {{ shortModel(modelValue?.request?.model) }}
          </p>
          <p v-if="modelValue?.request?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-image" class="mr-1" />
            {{ $t('seedream.name.size') }}:
            {{ modelValue?.request?.size }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-bolt" class="mr-1" />
            {{ $t('seedream.name.task') }}:
            {{ isEdit ? $t('seedream.name.edits') : $t('seedream.name.generate') }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('seedream.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('seedream.name.failure') }}
          </template>
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-cube" class="mr-1" />
            {{ $t('seedream.name.model') }}:
            {{ shortModel(modelValue?.request?.model) }}
          </p>
          <p v-if="modelValue?.request?.size" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-image" class="mr-1" />
            {{ $t('seedream.name.size') }}:
            {{ modelValue?.request?.size }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-bolt" class="mr-1" />
            {{ $t('seedream.name.task') }}:
            {{ isEdit ? $t('seedream.name.edits') : $t('seedream.name.generate') }}
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.response?.error?.message" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('seedream.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.response?.trace_id" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('seedream.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-if="!modelValue?.response || !modelValue?.response?.data?.[0]?.image_url" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('seedream.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('seedream.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton, ElTooltip } from 'element-plus';
import { ISeedreamTask, ISeedreamImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { getSeedreamShortModel } from '@/constants';

export default defineComponent({
  name: 'SeedreamTaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    ImageWrapper,
    ElButton,
    ElTooltip,
    ImagePreview
  },
  props: {
    modelValue: {
      type: Object as () => ISeedreamTask | undefined,
      required: true
    }
  },
  computed: {
    isEdit(): boolean {
      return Array.isArray(this.modelValue?.request?.image) && (this.modelValue?.request?.image?.length || 0) > 0;
    },
    images(): ISeedreamImage[] {
      const result: ISeedreamImage[] = [];
      // @ts-ignore
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          result.push(item as ISeedreamImage);
        });
      }
      return result;
    }
  },
  methods: {
    shortModel(model?: string) {
      return getSeedreamShortModel(model) || model;
    },
    onEdit(imageUrl?: string) {
      if (!imageUrl) return;
      console.debug('Edit image:', imageUrl);
      const nextConfig = { ...(this.$store.state.seedream?.config || {}) };
      (nextConfig as any).image = [imageUrl];
      this.$store.commit('seedream/setConfig', nextConfig);
    }
  }
});
</script>

<style lang="scss" scoped>
$left-width: 70px;
.preview {
  width: 100%;
  height: fit-content;
  text-align: left;
  display: flex;
  flex-direction: row;
  margin-bottom: 10px;
  .left {
    width: $left-width;
    .avatar {
      width: 50px;
      height: 50px;
      margin: 10px;
      border-radius: 50%;
    }
  }

  .main {
    flex: 1;
    width: calc(100% - $left-width);
    padding: 10px 10px 0 10px;

    .bot {
      font-size: 16px;
      font-weight: bold;
      color: rgb(46, 204, 113);
      margin-bottom: 0;
      margin-top: 0;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
    }
  }
}
</style>
