<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <application-status
        :initializing="initializing"
        :application="application"
        :service="service"
        :need-apply="needApply"
        class="mb-4"
        @refresh="onGetApplication"
      />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Qrart.vue';
import ConfigPanel from '@/components/qrart/ConfigPanel.vue';
import { applicationOperator, qrartOperator } from '@/operators';
import { IApplicationDetailResponse, IQrartGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';

const CALLBACK_URL = 'https://webhook.acedata.cloud/qrart';

export default defineComponent({
  name: 'QrartIndex',
  components: {
    ConfigPanel,
    Layout,
    ApplicationStatus
  },
  data() {
    return {};
  },
  computed: {
    service() {
      return this.$store.state.qrart.service;
    },
    mode() {
      return this.$store.state.qrart.mode;
    },
    credential() {
      return this.$store.state.qrart.credential;
    },
    config() {
      return this.$store.state.qrart.config;
    },
    initializing() {
      return this.$store.state.qrart.status.getApplication === Status.Request;
    },
    needApply() {
      return this.$store.state.qrart.status.getApplication === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.qrart.application;
    }
  },
  methods: {
    onApply() {
      applicationOperator
        .create({
          // @ts-ignore
          application: this.application
        })
        .then(({ data: data }: { data: IApplicationDetailResponse }) => {
          this.application = data;
          ElMessage.success(this.$t('application.message.applySuccessfully'));
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
        });
    },
    async onGetApplication() {
      await this.$store.dispatch('qrart/getApplication');
    },
    async onGenerate() {
      const request = {
        type: this.config?.type,
        content: this.config?.content,
        prompt: this.config?.prompt,
        aspect_ratio: this.config?.aspect_ratio,
        callback_url: CALLBACK_URL
      } as IQrartGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.success(this.$t('qrart.message.startingTask'));
      qrartOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('qrart.message.startTaskSuccess'));
        })
        .catch(() => {
          ElMessage.error(this.$t('qrart.message.startTaskFailed'));
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.operation {
  flex: 1;
  padding: 15px;
  height: 100%;
  overflow-x: scroll;
  .title {
    font-size: 14px;
    margin-bottom: 10px;
  }
  .btn.btn-generate {
    width: 80px;
    border-radius: 20px;
  }
}
</style>
