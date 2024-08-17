<template>
  <layout>
    <template #config>
      <config-panel />
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
      <recent-panel class="panel recent" />
      <operation-panel class="panel operation" @generate="onGenerate" />
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
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import OperationPanel from '@/components/qrart/OperationPanel.vue';
import RecentPanel from '@/components/qrart/RecentPanel.vue';
import { IQrartTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/qrart';

interface IData {
  task: IQrartTask | undefined;
  job: number;
}

export default defineComponent({
  name: 'QrartIndex',
  components: {
    ConfigPanel,
    Layout,
    ApplicationStatus,
    RecentPanel,
    OperationPanel
  },
  data(): IData {
    return {
      task: undefined,
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.qrart?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.qrart.service;
    },
    credential() {
      return this.$store.state.qrart.credential;
    },
    config() {
      return this.$store.state.qrart.config;
    },
    initializing() {
      return this.$store.state.qrart.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.qrart.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.qrart.application;
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    await this.onScrollDown();
    await this.onGetTasks();
    await this.onScrollDown();
    // @ts-ignore
    this.job = setInterval(() => {
      this.onGetTasks();
    }, 5000);
  },
  async unmounted() {
    clearInterval(this.job);
  },
  methods: {
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('qrart/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplications');
      await this.$store.dispatch('qrart/getApplications');
      console.debug('end onGetApplications');
      await this.onGetTasks();
    },
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
    async onScrollDown() {
      setTimeout(() => {
        // scroll to bottom for `.recent`
        const el = document.querySelector('.recent');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 500);
    },
    async onGetTasks() {
      if (this.loading) {
        console.debug('loading');
        return;
      }
      await this.$store.dispatch('qrart/getTasks', {
        limit: 30,
        offset: 0
      });
    },
    async onGenerate() {
      const request = {
        type: this.config?.type,
        content: this.config?.content,
        content_image_url: this.config?.content_image_url,
        prompt: this.config?.prompt,
        aspect_ratio: this.config?.aspect_ratio,
        callback_url: CALLBACK_URL,
        qrw: this.config?.qrw,
        steps: this.config?.steps,
        preset: this.config?.preset,
        ...(this.config?.advanced
          ? {
              position: this.config?.position,
              pixel_style: this.config?.pixel_style,
              marker_shape: this.config?.marker_shape,
              sub_marker: this.config?.sub_marker,
              rotate: this.config?.rotate,
              ecl: this.config?.ecl,
              seed: this.config?.seed,
              padding_level: this.config?.padding_level,
              padding_noise: this.config?.padding_noise
            }
          : {})
      } as IQrartGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('qrart.message.startingTask'));
      qrartOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('qrart.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('qrart.message.usedUp'));
          } else {
            ElMessage.error(this.$t('qrart.message.startTaskFailed'));
          }
        })
        .finally(async () => {
          await this.onGetTasks();
          await this.onScrollDown();
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.status {
  margin-bottom: 10px;
}

.panel {
  &.detail {
    width: 100%;
    flex: 1;
    overflow-y: scroll;
  }
  &.recent {
    height: 100%;
    width: 100%;
    margin-bottom: 10px;
    position: relative;
    justify-content: initial;
  }
  &.operation {
    position: relative;
  }
}
</style>
