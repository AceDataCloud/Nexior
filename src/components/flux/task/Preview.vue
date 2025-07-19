<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/ogm2oa.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('flux.name.fluxBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('flux.status.pending') }}) </span>
        </p>
      </div>
      <!-- Display success message -->
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div class="flex justify-start items-center gap-4 w-full overflow-x-auto">
          <image-wrapper
            v-for="(image, imageIndex) in images"
            :key="imageIndex"
            :src="image?.image_url!"
            :raw-src="image?.image_url!"
            :model-value="image"
          />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('flux.name.model') }}:
            {{ modelValue?.request?.model }}
          </p>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('flux.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy inline-block" />
          </p>
        </el-alert>
      </div>
      <!-- Display error message -->
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('flux.name.failure') }}
          </template>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('flux.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="mb-4">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('flux.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('flux.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('flux.name.failure') }}
          </template>
          <p class="mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('flux.name.taskId') }}:
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
import { IFluxTask, IFluxImage } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ImageWrapper from '@/components/common/ImageWrapper.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    ImageWrapper
  },
  props: {
    modelValue: {
      type: Object as () => IFluxTask | undefined,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {
    application() {
      return this.$store.state.flux?.application;
    },
    config() {
      return this.$store.state.flux?.config;
    },
    images(): IFluxImage[] {
      let result: IFluxImage[] = [];
      // @ts-ignore
      const action = this.modelValue?.request?.action;
      if (Array.isArray(this.modelValue?.response?.data)) {
        this.modelValue?.response?.data?.forEach((item: any) => {
          let image = item as IFluxImage;
          // Add the action field to the image object
          if (action) {
            image.action = action;
          }
          result.push(image);
        });
      }
      return result;
    }
  },
  methods: {
    onDownload(event: MouseEvent, image_url: string) {
      event.stopPropagation();
      console.log('on download');
      // download url here
      window.open(image_url, '_blank');
    },
    onOpenImage(url: string) {
      window.open(url, '_blank');
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
  margin-bottom: 15px;
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

    .info {
      .prompt {
        font-size: 14px;
        font-weight: bold;
        color: var(--el-text-color-regular);
        margin-bottom: 10px;
      }
    }

    .content {
      .el-alert {
        border-left-width: 2px;
        border-left-style: solid;
        &.failure {
          border-color: var(--el-color-danger);
        }
        &.success {
          border-color: var(--el-color-success);
        }
        &.info {
          border-color: var(--el-color-info);
        }
      }
    }
  }
}
</style>
