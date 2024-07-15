<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerateAudio" />
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
    </template>
    <template #preview>
      <preview-panel />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Suno.vue';
import { applicationOperator, sunoOperator } from '@/operators';
import { IApplicationDetailResponse, ISunoAudioRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import ApplicationStatus from '@/components/application/Status.vue';
import { ISunoTask } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import ConfigPanel from '@/components/suno/ConfigPanel.vue';
import RecentPanel from '@/components/suno/RecentPanel.vue';
import PreviewPanel from '@/components/suno/PreviewPanel.vue';

const CALLBACK_URL = 'https://webhook.acedata.cloud/suno';

interface IData {
  task: ISunoTask | undefined;
  job: number;
}

export default defineComponent({
  name: 'SunoIndex',
  components: {
    Layout,
    ApplicationStatus,
    ConfigPanel,
    RecentPanel,
    PreviewPanel
  },
  data(): IData {
    return {
      task: undefined,
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.suno?.status?.getApplication === Status.Request;
    },
    service() {
      return this.$store.state.suno.service;
    },
    credential() {
      return this.$store.state.suno.credential;
    },
    config() {
      return this.$store.state.suno.config;
    },
    initializing() {
      return this.$store.state.suno.status.getApplication === Status.Request;
    },
    needApply() {
      return this.$store.state.suno.status.getApplication === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.suno.application;
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
      await this.$store.dispatch('suno/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplication');
      await this.$store.dispatch('suno/getApplication');
      console.debug('end onGetApplication');
    },
    // 申请服务
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
        // scroll to bottom for `.tasks`
        const el = document.querySelector('.tasks');
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
      await this.$store.dispatch('suno/getTasks', {
        limit: 30,
        offset: 0
      });
    },
    // 调用生成歌曲的接口
    async onGenerateAudio() {
      const request = {
        ...this.config,
        callbackUrl: CALLBACK_URL
      } as ISunoAudioRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.success(this.$t('suno.message.startingTask'));
      sunoOperator
        .audio(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('suno.message.startTaskSuccess'));
        })
        .catch(() => {
          ElMessage.error(this.$t('suno.message.startTaskFailed'));
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
