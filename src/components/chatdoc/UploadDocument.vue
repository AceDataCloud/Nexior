<template>
  <el-dialog v-model="dialogVisible">
    <el-upload
      v-model:file-list="fileList"
      accept=".docx,.doc,.pdf,.txt,.csv,.enex,.epub,.eml,.html,.htm,.shtml,.md,.odt,.ppt,.pptx,.txt"
      drag
      :class="{
        upload: true
      }"
      name="file"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
      :action="uploadUrl"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :headers="headers"
    >
      <el-icon v-if="!learning" class="el-icon--upload"><upload-filled /></el-icon>
      <div v-if="!learning" class="el-upload__text">
        <p>{{ $t('chatdoc.message.dragOrClickToUpload') }}</p>
        <p>{{ $t('chatdoc.message.supportedFiles') }}</p>
      </div>
      <div v-if="learning">{{ $t('chatdoc.message.learningDocument') }}</div>
    </el-upload>
  </el-dialog>
  <el-button type="primary" round @click="dialogVisible = true">{{ $t('chatdoc.button.uploadDocuments') }}</el-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog, ElUpload, ElIcon, ElMessage, UploadFiles } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getBaseUrlPlatform } from '@/utils';

interface IData {
  dialogVisible: boolean;
  fileList: UploadFiles;
  learning: boolean;
  uploadUrl: string;
}

export default defineComponent({
  name: 'UploadDocument',
  components: {
    ElButton,
    ElDialog,
    ElUpload,
    ElIcon,
    UploadFilled
  },
  data(): IData {
    return {
      dialogVisible: false,
      fileList: [],
      learning: false,
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
    }
  },
  async mounted() {},
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('chatdoc.message.uploadDocumentsExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chatdoc.message.uploadDocumentsError'));
    },
    async onSuccess() {
      ElMessage.success(this.$t('chatdoc.message.uploadDocumentsSuccess'));
      ElMessage.info(this.$t('chatdoc.message.startCreateDocument'));
      this.learning = true;
      this.$store
        .dispatch('chatdoc/createDocument', {
          repositoryId: this.$route.params.repositoryId,
          fileUrl: this.urls[0],
          fileName: this.fileList[0].name
        })
        .then(() => {
          ElMessage.success(this.$t('chatdoc.message.createDocumentSuccess'));
          this.dialogVisible = false;
          this.$store.dispatch('chatdoc/getDocuments', { repositoryId: this.$route.params.repositoryId });
          this.$store.dispatch('chatdoc/getApplications');
        })
        .catch(() => {
          ElMessage.error(this.$t('chatdoc.message.createDocumentError'));
        })
        .finally(() => {
          this.fileList = [];
          this.learning = false;
        });
    }
  }
});
</script>

<style scoped lang="scss">
.el-button {
  border-radius: 20px;
}
</style>
