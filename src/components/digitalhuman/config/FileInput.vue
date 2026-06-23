<template>
  <div>
    <el-upload
      ref="uploader"
      v-model:file-list="fileList"
      :accept="accept"
      name="file"
      class="w-full"
      :limit="1"
      :action="uploadUrl"
      :headers="headers"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onChange"
      :on-remove="onChange"
    >
      <el-button size="small" round>
        <font-awesome-icon :icon="icon" class="mr-1" />
        {{ buttonText }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElUpload, ElMessage, UploadFiles, UploadFile, UploadInstance } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'DigitalHumanFileInput',
  components: {
    ElUpload,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    accept: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'fa-solid fa-upload'
    }
  },
  emits: ['change'],
  data(): IData {
    return {
      fileList: [],
      uploadUrl: getBaseUrlPlatform() + '/api/v1/files/'
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
    onExceed(files: File[]) {
      // single-file slot: replace whatever is there with the newly picked file
      const uploader = this.$refs.uploader as UploadInstance | undefined;
      uploader?.clearFiles();
      const file = files[0];
      if (file) {
        (uploader as any)?.handleStart?.(file);
        (uploader as any)?.submit?.();
      }
    },
    onError() {
      ElMessage.error(this.$t('digitalhuman.message.uploadError'));
    },
    onChange() {
      const file = this.fileList?.[0] as UploadFile | undefined;
      const url = (file?.response as any)?.file_url as string | undefined;
      this.$emit('change', url);
    }
  }
});
</script>
