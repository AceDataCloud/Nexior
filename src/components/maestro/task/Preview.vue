<template>
  <div class="preview">
    <div class="left">
      <el-image :src="MAESTRO_LOGO" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('maestro.name.maestroBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="modelValue?.request?.source_ref" class="prompt mt-2">
          {{ modelValue?.request?.source_ref }}
          <span v-if="!isTerminal"> - ({{ statusLabel }}) </span>
        </p>
      </div>

      <!-- success: one player per language variant -->
      <div v-if="modelValue?.response?.success === true && variants.length" class="content">
        <div v-for="(variant, vi) in variants" :key="vi" class="mb-4">
          <p class="text-xs text-[var(--el-text-color-secondary)] mb-1">
            <font-awesome-icon icon="fa-solid fa-language" class="mr-1" />{{ variant.lang }}
          </p>
          <video-player v-if="variant.output_url" :src="variant.output_url" />
          <div class="operations mt-2">
            <el-button
              v-if="variant.output_url"
              type="info"
              size="small"
              class="btn-action"
              @click="onDownload($event, variant.output_url)"
            >
              {{ $t('maestro.button.download') }}
            </el-button>
            <el-button
              v-if="variant.captions_url"
              size="small"
              class="btn-action"
              @click="onDownload($event, variant.captions_url)"
            >
              {{ $t('maestro.button.downloadCaptions') }}
            </el-button>
          </div>
        </div>
        <div class="operations">
          <api-code-button path="/maestro/videos" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('maestro.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('maestro.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>

      <!-- failure -->
      <div v-if="modelValue?.response?.success === false" class="content">
        <el-alert :closable="false" class="failure">
          <template #template>
            <font-awesome-icon icon="fa-solid fa-exclamation-triangle" class="mr-1" />
            {{ $t('maestro.name.failure') }}
          </template>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('maestro.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" />
          </p>
          <p v-if="failureReason" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-circle-info" class="mr-1" />
            {{ $t('maestro.name.failureReason') }}: {{ failureReason }}
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton } from 'element-plus';
import { IMaestroTask, IMaestroVariant } from '@/models';
import { MAESTRO_LOGO } from '@/constants';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VideoPlayer from '@/components/common/VideoPlayer.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

const TERMINAL = ['succeeded', 'failed'];

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    VideoPlayer,
    ElButton,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IMaestroTask | undefined,
      required: true
    }
  },
  data() {
    return {
      MAESTRO_LOGO
    };
  },
  computed: {
    variants(): IMaestroVariant[] {
      return this.modelValue?.response?.data?.variants || [];
    },
    isTerminal(): boolean {
      return TERMINAL.includes(this.modelValue?.status || '');
    },
    statusLabel(): string {
      const s = this.modelValue?.status || 'pending';
      const key = `maestro.status.${s}`;
      const label = this.$t(key);
      return label === key ? (this.$t('maestro.status.processing') as string) : (label as string);
    },
    failureReason(): string | undefined {
      const err = this.modelValue?.response?.error;
      if (!err) return undefined;
      return typeof err === 'string' ? err : err?.message;
    }
  },
  methods: {
    onDownload(event: MouseEvent, url: string) {
      event?.stopPropagation();
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
    min-width: 0;
    padding: 10px 10px 0 10px;

    .bot {
      font-size: 16px;
      font-weight: bold;
      color: var(--el-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
    }

    .info {
      overflow: hidden;
      .prompt {
        font-size: 16px;
        font-weight: bold;
        color: var(--el-text-color-regular);
        margin-bottom: 10px;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
      }
    }

    .content {
      word-break: break-word;
      overflow-wrap: anywhere;

      .el-alert {
        border-left-width: 2px;
        border-left-style: solid;
        &.failure {
          border-color: var(--el-color-danger);
        }
        &.success {
          border-color: var(--el-color-success);
        }
        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }

    .operations {
      display: flex;
      justify-content: left;
      flex-direction: row;
      width: 100%;
      align-items: baseline;
      flex-wrap: wrap;
      .btn-action {
        margin-bottom: 10px;
      }
    }
  }
}
</style>
