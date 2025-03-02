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
        @select="$store.dispatch('luma/setApplication', $event)"
      />
      <recent-panel class="panel recent" @reach-top="onReachTop" />
      <!-- <operation-panel class="panel operation" @generate="onGenerate" /> -->
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Luma.vue';
import ConfigPanel from '@/components/luma/ConfigPanel.vue';
import { applicationOperator, lumaOperator } from '@/operators';
import { IApplicationDetailResponse, ILumaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import RecentPanel from '@/components/luma/RecentPanel.vue';
import { ILumaTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/luma';

interface IData {
  task: ILumaTask | undefined;
  job: number;
  timer: NodeJS.Timer;
}

export default defineComponent({
  name: 'LumaIndex',
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
      return this.$store.state.luma?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.luma.service;
    },
    credential() {
      return this.$store.state.luma.credential;
    },
    config() {
      return this.$store.state.luma.config;
    },
    initializing() {
      return this.$store.state.luma.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.luma.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.luma.application;
    },
    applications() {
      return this.$store.state.luma.applications;
    },
    tasks() {
      return this.$store.state.luma.tasks;
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
      await this.$store.dispatch('luma/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('luma/getApplications');
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
      await this.$store.dispatch('luma/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerateVideo() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as ILumaGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('luma.message.startingTask'));
      lumaOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('luma.message.startTaskSuccess'));
          this.$store.commit('luma/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('luma.message.usedUp'));
          } else {
            ElMessage.error(this.$t('luma.message.startTaskFailed'));
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
