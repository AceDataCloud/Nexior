<template>
  <div class="preview">
    <div class="left">
      <el-image src="https://cdn.acedata.cloud/e40fccc727.png" class="avatar" />
    </div>
    <div class="main">
      <div class="bot">
        {{ $t('fish.name.fishBot') }}
        <span class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <div class="info">
        <p v-if="prompt" class="prompt mt-2">
          {{ prompt }}
          <span v-if="!modelValue?.response"> - ({{ $t('fish.status.pending') }}) </span>
        </p>
      </div>
      <!-- Success -->
      <div v-if="audioUrl" class="content">
        <audio :src="audioUrl" controls preload="metadata" class="w-full mb-3" />
        <div class="operations mt-2">
          <el-button type="info" size="small" class="mb-2" @click.stop="onDownload(audioUrl)">
            {{ $t('fish.button.download') }}
          </el-button>
          <api-code-button path="/fish/tts" :body="modelValue?.request" />
        </div>
        <el-alert :closable="false" class="mt-2 success">
          <p v-if="modelValue?.request?.model" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-microchip" class="mr-1" />
            {{ $t('fish.name.model') }}: {{ modelValue?.request?.model }}
          </p>
          <p v-if="modelValue?.request?.reference_id" class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-microphone" class="mr-1" />
            {{ $t('fish.name.referenceId') }}: {{ modelValue?.request?.reference_id }}
            <copy-to-clipboard :content="modelValue?.request?.reference_id" />
          </p>
          <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('fish.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id" />
          </p>
          <p v-if="modelValue?.elapsed" class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-clock" class="mr-1" />
            {{ $t('fish.name.elapsed') }}: {{ modelValue?.elapsed?.toFixed(2) }}s
          </p>
        </el-alert>
      </div>
      <!-- Pending / no audio yet -->
      <div v-else class="content">
        <el-alert :closable="false" class="info">
          <p class="text-[var(--el-text-color-regular)] text-xs mb-0">
            <font-awesome-icon icon="fa-solid fa-magic" class="mr-1" />
            {{ $t('fish.name.taskId') }}: {{ modelValue?.id }}
            <copy-to-clipboard :content="modelValue?.id" />
          </p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElAlert, ElButton } from 'element-plus';
import { IFishTask } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ApiCodeButton from '@/components/common/ApiCodeButton.vue';

export default defineComponent({
  name: 'FishTaskPreview',
  components: {
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon,
    ElAlert,
    ElButton,
    ApiCodeButton
  },
  props: {
    modelValue: {
      type: Object as () => IFishTask | undefined,
      required: true
    }
  },
  computed: {
    prompt(): string | undefined {
      return this.modelValue?.request?.text;
    },
    audioUrl(): string | undefined {
      return this.modelValue?.response?.audio_url;
    }
  },
  methods: {
    onDownload(url: string) {
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
      box-shadow: var(--app-shadow-xs);
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
      margin-bottom: 0;
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
        font-size: 14px;
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
    }
  }
}
</style>
