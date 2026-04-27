<template>
  <el-dialog
    v-model="visible"
    width="520px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="$emit('update:modelValue', false)"
  >
    <template #header>
      <div class="dialog-header">
        <span class="title">{{ $t('connector.custom.title') }}</span>
        <el-tag size="small" type="info" effect="plain" round>{{ $t('connector.custom.beta') }}</el-tag>
      </div>
    </template>
    <p class="intro">{{ $t('connector.custom.intro') }}</p>
    <el-form :model="form" label-position="top" size="default" class="form">
      <el-form-item :label="$t('connector.custom.name')" required>
        <el-input v-model="form.name" :placeholder="$t('connector.custom.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="$t('connector.custom.url')" required>
        <el-input v-model="form.url" :placeholder="$t('connector.custom.urlPlaceholder')" />
      </el-form-item>
      <el-collapse v-model="advancedOpen" class="advanced">
        <el-collapse-item :title="$t('connector.custom.advanced')" name="advanced">
          <el-form-item :label="$t('connector.custom.description')">
            <el-input v-model="form.description" :placeholder="$t('connector.custom.descriptionPlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('connector.custom.authType')">
            <el-select v-model="form.auth_type" style="width: 100%">
              <el-option value="none" :label="$t('connector.custom.authNone')" />
              <el-option value="bearer" :label="$t('connector.custom.authBearer')" />
              <el-option value="oauth" :label="$t('connector.custom.authOAuth')" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.auth_type === 'bearer'" :label="$t('connector.custom.authToken')">
            <el-input
              v-model="form.auth_token"
              type="password"
              show-password
              :placeholder="$t('connector.custom.authTokenPlaceholder')"
            />
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <p class="warning">{{ $t('connector.custom.warning') }}</p>
    <template #footer>
      <div class="footer">
        <el-button :loading="testing" @click="onTest">
          <font-awesome-icon icon="fa-solid fa-link" class="mr-1" />
          {{ $t('connector.custom.test') }}
        </el-button>
        <div class="footer-right">
          <el-button @click="onCancel">{{ $t('connector.custom.cancel') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="onSubmit">
            {{ $t('connector.custom.add') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ElMessage } from 'element-plus';
import { mcpServerOperator } from '@/operators';

interface IForm {
  name: string;
  url: string;
  description: string;
  auth_type: string;
  auth_token: string;
}

export default defineComponent({
  name: 'AddCustomConnectorDialog',
  props: {
    modelValue: { type: Boolean as PropType<boolean>, default: false },
    token: { type: String as PropType<string>, default: '' }
  },
  emits: ['update:modelValue', 'created'],
  data() {
    return {
      submitting: false,
      testing: false,
      advancedOpen: [] as string[],
      form: {
        name: '',
        url: '',
        description: '',
        auth_type: 'none',
        auth_token: ''
      } as IForm
    };
  },
  computed: {
    visible: {
      get(): boolean {
        return this.modelValue;
      },
      set(val: boolean) {
        this.$emit('update:modelValue', val);
      }
    }
  },
  watch: {
    modelValue(val: boolean) {
      if (val) {
        this.reset();
      }
    }
  },
  methods: {
    reset() {
      this.form = {
        name: '',
        url: '',
        description: '',
        auth_type: 'none',
        auth_token: ''
      };
      this.advancedOpen = [];
    },
    onCancel() {
      this.visible = false;
    },
    async onTest() {
      if (!this.form.url) {
        ElMessage.warning(this.$t('connector.custom.urlRequired'));
        return;
      }
      if (!this.token) return;
      this.testing = true;
      try {
        const { data } = await mcpServerOperator.test(
          {
            url: this.form.url,
            auth_type: this.form.auth_type,
            auth_token: this.form.auth_token
          },
          this.token
        );
        if (data.success) {
          ElMessage.success(this.$t('connector.custom.testSuccess', { count: data.tools_count ?? 0 }));
        } else {
          ElMessage.error(data.error || this.$t('connector.custom.testFailed'));
        }
      } catch {
        ElMessage.error(this.$t('connector.custom.testFailed'));
      } finally {
        this.testing = false;
      }
    },
    async onSubmit() {
      if (!this.form.name || !this.form.url) {
        ElMessage.warning(this.$t('connector.custom.urlRequired'));
        return;
      }
      if (!this.token) return;
      this.submitting = true;
      try {
        const { data } = await mcpServerOperator.create(
          {
            name: this.form.name,
            url: this.form.url,
            description: this.form.description,
            auth_type: this.form.auth_type,
            auth_token: this.form.auth_token
          },
          this.token
        );
        ElMessage.success(this.$t('connector.custom.created'));
        this.$emit('created', data);
        this.visible = false;
      } catch {
        ElMessage.error(this.$t('connector.custom.testFailed'));
      } finally {
        this.submitting = false;
      }
    }
  }
});
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  .title {
    font-size: 16px;
    font-weight: 600;
  }
}

.intro {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.warning {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.advanced {
  border-top: none;
  :deep(.el-collapse-item__header) {
    font-size: 13px;
    border-bottom: none;
  }
  :deep(.el-collapse-item__wrap) {
    border-bottom: none;
  }
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-right {
  display: flex;
  gap: 8px;
}
</style>
