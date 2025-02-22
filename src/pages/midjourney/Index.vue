<template>
  <layout>
    <template #presets>
      <config-panel @generate="onGenerate" />
    </template>
    <template #operation>
      <div class="top">
        <application-status
          :initializing="initializing"
          :application="application"
          :applications="applications"
          :service="service"
          :need-apply="needApply"
          @refresh="onGetApplication"
          @select="$store.dispatch('midjourney/setApplication', $event)"
        />
        <task-list @custom="onCustom" @reach-top="onReachTop" />
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Midjourney.vue';
import ConfigPanel from '@/components/midjourney/ConfigPanel.vue';
import { ElMessage, ElCard } from 'element-plus';
import { applicationOperator, midjourneyOperator } from '@/operators';
import ApplicationStatus from '@/components/application/Status.vue';
import TaskList from '@/components/midjourney/tasks/TaskList.vue';
import { ERROR_CODE_DUPLICATION, ERROR_CODE_FORBIDDEN, ERROR_CODE_USED_UP } from '@/constants/errorCode';
import { Status } from '@/models';
import { IMidjourneyImagineRequest, IApplicationDetailResponse, MidjourneyImagineAction } from '@/models';
import {
  MIDJOURNEY_DEFAULT_IMAGE_WEIGHT,
  MIDJOURNEY_DEFAULT_RATIO,
  MIDJOURNEY_DEFAULT_STYLIZE,
  MIDJOURNEY_DEFAULT_WIRED,
  MIDJOURNEY_DEFAULT_MODE,
  MIDJOURNEY_DEFAULT_QUALITY
} from '@/constants';

interface IData {
  operating: boolean;
  job: number;
  timer: NodeJS.Timer;
}

