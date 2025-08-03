<template>
  <layout>
    <template #config>
      <config-panel @generate="onGenerate" />
    </template>
    <template #result>
      <recent-panel @reach-top="onReachTop" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Luma.vue';
import ConfigPanel from '@/components/luma/ConfigPanel.vue';
import { lumaOperator } from '@/operators';
import { ILumaGenerateRequest, Status } from '@/models';
import { ElMessage } from 'element-plus';
import { ERROR_CODE_USED_UP } from '@/constants';
import RecentPanel from '@/components/luma/RecentPanel.vue';
import { ILumaTask } from '@/models';

const CALLBACK_URL = 'https://webhook.acedata.cloud/luma';

interface IData {
  task: ILumaTask | undefined;
  job: number;
}

export default defineComponent({
  name: 'LumaIndex',
  components: {
    ConfigPanel,
    Layout,
    RecentPanel
  },
  inject: ['initialized'],
  data(): IData {
    return {
      task: undefined,
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.luma?.status?.getApplications === Status.Request;
    },
    credential() {
      return this.$store.state.luma.credential;
    },
    config() {
      return this.$store.state.luma.config;
    },
    application() {
      return this.$store.state.luma.application;
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
    },
    initialized: {
      async handler(newValue) {
        if (newValue) {
          console.debug('layout initialized');
          await this.onGetTasks();
          await this.onScrollDown();
          this.job = setInterval(() => {
            this.onGetTasks();
          }, 5000);
        }
      },
      immediate: true
    }
  },
  async mounted() {
    await this.onGetService();
  },
  async unmounted() {
    clearInterval(this.job);
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
    async onScrollDown() {
      console.debug('scrolling down');
      setTimeout(() => {
        const el = document.querySelector('.tasks');
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
    async onGenerate() {
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
