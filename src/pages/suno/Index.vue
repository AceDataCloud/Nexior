<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerateAudio" />
    </template>
    <template #result>
      <recent-panel class="panel recent" @reach-top="onReachTop" />
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
import { ISunoTask } from '@/models';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import ConfigPanel from '@/components/suno/ConfigPanel.vue';
import RecentPanel from '@/components/suno/RecentPanel.vue';
import PreviewPanel from '@/components/suno/PreviewPanel.vue';

const CALLBACK_URL = 'https://webhook.acedata.cloud/suno';

interface IData {
  task: ISunoTask | undefined;
  job: number;
  timer: any;
}

export default defineComponent({
  name: 'SunoIndex',
  components: {
    Layout,
    ConfigPanel,
    RecentPanel,
    PreviewPanel
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
      return this.$store.state.suno?.status?.getApplications === Status.Request;
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
      return this.$store.state.suno.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.suno.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.suno.application;
    },
    tasks() {
      return this.$store.state.suno.tasks;
    },
    applications() {
      return this.$store.state.suno.applications;
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
      await this.$store.dispatch('suno/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplications');
      await this.$store.dispatch('suno/getApplications');
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
      }, 1000);
    },
    async onGetTasks(payload?: { limit?: number; createdAtMin?: number; createdAtMax?: number }) {
      if (this.loading) {
        console.debug('loading');
        return;
      }
      console.debug('start onGetTasks', payload);
      const { limit = 5, createdAtMin, createdAtMax } = payload || {};
      console.debug('limit', limit, 'createdAtMin', createdAtMin, 'createdAtMax', createdAtMax);
      await this.$store.dispatch('suno/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
    },
    async onGenerateAudio() {
      const request = {
        ...this.config,
        callback_url: CALLBACK_URL
      } as ISunoAudioRequest;
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('suno.message.startingTask'));
      sunoOperator
        .audio(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('suno.message.startTaskSuccess'));
        })
        .catch((error) => {
          ElMessage.error(error?.response?.data?.error?.message || this.$t('suno.message.startTaskFailed'));
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
