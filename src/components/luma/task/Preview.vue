<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/bcml67.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('qrart.name.qrartBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat(modelValue?.created_at || '') * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.prompt" class="prompt mt-2">
          {{ modelValue?.request?.prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('qrart.status.pending') }}) </span>
        </p>
      </div>
      <div v-if="modelValue?.response?.success === true" :class="{ content: true, failed: true }">
        <div class="image-wrapper">
          <img
            v-if="modelValue?.response?.image_url"
            v-loading="!modelValue?.response?.image_url"
            :src="modelValue?.response?.image_url"
            class="image mb-3"
          />
          <el-button
            v-if="modelValue?.response?.image_url"
            type="info"
            round
            class="btn-raw"
            @click="onOpenUrl(modelValue?.response?.image_url)"
          >
            {{ $t('common.button.seeRawImage') }}
          </el-button>
        </div>
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
import { ElImage, ElAlert, ElButton } from 'element-plus';
import { IQrartTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    ElButton
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

    .image-wrapper {
      position: relative;
      width: fit-content;
      min-height: 50px;
      min-width: 100px;
      .image {
        max-height: 400px;
        max-width: 300px;
        display: block;
        width: fit-content;
      }
      .btn-raw {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        display: none;
      }
      &:hover {
        .image {
          filter: brightness(0.6);
        }
        .btn-raw {
          display: block;
        }
      }
    }
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
  .failure {
    background: var(--el-fill-color-light);
    width: 100%;
  }
}
</style>
