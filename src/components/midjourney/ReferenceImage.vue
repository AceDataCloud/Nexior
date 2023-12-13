<template>
  <div class="mb-4">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo"
      action="https://data.zhishuyun.com/api/v1/images/"
      :on-success="handleSuccess"
      list-type="picture"
      :headers="headers"
    >
      <el-button type="primary">Click to upload</el-button>
      <template #tip>
        <div class="el-upload__tip">jpg/png files with a size less than 500kb</div>
      </template>
    </el-upload>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElUpload, ElButton } from 'element-plus';
export default defineComponent({
  name: 'ReferenceImage',
  components: {
    ElUpload,
    ElButton
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  data() {},
  computed: {
    headers() {
      return {
        Authorization: `Bearer ${this.$store.state.token.access}`
      };
    }
  },
  mounted() {},
  methods: {
    handleSuccess(response) {
      console.log('response', response);
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
