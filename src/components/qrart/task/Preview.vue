<template>
  <div class="preview w-full h-fit text-left flex flex-row mb-[15px]">
    <div class="left">
      <el-image
        src="https://cdn.acedata.cloud/bcml67.png"
        class="avatar bg-white p-[2px] w-[50px] h-[50px] m-[10px] rounded-full"
      />
    </div>
    <div class="main flex-1 w-[calc(100%-70px)] pt-[10px] pr-[10px] pb-0 pl-[10px]">
      <div class="bot text-[16px] font-bold text-[rgb(46,204,113)]">
        {{ $t('qrart.name.qrartBot') }}
        <span class="datetime text-[12px] font-normal text-[var(--el-text-color-secondary)] ml-[10px]">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p
          v-if="modelValue?.request?.prompt"
          class="prompt mt-2 text-[14px] font-bold text-[var(--el-text-color-regular)] mb-[10px]"
        >
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('qrart.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <image-wrapper
          v-if="modelValue?.response?.image_url"
          :src="modelValue?.response?.image_url"
          :raw-src="modelValue?.response?.image_url"
        />
        <el-alert :closable="false" class="mt-2 success">
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('qrart.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-diamond" class="mr-1" />
            {{ $t('qrart.name.type') }}:
            {{ $t('qrart.type.' + modelValue?.request?.type) }}
            <copy-to-clipboard :content="modelValue?.request?.type!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.request?.content" class="description">
            <font-awesome-icon icon="fa-regular fa-message" class="mr-1" />
            {{ $t('qrart.name.content') }}:
            {{ modelValue?.request?.content }}
            <copy-to-clipboard :content="modelValue?.request?.content!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.request?.content_image_url" class="description">
            <font-awesome-icon icon="fa-regular fa-message" class="mr-1" />
            {{ $t('qrart.name.contentImageUrl') }}:
            <font-awesome-icon
              icon="fa-solid fa-up-right-from-square"
              class="mr-1 cursor-pointer"
              @click="onOpenLink(modelValue?.request?.content_image_url)"
            />
          </p>
          <p v-if="modelValue?.request?.seed || modelValue?.response?.seed" class="description">
            <font-awesome-icon icon="fa-solid fa-seedling" class="mr-1" />
            {{ $t('qrart.name.seed') }}:
            {{ modelValue?.request?.seed || modelValue?.response?.seed }}
            <copy-to-clipboard
              :content="(modelValue?.request?.seed || modelValue?.response?.seed).toString()!"
              class="btn-copy"
            />
          </p>
        </el-alert>
      </div>
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('qrart.name.failure') }}
          </template>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('qrart.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('qrart.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-hashtag" class="mr-1" />
            {{ $t('qrart.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('qrart.name.failure') }}
          </template>
          <p class="description">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('qrart.name.taskId') }}:
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
import { ElImage, ElAlert } from 'element-plus';
import { IQrartTask } from '@/models';
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
    onOpenLink(url: string) {
      window.open(url, '_blank');
    },
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
    onOpenUrl(url: string) {
      window.open(url, '_blank');
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
      background-color: white;
      padding: 2px;
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

    .description {
      color: var(--el-text-color-regular);
      font-size: 12px;
      margin-bottom: 8px;
    }
  }
}
</style>
