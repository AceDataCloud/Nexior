<template>
  <el-dialog v-model="editing" :title="title" width="400px">
    <div>
      <el-upload
        v-model:file-list="fileList"
        name="file"
        :limit="5"
        :multiple="true"
        :action="uploadUrl"
        list-type="picture"
        :on-exceed="onExceed"
        :on-error="onError"
        :headers="headers"
      >
        <el-button round type="primary" class="btn btn-upload">
          <font-awesome-icon icon="fa-solid fa-upload" class="icon mr-2" />
          {{ $t('site.button.upload') }}
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            {{ tip }}
          </div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button round @click="onCancel">{{ $t('common.button.cancel') }}</el-button>
        <el-button round type="primary" @click="onConfirm">{{ $t('common.button.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
  <span class="edit" @click="editing = true">
    <el-icon class="icon">
      <edit />
    </el-icon>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElButton, ElIcon, ElMessage, ElUpload, UploadFiles, UploadFile } from 'element-plus';
import { Edit } from '@element-plus/icons-vue';
import { getBaseUrlPlatform } from '@/utils';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'EditImage',
  components: {
    ElDialog,
    ElButton,
    FontAwesomeIcon,
    ElIcon,
    Edit,
    ElUpload
  },
  props: {
    modelValue: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tip: {
      type: String,
      required: true
    }
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      editing: false,
      value: this.modelValue,
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
    }
  },
  methods: {
    onCancel() {
      this.editing = false;
    },
    onConfirm() {
      this.$emit('confirm', this.urls?.[0]);
      this.editing = false;
    },
    onExceed() {
      ElMessage.warning(this.$t('site.message.uploadImageExceed'));
    },
    onError() {
      ElMessage.error(this.$t('site.message.uploadImageError'));
    }
  }
});
</script>

<style lang="scss">
.edit {
  cursor: pointer;
  margin-left: 5px;
  position: relative;
  top: 2px;
  .icon {
    font-size: 14px;
  }
}
</style>
