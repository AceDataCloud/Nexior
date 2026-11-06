<template>
  <div v-if="supported">
    <div class="field">
      <div class="label">
        <h2 class="title">{{ $t('openaiimage.name.complexity') }}</h2>
        <info-icon :content="$t('openaiimage.description.complexity')" />
      </div>
      <el-select v-model="complexity" class="selector">
        <el-option v-for="level in levels" :key="level" :value="level" :label="$t(`openaiimage.quality.${level}`)" />
      </el-select>
    </div>
    <template v-if="canMarkup">
      <div class="field">
        <h2 class="title">{{ $t('openaiimage.name.markup') }}</h2>
        <el-upload
          v-model:file-list="fileList"
          accept="image/png"
          name="file"
          :show-file-list="false"
          :action="uploadUrl"
          :headers="headers"
          :before-upload="beforeUpload"
          :on-success="onSuccess"
          :on-error="onError"
        >
          <el-button size="small" round>{{ $t('openaiimage.button.uploadImageUrls') }}</el-button>
        </el-upload>
      </div>
      <p class="hint">{{ $t('openaiimage.description.markup') }}</p>
      <image-preview v-if="config.markup" :url="config.markup" @remove="setMarkup(undefined)" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElMessage, ElOption, ElSelect, ElUpload, type UploadFiles, type UploadRawFile } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import ImagePreview from '@/components/common/ImagePreview.vue';
import { isOpenAIImage26Model } from '@/constants';
import type { IOpenAIImageConfig, OpenAIImageComplexity } from '@/models';
import { getBaseUrlPlatform, uploadSizeGuardMixin, uploadTrackerMixin } from '@/utils';

export default defineComponent({
  name: 'OpenAIImageAdvancedOptions',
  components: { ElButton, ElOption, ElSelect, ElUpload, InfoIcon, ImagePreview },
  mixins: [uploadSizeGuardMixin, uploadTrackerMixin],
  data() {
    return {
      fileList: [] as UploadFiles,
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      levels: ['low', 'medium', 'high'] as OpenAIImageComplexity[]
    };
  },
  computed: {
    config(): IOpenAIImageConfig {
      return this.$store.state.openaiimage?.config || {};
    },
    supported(): boolean {
      return isOpenAIImage26Model(this.config.model);
    },
    canMarkup(): boolean {
      return this.supported && this.config.output_format !== 'gif' && !!this.config.image_urls?.length;
    },
    headers() {
      return { Authorization: `Bearer ${this.$store.state.token.access}` };
    },
    complexity: {
      get(): OpenAIImageComplexity {
        return this.config.complexity || 'high';
      },
      set(value: OpenAIImageComplexity) {
        this.$store.commit('openaiimage/setConfig', { ...this.config, complexity: value });
      }
    }
  },
  watch: {
    supported: {
      immediate: true,
      handler(value: boolean) {
        if (!value && this.config.complexity)
          this.$store.commit('openaiimage/setConfig', { ...this.config, complexity: undefined });
      }
    },
    canMarkup: {
      immediate: true,
      handler(value: boolean) {
        if (!value && this.config.markup) this.setMarkup(undefined);
      }
    }
  },
  methods: {
    setMarkup(markup: string | undefined) {
      this.$store.commit('openaiimage/setConfig', { ...this.config, markup });
    },
    beforeUpload(file: UploadRawFile) {
      if (file.type !== 'image/png' || file.size > 40 * 1024 * 1024) {
        ElMessage.error(this.$t('openaiimage.message.invalidMarkup'));
        return false;
      }
      return this.beforeUploadSizeGuard(file);
    },
    onSuccess(response: { file_url?: string }) {
      if (this.canMarkup && response.file_url) this.setMarkup(response.file_url);
      this.fileList = [];
    },
    onError() {
      this.fileList = [];
      ElMessage.error(this.$t('openaiimage.message.uploadImageError'));
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.title {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
}
.selector {
  width: 160px;
  flex-shrink: 0;
}
.hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
