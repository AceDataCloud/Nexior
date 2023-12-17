<template>
  <div class="mb-4">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo"
      name="image"
      :limit="5"
      :multiple="true"
      action="/api/v1/images/"
      list-type="picture"
      :on-exceed="onExceed"
      :on-error="onError"
      :headers="headers"
    >
      <el-button type="primary">
        <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-2" />
        {{ $t('midjourney.button.uploadReferences') }}
      </el-button>
      <template #tip>
        <div class="el-upload__tip">
          {{ $t('midjourney.description.uploadReferences') }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElUpload, ElButton, UploadFiles, UploadFile, ElMessage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  fileList: UploadFiles;
}

export default defineComponent({
  name: 'ReferenceImage',
  components: {
    ElUpload,
    ElButton,
    FontAwesomeIcon
  },
  emits: ['change'],
  data(): IData {
    return {
      fileList: []
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
      return this.fileList.map((file: UploadFile) => file?.response?.image_url);
    }
  },
  watch: {
    urls: {
      handler(val) {
        this.$emit('change', val);
      }
    }
  },
  methods: {
    onExceed() {
      ElMessage.warning(this.$t('midjourney.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('midjourney.message.uploadReferencesError'));
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
.prompt {
  color: #333;
  font-size: 16px;
  flex: 1;
}
</style>
