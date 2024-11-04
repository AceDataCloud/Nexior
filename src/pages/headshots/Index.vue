<template>
  <layout>
    <template #config>
      <config-panel @generate="onGeneratePicture" />
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
      <!-- <operation-panel class="panel operation" @generate="onGenerate" /> -->
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Headshots.vue';
import ConfigPanel from '@/components/headshots/ConfigPanel.vue';
import { applicationOperator, headshotsOperator } from '@/operators';
import { IApplicationDetailResponse, IHeadshotsGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import RecentPanel from '@/components/headshots/RecentPanel.vue';
import { IHeadshotsTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/headshots';

interface IData {
  task: IHeadshotsTask | undefined;
  job: number;
}

export default defineComponent({
  name: 'HeadshotsIndex',
  components: {
    ConfigPanel,
    Layout,
    ApplicationStatus,
    RecentPanel
  },
  data(): IData {
    return {
      task: undefined,
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.headshots?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.headshots.service;
    },
    credential() {
      return this.$store.state.headshots.credential;
    },
    config() {
      return this.$store.state.headshots.config;
    },
    initializing() {
      return this.$store.state.headshots.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.headshots.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.headshots.application;
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
      await this.$store.dispatch('headshots/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('headshots/getApplications');
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
    async onGetTasks() {
      if (this.loading) {
        console.debug('loading');
        return;
      }
      await this.$store.dispatch('headshots/getTasks', {
        limit: 30,
        offset: 0
      });
    },
    async onGeneratePicture() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as IHeadshotsGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('headshots.message.startingTask'));
      headshotsOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('headshots.message.startTaskSuccess'));
          this.$store.commit('headshots/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('headshots.message.usedUp'));
          } else {
            ElMessage.error(this.$t('headshots.message.startTaskFailed'));
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
