<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerateVideo" />
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
import Layout from '@/layouts/Pika.vue';
import ConfigPanel from '@/components/pika/ConfigPanel.vue';
import { applicationOperator, pikaOperator } from '@/operators';
import { IApplicationDetailResponse, IPikaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_USED_UP } from '@/constants';
import ApplicationStatus from '@/components/application/Status.vue';
import RecentPanel from '@/components/pika/RecentPanel.vue';
import { IPikaTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/pika';

interface IData {
  task: IPikaTask | undefined;
  job: number;
}

export default defineComponent({
  name: 'PikaIndex',
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
      return this.$store.state.pika?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state.pika.service;
    },
    credential() {
      return this.$store.state.pika.credential;
    },
    config() {
      return this.$store.state.pika.config;
    },
    initializing() {
      return this.$store.state.pika.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.pika.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.pika.application;
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
      await this.$store.dispatch('pika/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('pika/getApplications');
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
      await this.$store.dispatch('pika/getTasks', {
        limit: 30,
        offset: 0
      });
    },
    async onGenerateVideo() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as IPikaGenerateRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('pika.message.startingTask'));
      pikaOperator
        .generate(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('pika.message.startTaskSuccess'));
          this.$store.commit('pika/setConfig', {
            config: undefined
          });
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('pika.message.usedUp'));
          } else {
            ElMessage.error(this.$t('pika.message.startTaskFailed'));
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
