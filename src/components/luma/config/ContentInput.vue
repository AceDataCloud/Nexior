<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.content') }}</h2>
    <el-radio-group v-model="inputWay" class="mb-4">
      <el-radio-button label="input">{{ $t('qrart.inputWay.input') }} </el-radio-button>
      <el-radio-button label="upload">{{ $t('qrart.inputWay.upload') }} </el-radio-button>
    </el-radio-group>
    <el-input
      v-if="inputWay == 'input'"
      v-model="value"
      class="content"
      :placeholder="$t('qrart.placeholder.content')"
    />
    <el-upload
      v-if="inputWay == 'upload'"
      v-model:file-list="fileList"
      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"
      name="file"
      class="upload"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
      :action="uploadUrl"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :headers="headers"
    >
      <el-button type="primary" round>{{ $t('qrart.button.uploadQr') }}</el-button>
    </el-upload>
    <p v-if="inputWay == 'upload'" class="description">
      {{ $t('qrart.message.uploadQr') }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElRadioGroup, ElRadioButton, ElButton, ElUpload, ElMessage, UploadFiles } from 'element-plus';
import { getBaseUrlPlatform } from '@/utils';

export const DEFAULT_CONTENT = '';

interface IData {
  inputWay: 'input' | 'upload';
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'ContentInput',
  components: {
    ElInput,
    ElUpload,
    ElRadioGroup,
    ElButton,
    ElRadioButton
  },
  data(): IData {
    return {
      inputWay: 'input',
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    },
    urls(): string[] {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state.qrart?.config?.content;
      },
      set(val: string) {
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          content: val,
          content_image_url: undefined
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_CONTENT;
    }
    this.onSetContentImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('chatdoc.message.uploadDocumentsExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chatdoc.message.uploadDocumentsError'));
    },
    onSetContentImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('qrart/setConfig', {
        ...this.$store.state.qrart?.config,
        content: undefined,
        content_image_url: url
      });
    },
    async onSuccess() {
      this.onSetContentImageUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
    margin-bottom: 10px;
  }
  .description {
    display: block;
    font-size: 12px;
    margin: 0;
    margin-top: 10px;
    color: var(--el-text-color-secondary);
  }
}
</style>
