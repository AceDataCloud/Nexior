<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerateVideo" />
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
        @select="$store.dispatch('kling/setApplication', $event)"
      />
      <recent-panel class="panel recent" @reach-top="onReachTop" />
      <!-- <operation-panel class="panel operation" @generate="onGenerate" /> -->
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Kling.vue';
import ConfigPanel from '@/components/kling/ConfigPanel.vue';
import { applicationOperator, klingOperator } from '@/operators';
import { IApplicationDetailResponse, IKlingGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import RecentPanel from '@/components/kling/RecentPanel.vue';
import { IKlingTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/kling';

interface IData {
  task: IKlingTask | undefined;
  job: number;
  timer: NodeJS.Timer;
}

export default defineComponent({
  name: 'KlingIndex',
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
      return this.$store.state.kling?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.kling.service;
    },
    credential() {
      return this.$store.state.kling.credential;
    },
    config() {
      return this.$store.state.kling.config;
    },
    initializing() {
      return this.$store.state.kling.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.kling.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.kling.application;
    },
    applications() {
      return this.$store.state.kling.applications;
    },
    tasks() {
      return this.$store.state.kling.tasks;
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
      await this.$store.dispatch('kling/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('kling/getApplications');
      console.debug('end onGetApplication');
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
      await this.$store.dispatch('kling/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerateVideo() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as IKlingGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('kling.message.startingTask'));
      klingOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('kling.message.startTaskSuccess'));
          this.$store.commit('kling/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('kling.message.usedUp'));
          } else {
            ElMessage.error(this.$t('kling.message.startTaskFailed'));
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
