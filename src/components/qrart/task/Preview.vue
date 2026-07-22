<template>
  <div class="preview w-full h-fit text-left flex flex-row mb-[15px]">
    <div class="left">
      <capability-presentation
        capability="qrart"
        part="avatar"
        class="avatar bg-[var(--el-bg-color)] p-[2px] w-[50px] h-[50px] m-[10px] rounded-full"
      />
    </div>
    <div class="main flex-1 w-[calc(100%-70px)] min-w-0 pt-[10px] pr-[10px] pb-0 pl-[10px]">
      <div
        class="bot flex items-center text-[16px] font-bold text-[var(--el-color-primary)] overflow-hidden whitespace-nowrap"
      >
        <capability-presentation capability="qrart" part="name" />
        <span
          class="datetime text-[12px] font-normal text-[var(--el-text-color-secondary)] ml-[10px] overflow-hidden text-ellipsis"
        >
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
        <el-tooltip effect="dark" :content="$t('common.button.delete')" placement="top">
          <button
            v-if="modelValue?.id"
            type="button"
            class="btn-delete ml-auto shrink-0 cursor-pointer border-none bg-transparent p-[4px_6px] leading-none"
            :aria-label="$t('common.button.delete')"
            @click.stop="onDelete"
          >
            <delete-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          </button>
        </el-tooltip>
      </div>
      <div class="info">
        <p
          v-if="modelValue?.request?.prompt"
          class="prompt mt-2 text-[14px] font-bold text-[var(--el-text-color-regular)] mb-[10px] overflow-hidden text-ellipsis whitespace-nowrap"
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
        <div :class="{ operations: true, 'mt-2': true, 'mb-2': true }">
          <api-code-button path="/qrart/generate" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p class="description">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <reward-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.type') }}:
            {{ $t('qrart.type.' + modelValue?.request?.type) }}
            <copy-to-clipboard :content="modelValue?.request?.type!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.request?.content" class="description">
            <message-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.content') }}:
            {{ modelValue?.request?.content }}
            <copy-to-clipboard :content="modelValue?.request?.content!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.request?.content_image_url" class="description">
            <message-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.contentImageUrl') }}:
            <button
              type="button"
              class="icon-button mr-1 cursor-pointer"
              :aria-label="$t('common.button.view')"
              :title="$t('common.button.view')"
              @click="onOpenLink(modelValue?.request?.content_image_url)"
            >
              <external-link-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </button>
          </p>
          <p v-if="modelValue?.request?.seed || modelValue?.response?.seed" class="description">
            <growth-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.seed') }}:
            {{ modelValue?.request?.seed || modelValue?.response?.seed }}
            <copy-to-clipboard
              :content="(modelValue?.request?.seed || modelValue?.response?.seed).toString()!"
              class="btn-copy"
            />
          </p>
          <p v-if="modelValue?.elapsed" class="description">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>
      <div v-if="modelValue?.response?.success === false" :class="{ content: true }">
        <el-alert :closable="false" class="failure">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.failure') }}
          </template>
          <p class="description">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.taskId') }}:
            {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id!" class="btn-copy" />
          </p>
          <p class="description">
            <info-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.failureReason') }}:
            {{ modelValue?.response?.error?.message }}
            <copy-to-clipboard :content="modelValue?.response?.error?.message!" class="btn-copy" />
          </p>
          <p v-if="modelValue?.elapsed" class="description">
            <time-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
          <p class="description">
            <channel-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.traceId') }}:
            {{ modelValue?.response?.trace_id }}
            <copy-to-clipboard :content="modelValue?.response?.trace_id" class="btn-copy" />
          </p>
        </el-alert>
      </div>
      <div v-if="!modelValue?.response" :class="{ content: true }">
        <el-alert :closable="false" class="info">
          <template #template>
            <warning-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('qrart.name.failure') }}
          </template>
          <p class="description">
            <magic-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
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
import {
  ChannelIcon,
  DeleteIcon,
  ExternalLinkIcon,
  GrowthIcon,
  InfoIcon,
  MagicIcon,
  MessageIcon,
  RewardIcon,
  TimeIcon,
  WarningIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElAlert, ElMessageBox, ElMessage, ElTooltip } from 'element-plus';
import { IQrartTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import ImageWrapper from '@/components/common/ImageWrapper.vue';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'TaskPreview',
  components: {
    ChannelIcon,
    DeleteIcon,
    ExternalLinkIcon,
    GrowthIcon,
    InfoIcon,
    MagicIcon,
    MessageIcon,
    RewardIcon,
    TimeIcon,
    WarningIcon,
    CopyToClipboard,
    ElAlert,
    ElTooltip,
    ImageWrapper,
    ApiCodeButton
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
    async onDelete() {
      const id = this.modelValue?.id;
      if (!id) return;
      try {
        await ElMessageBox.confirm(this.$t('common.message.deleteTaskConfirm'), this.$t('common.button.delete'), {
          type: 'warning',
          confirmButtonText: this.$t('common.button.delete'),
          cancelButtonText: this.$t('common.button.cancel'),
          confirmButtonClass: 'el-button--danger'
        });
      } catch {
        return; // user cancelled
      }
      try {
        await this.$store.dispatch('qrart/deleteTask', { id });
        ElMessage.success(this.$t('common.message.deleteTaskSuccess'));
      } catch {
        ElMessage.error(this.$t('common.message.deleteTaskFailed'));
      }
    },
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
.icon-button {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

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
      background-color: var(--el-bg-color);
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
    min-width: 0;
    padding: 10px 10px 0 10px;

    .bot {
      font-size: 16px;
      font-weight: bold;
      color: rgb(46, 204, 113);
      margin-bottom: 0;
      margin-top: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      .datetime {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
        margin-left: 10px;
      }
      .btn-delete {
        margin-left: auto;
        color: var(--el-text-color-secondary);
        // Hover-reveal on pointer devices; keep it out of the way until wanted.
        opacity: 0;
        transition:
          opacity 0.15s ease,
          color 0.15s ease;
        &:hover {
          color: var(--el-color-danger);
        }
        // Touch devices have no hover — always show the control.
        @media (hover: none) {
          opacity: 1;
        }
      }
    }

    .info {
      overflow: hidden;
      .prompt {
        font-size: 14px;
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
        &.info {
          border-color: var(--el-color-info);
        }
        // Drop the trailing `mb-2` on whichever `<p>` ends up rendered
        // last (trace_id / elapsed are conditional — e.g. pending tasks).
        :deep(p:last-child) {
          margin-bottom: 0;
        }
      }
    }

    .description {
      color: var(--el-text-color-regular);
      font-size: 12px;
      margin-bottom: 8px;
    }
  }

  // Reveal the trash icon when hovering anywhere on the card.
  &:hover .main .bot .btn-delete {
    opacity: 1;
  }
}
</style>
