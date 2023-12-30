<template>
  <div class="input-box">
    <el-upload
      v-model:file-list="fileList"
      class="upload"
      name="file"
      :show-file-list="true"
      :limit="1"
      :multiple="false"
      action="/api/v1/files/"
      :on-exceed="onExceed"
      :on-error="onError"
      :headers="headers"
    >
      <el-tooltip class="box-item" effect="dark" :content="$t('chat.message.uploadFile')" placement="top">
        <span class="btn btn-upload">
          <font-awesome-icon icon="fa-solid fa-paperclip" class="icon icon-attachment" />
        </span>
      </el-tooltip>
    </el-upload>
    <span
      :class="{
        btn: true,
        'btn-send': true,
        disabled: !value
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" class="icon icon-send" />
    </span>
    <el-input
      v-model="value"
      :rows="1"
      class="input"
      type="textarea"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      @keydown.enter.exact.prevent="onSubmit"
    >
    </el-input>
    <p class="info">{{ $t('chat.message.howToUse') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElMessage, ElTooltip, ElUpload } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'InputBox',
  components: {
    ElInput,
    ElTooltip,
    FontAwesomeIcon,
    ElUpload
  },
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue', 'submit'],
  data() {
    return {
      value: this.modelValue,
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
      return this.fileList.map((file: UploadFile) => file?.response?.file_url);
    }
  },
  watch: {
    value(val) {
      this.$emit('update:modelValue', val);
    },
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {
    onSubmit() {
      if (!this.value) {
        return;
      }
      this.$emit('submit', this.value);
    },
    onExceed() {
      ElMessage.warning(this.$t('chat.message.uploadReferencesExceed'));
    },
    onError() {
      ElMessage.error(this.$t('chat.message.uploadReferencesError'));
    }
  }
});
</script>

<style lang="scss">
.input-box {
  .input {
    textarea {
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 25px;
    }
  }
  .el-upload-list {
    position: absolute;
    width: 200px;
    bottom: 40px;
  }
}
</style>

<style lang="scss" scoped>
.input-box {
  position: relative;
  width: 100%;
  border: 1px solid #eee;
  border-radius: 10px;
  background: none;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  top: 40px;
  .upload {
    display: inline-block;
  }
  .input {
    border: none;
    width: calc(100% - 80px);
    margin-left: 30px;
  }
  .info {
    display: block;
    position: absolute;
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    margin-left: 3px;
  }
  .btn {
    display: block;
    z-index: 10000;
    cursor: pointer;
    position: absolute;
    top: 4px;
    &.btn-upload {
      left: 10px;
      .icon-attachment {
        font-size: 14px;
        color: #666;
      }
    }
    &.btn-send {
      right: 15px;
      &.disabled {
        .icon-send {
          color: #eee;
        }
        cursor: not-allowed;
      }
      .icon-send {
        font-size: 16px;
        color: #666;
      }
    }
  }
}
</style>
