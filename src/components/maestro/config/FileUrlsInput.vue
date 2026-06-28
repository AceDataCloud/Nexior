<template>
  <div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      :accept="MAESTRO_FILE_ACCEPT"
      name="file"
      class="w-full"
      :limit="MAESTRO_FILE_LIMIT"
      :multiple="true"
      :action="uploadUrl"
      :headers="headers"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onChange"
      :on-remove="onChange"
    >
      <el-button size="small" round>
        <font-awesome-icon icon="fa-solid fa-paperclip" class="mr-1" />
        {{ $t('maestro.button.uploadFiles') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import { MAESTRO_FILE_ACCEPT, MAESTRO_FILE_LIMIT } from '@/constants';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
  MAESTRO_FILE_ACCEPT: string;
  MAESTRO_FILE_LIMIT: number;
}

export default defineComponent({
  name: 'MaestroFileUrlsInput',
  components: {
    ElUpload,
    ElButton,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/',
      MAESTRO_FILE_ACCEPT,
      MAESTRO_FILE_LIMIT
    };
  },
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('maestro.message.uploadExceed'));
    },
    onError() {
      ElMessage.error(this.$t('maestro.message.uploadError'));
    },
    onChange() {
      // Only files that finished uploading have a response.file_url.
      const urls = this.fileList
        .map((file: UploadFile) => (file?.response as any)?.file_url)
        .filter((url: string | undefined): url is string => !!url);
      this.$store.commit('maestro/setConfig', {
        ...this.$store.state.maestro?.config,
        file_urls: urls
      });
    }
  }
});
</script>
