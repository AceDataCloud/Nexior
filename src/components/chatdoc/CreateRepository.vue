<template>
  <el-dialog v-model="dialogVisible" width="400px">
    <el-form ref="form" label-width="60px">
      <el-form-item :label="$t('chatdoc.field.name')" :prop="form.name">
        <el-input v-model="form.name" :placeholder="$t('chatdoc.message.inputRepositoryName')" />
      </el-form-item>
      <el-form-item :label="$t('chatdoc.field.description')" :prop="form.description">
        <el-input v-model="form.description" :placeholder="$t('chatdoc.message.inputRepositoryDescription')" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" round @click="onSubmit">{{ $t('common.button.create') }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
  <button class="btn btn-create" @click="dialogVisible = true">
    <font-awesome-icon :icon="['fas', 'plus']" />
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog, ElMessage, ElForm, ElFormItem, ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  dialogVisible: boolean;
  creating: boolean;
  form: {
    name: string;
    description: string;
  };
}

export default defineComponent({
  name: 'CreateRepository',
  components: {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      dialogVisible: false,
      creating: false,
      form: {
        name: '',
        description: ''
      }
    };
  },
  computed: {},
  methods: {
    async onSubmit() {
      if (!this.form.name) {
        ElMessage.error(this.$t('chatdoc.message.nameRequired'));
        return;
      }
      this.creating = true;
      this.$store
        .dispatch('chatdoc/createRepository', {
          name: this.form.name,
          description: this.form.description
        })
        .then(() => {
          this.creating = false;
          ElMessage.success(this.$t('chatdoc.message.createRepositorySuccess'));
          this.dialogVisible = false;
          this.$store.dispatch('chatdoc/getRepositories');
        })
        .catch(() => {
          this.creating = false;
          ElMessage.error(this.$t('chatdoc.message.createRepositoryFailed'));
        });
    }
  }
});
</script>

<style scoped lang="scss">
.btn.btn-create {
  text-align: center;
  cursor: pointer;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-top: 5px;
  background-color: var(--el-bg-color-page);
  margin-bottom: 0;
}

.el-button {
  border-radius: 20px;
}
</style>
