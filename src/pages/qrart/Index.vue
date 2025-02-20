<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <application-status
        :initializing="initializing"
        :application="application"
        :applications="applications"
        :service="service"
        :need-apply="needApply"
        class="mb-4"
        @refresh="onGetApplication"
        @select="$store.dispatch('qrart/setApplication', $event)"
      />
      <recent-panel class="panel recent" @reach-top="onReachTop" />
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
import RecentPanel from '@/components/qrart/RecentPanel.vue';
import { IQrartTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/qrart';

interface IData {
  task: IQrartTask | undefined;
  job: number;
  timer: NodeJS.Timer;
}

export default defineComponent({
  name: 'QrartIndex',
  components: {
    ConfigPanel,
    Layout,
    ApplicationStatus,
    RecentPanel
  },
  data(): IData {
    return {
      task: undefined,
      job: 0,
      // @ts-ignore
      timer: undefined
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
    },
    tasks() {
      return this.$store.state.qrart.tasks;
    },
    applications() {
      return this.$store.state.qrart.applications;
    }
  },
  watch: {
    tasks: {
      handler(value, oldValue) {
        // scroll down if new tasks are added
        if (value?.items?.length > oldValue?.items?.length) {
          console.debug('new tasks detected');
          // this.onScrollDown();
        }
      },
      deep: true
    }
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
    await this.onScrollDown();
    await this.onGetTasks();
    // await this.onScrollDown();
    // @ts-ignore
    this.job = setInterval(() => {
      this.onGetTasks();
    }, 5000);
  },
  async unmounted() {
    clearInterval(this.job);
    clearInterval(this.timer);
  },
  methods: {
    async onReachTop() {
      console.debug('reached top');
      await this.onGetTasks({
        createdAtMax: this.tasks?.items?.[0]?.created_at
      });
    },
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
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.loading) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      await this.$store.dispatch('qrart/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
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
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
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
