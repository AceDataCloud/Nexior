<template>
  <div class="relative">
    <div class="flex justify-between">
      <div class="flex justify-start items-center">
        <span class="text-sm font-bold">{{ $t('kling.name.startImage') }}</span>
        <info-icon :content="$t('kling.description.uploadStartImage')" />
      </div>
    </div>
    <el-upload
      v-model:file-list="fileList"
      name="file"
      :limit="5"
      class="upload-wrapper"
      :multiple="false"
      :action="uploadUrl"
      list-type="picture"
      :on-exceed="onExceed"
      :on-error="onError"
      :on-success="onSuccess"
      :headers="headers"
    >
      <el-button round type="primary" size="small" class="btn btn-upload">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-1" />
        {{ $t('kling.button.uploadReferences') }}
      </el-button>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlPlatform } from '@/utils';
import InfoIcon from '@/components/common/InfoIcon.vue';

interface IData {
  fileList: UploadFiles;
  uploadUrl: string;
}

export default defineComponent({
  name: 'StartImage',
  components: {
    ElUpload,
    ElButton,
    InfoIcon,
    FontAwesomeIcon
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
    },
    urls() {
      // @ts-ignore
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    },
    value: {
      get() {
        return this.$store.state?.kling?.config?.start_image_url;
      },
      set(val: string) {
        // this.$store.commit('kling/setConfig', {
        //   ...this.$store.state?.kling?.config,
        //   start_image_url: val
        // });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = undefined;
    }
    this.onSetStartImageUrl();
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('kling.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('kling.message.uploadReferencesError'));
    },
    onSetStartImageUrl() {
      const url = this.urls?.[0];
      this.$store.commit('kling/setConfig', {
        ...this.$store.state?.kling?.config,
        start_image_url: url
      });
    },
    async onSuccess() {
      this.onSetStartImageUrl();
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 14px;
  margin-bottom: 0;
  width: 30%;
}
.btn.btn-upload {
  position: absolute;
  top: 5px;
  right: 0;
}
</style>

<style lang="scss">
.upload-wrapper {
  height: auto;
  display: flex;
  .el-upload-list {
    margin: 0;
    width: 100%;
  }
}
</style>