const CALLBACK_URL = 'https://webhook.acedata.cloud/midjourney';

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ConfigPanel,
    ApplicationStatus,
    TaskList,
    Layout
  },
  data(): IData {
    return {
      operating: false,
      job: 0,
      // @ts-ignore
      timer: undefined
    };
  },
  computed: {
    tasks() {
      return this.$store.state.midjourney.tasks;
    },
    service() {
      return this.$store.state.midjourney.service;
    },
    credential() {
      return this.$store.state.midjourney.credential;
    },
    config() {
      return this.$store.state.midjourney.config;
    },
    loading() {
      return this.$store.state.midjourney.status.getApplications === Status.Request;
    },
    initializing() {
      return this.$store.state.midjourney.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state.midjourney.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.midjourney.application;
    },
    applications() {
      return this.$store.state.midjourney.applications;
    },
    finalPrompt(): string {
      let content = '';
      if (this.config.references && this.config.references?.length > 0) {
        content += `${this.config.references.join(' ')} `;
      }
      if (this.config.prompt) {
        content += this.config.prompt;
      }
      if (this.config.elements && this.config.elements.length > 0) {
        content += ',' + this.config.elements.map((item) => item.value).join(',');
      }
      if (this.config?.model && !content.includes(`--${this.config.model}`)) {
        content += ` --${this.config.model}`;
      }
      if (this.config?.version && !content.includes(`--version `) && !content.includes(`--v `)) {
        content += ` --version ${this.config.version}`;
      }
      if (this.config?.chaos && this.config?.advanced && !content.includes(`--chaos `)) {
        content += ` --chaos ${this.config.chaos}`;
      }
      if (
        this.config?.quality &&
        !content.includes(`--quality `) &&
        !content.includes(`--q `) &&
        this.config?.quality !== MIDJOURNEY_DEFAULT_QUALITY
      ) {
        content += ` --quality ${this.config.quality}`;
      }
      if (
        this.config?.ratio &&
        !content.includes(`--aspect `) &&
        !content.includes(`--ar `) &&
        this.config?.ratio !== MIDJOURNEY_DEFAULT_RATIO
      ) {
        content += ` --aspect ${this.config.ratio}`;
      }
      if (
        this.config?.stylize &&
        !content.includes(`--stylize `) &&
        !content.includes(`--s `) &&
        this.config?.advanced &&
        this.config?.stylize !== MIDJOURNEY_DEFAULT_STYLIZE
      ) {
        content += ` --stylize ${this.config?.stylize}`;
      }
      if (
        this.config?.weird &&
        !content.includes(`--weird `) &&
        !content.includes(`--w `) &&
        this.config?.advanced &&
        this.config?.weird !== MIDJOURNEY_DEFAULT_WIRED
      ) {
        content += ` --weird ${this.config.weird}`;
      }
      if (this.config.ignore && !content.includes(`--no `)) {
        content += ` --no ${this.config.ignore}`;
      }
      if (
        this.config?.iw &&
        !content.includes(`--iw `) &&
        this.config?.advanced &&
        this.config?.iw !== MIDJOURNEY_DEFAULT_IMAGE_WEIGHT
      ) {
        content += ` --iw ${this.config.iw}`;
      }
      if (this.config?.style && this.config?.advanced && !content.includes(`--style`)) {
        content += ` --style ${this.config?.style}`;
      }
      // remove `--fast`, `--relax`, `--turbo`
      content = content.replace(/--(fast|relax|turbo) /g, '');
      return this.config.prompt || (this.config.references && this.config.references?.length > 0) ? content : '';
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
      console.debug('ddasdasdreached top');
      await this.onGetTasks({
        createdAtMax: this.tasks?.items?.[0]?.created_at
      });
    },
    async onGetService() {
      console.debug('start onGetService');
      await this.$store.dispatch('midjourney/getService');
      console.debug('end onGetService');
    },
    async onGetApplication() {
      console.debug('start onGetApplications');
      await this.$store.dispatch('midjourney/getApplications');
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
    async onStartTask(request: IMidjourneyImagineRequest) {
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.info(this.$t('midjourney.message.startingTask'));
      midjourneyOperator
        .imagine(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('midjourney.message.startTaskSuccess'));
        })
        .catch((error) => {
          const response = error?.response?.data;
          if (response?.error?.code === ERROR_CODE_USED_UP) {
            ElMessage.error(this.$t('midjourney.message.usedUp'));
          } else {
            ElMessage.error(this.$t('midjourney.message.startTaskFailed'));
          }
        })
        .finally(async () => {
          setTimeout(async () => {
            await this.onGetTasks();
            await this.onScrollDown();
          }, 1000);
          // await this.onGetTasks();
          // await this.onScrollDown();
        });
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = {
        image_id: payload.image_id,
        action: payload.action,
        mode: this.config?.mode || MIDJOURNEY_DEFAULT_MODE,
        callback_url: CALLBACK_URL
      };
      this.onStartTask(request);
    },
    async onGenerate() {
      const request = {
        mode: this.config?.mode || MIDJOURNEY_DEFAULT_MODE,
        prompt: this.finalPrompt,
        action: MidjourneyImagineAction.GENERATE,
        translation: this.config?.translation,
        callback_url: CALLBACK_URL
      };
      await this.onStartTask(request);
    },
    async onScrollDown() {
      await this.$nextTick(); // 确保 DOM 更新完成后再执行滚动操作
      setTimeout(() => {
        // scroll to bottom for `.tasks`
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
      await this.$store.dispatch('midjourney/getTasks', {
        limit,
        createdAtMin,
        createdAtMax
      });
      // await this.$store.dispatch('midjourney/getTasks', {
      //   limit: 30,
      //   offset: 0
      // });
    }
  }
});
</script>

<style lang="scss" scoped>
.top {
  flex: 1;
  height: calc(100% - 50px);
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
  padding-bottom: 10px;
}
.bottom {
  height: 50px;
  width: 100%;
  position: relative;
  .btn {
    height: 40px;
    width: 100%;
  }
  .operations {
    position: absolute;
    width: 100%;
    max-height: 650px;
    bottom: 60px;
    left: 0;
  }
}
</style>
