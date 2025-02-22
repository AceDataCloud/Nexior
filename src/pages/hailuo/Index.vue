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
        @select="$store.dispatch('hailuo/setApplication', $event)"
      />
      <recent-panel class="panel recent" @reach-top="onReachTop" />
      <!-- <operation-panel class="panel operation" @generate="onGenerate" /> -->
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Hailuo.vue';
import ConfigPanel from '@/components/hailuo/ConfigPanel.vue';
import { applicationOperator, hailuoOperator } from '@/operators';
import { IApplicationDetailResponse, IHailuoGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import RecentPanel from '@/components/hailuo/RecentPanel.vue';
import { IHailuoTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/hailuo';

interface IData {
  task: IHailuoTask | undefined;
  job: number;
  timer: NodeJS.Timer;
}

export default defineComponent({
  name: 'HailuoIndex',
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
      return this.$store.state.hailuo?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.hailuo.service;
    },
    credential() {
      return this.$store.state.hailuo.credential;
    },
    config() {
      return this.$store.state.hailuo.config;
    },
    initializing() {
      return this.$store.state.hailuo.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.hailuo.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.hailuo.application;
    },
    applications() {
      return this.$store.state.hailuo.applications;
    },
    tasks() {
      return this.$store.state.hailuo.tasks;
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
    await this.onScrollDown();
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
      await this.$store.dispatch('hailuo/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('hailuo/getApplications');
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
      await this.$store.dispatch('hailuo/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerateVideo() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as IHailuoGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('hailuo.message.startingTask'));
      hailuoOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('hailuo.message.startTaskSuccess'));
          this.$store.commit('hailuo/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('hailuo.message.usedUp'));
          } else {
            ElMessage.error(this.$t('hailuo.message.startTaskFailed'));
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
