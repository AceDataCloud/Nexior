<template>
  <layout>
    <template #presets>
      <preset-panel />
    </template>
    <template #operation>
      <div class="top">
        <application-status
          :initializing="initializing"
          :application="application"
          :service="service"
          :need-apply="needApply"
          class="mb-4"
          @refresh="onGetApplication"
        />
        <task-list @custom="onCustom" @refresh="onGetApplication" />
      </div>
      <div class="bottom">
        <el-card v-show="operating" class="operations">
          <reference-image class="mb-4" @change="references = $event" />
          <elements-selector v-model="elements" :advanced="preset?.advanced" class="mb-4" />
          <ignore-selector v-if="preset?.advanced" v-model="ignore" class="mb-4" />
          <final-prompt v-if="finalPrompt" :model-value="finalPrompt" />
        </el-card>
        <input-box
          :prompt="prompt"
          class="mb-4"
          @open-panel="operating = true"
          @close-panel="operating = false"
          @toggle-panel="operating = !operating"
          @update:prompt="prompt = $event"
          @submit="onGenerate"
        />
      </div>
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Midjourney.vue';
import PresetPanel from '@/components/midjourney/PresetPanel.vue';
import ElementsSelector from '@/components/midjourney/ElementsSelector.vue';
import IgnoreSelector from '@/components/midjourney/IgnoreSelector.vue';
import { ElMessage, ElCard } from 'element-plus';
import ReferenceImage from '@/components/midjourney/ReferenceImage.vue';
import { applicationOperator, midjourneyOperator } from '@/operators';
import ApplicationStatus from '@/components/application/Status.vue';
import TaskList from '@/components/midjourney/tasks/TaskList.vue';
import FinalPrompt from '@/components/midjourney/FinalPrompt.vue';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
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
import InputBox from '@/components/midjourney/InputBox.vue';

interface IData {
  prompt: string;
  elements: string[];
  ignore: string;
  references: string[];
  operating: boolean;
}

const CALLBACK_URL = 'https://webhook.acedata.cloud/midjourney';

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ElCard,
    ReferenceImage,
    PresetPanel,
    InputBox,
    ElementsSelector,
    IgnoreSelector,
    ApplicationStatus,
    TaskList,
    FinalPrompt,
    Layout
  },
  data(): IData {
    return {
      prompt: '',
      elements: [],
      ignore: '',
      references: [],
      operating: false
    };
  },
  computed: {
    imagineTasks() {
      return this.$store.state.midjourney.imagineTasks;
    },
    service() {
      return this.$store.state.midjourney.service;
    },
    credential() {
      return this.$store.state.midjourney.credential;
    },
    preset() {
      return this.$store.state.midjourney.preset;
    },
    initializing() {
      return this.$store.state.midjourney.status.getApplication === Status.Request;
    },
    needApply() {
      return this.$store.state.midjourney.status.getApplication === Status.Success && !this.application;
    },
    application() {
      return this.$store.state.midjourney.application;
    },
    finalPrompt(): string {
      let content = '';
      if (this.references.length > 0) {
        content += `${this.references.join(' ')} `;
      }
      if (this.prompt) {
        content += this.prompt;
      }
      if (this.elements.length > 0) {
        content += ',' + this.elements.join(',');
      }
      if (this.preset?.model && !content.includes(`--${this.preset.model}`)) {
        content += ` --${this.preset.model}`;
      }
      if (this.preset?.version && !content.includes(`--version `) && !content.includes(`--v `)) {
        content += ` --version ${this.preset.version}`;
      }
      if (this.preset?.chaos && this.preset?.advanced && !content.includes(`--chaos `)) {
        content += ` --chaos ${this.preset.chaos}`;
      }
      if (
        this.preset?.quality &&
        !content.includes(`--quality `) &&
        !content.includes(`--q `) &&
        this.preset?.quality !== MIDJOURNEY_DEFAULT_QUALITY
      ) {
        content += ` --quality ${this.preset.quality}`;
      }
      if (
        this.preset?.ratio &&
        !content.includes(`--aspect `) &&
        !content.includes(`--ar `) &&
        this.preset?.ratio !== MIDJOURNEY_DEFAULT_RATIO
      ) {
        content += ` --aspect ${this.preset.ratio}`;
      }
      if (
        this.preset?.stylize &&
        !content.includes(`--stylize `) &&
        !content.includes(`--s `) &&
        this.preset?.advanced &&
        this.preset?.stylize !== MIDJOURNEY_DEFAULT_STYLIZE
      ) {
        content += ` --stylize ${this.preset?.stylize}`;
      }
      if (
        this.preset?.weird &&
        !content.includes(`--weird `) &&
        !content.includes(`--w `) &&
        this.preset?.advanced &&
        this.preset?.weird !== MIDJOURNEY_DEFAULT_WIRED
      ) {
        content += ` --weird ${this.preset.weird}`;
      }
      if (this.ignore && !content.includes(`--no `)) {
        content += ` --no ${this.ignore}`;
      }
      if (
        this.preset?.iw &&
        !content.includes(`--iw `) &&
        this.preset?.advanced &&
        this.preset?.iw !== MIDJOURNEY_DEFAULT_IMAGE_WEIGHT
      ) {
        content += ` --iw ${this.preset.iw}`;
      }
      if (this.preset?.style && this.preset?.advanced && !content.includes(`--style`)) {
        content += ` --style ${this.preset?.style}`;
      }
      // remove `--fast`, `--relax`, `--turbo`
      content = content.replace(/--(fast|relax|turbo) /g, '');
      return this.prompt || this.references?.length > 0 ? content : '';
    }
  },
  watch: {
    imagineTasks: {
      handler(val, oldVal) {
        if (oldVal === undefined && val) {
          this.onScrollDown();
        }
      },
      deep: true
    }
  },
  methods: {
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
    async onGetApplication() {
      await this.$store.dispatch('midjourney/getApplication');
    },
    async onStartTask(request: IMidjourneyImagineRequest) {
      const token = this.credential?.token;
      if (!token) {
        console.error('no token specified');
        return;
      }
      ElMessage.success(this.$t('midjourney.message.startingTask'));
      midjourneyOperator
        .imagine(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('midjourney.message.startTaskSuccess'));
        })
        .catch(() => {
          ElMessage.error(this.$t('midjourney.message.startTaskFailed'));
        })
        .finally(async () => {
          await this.onSyncTasks();
          await this.onScrollDown();
        });
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = {
        image_id: payload.image_id,
        action: payload.action,
        mode: this.preset?.mode || MIDJOURNEY_DEFAULT_MODE,
        callback_url: CALLBACK_URL
      };
      this.onStartTask(request);
    },
    async onGenerate() {
      const request = {
        mode: this.preset?.mode || MIDJOURNEY_DEFAULT_MODE,
        prompt: this.finalPrompt,
        action: MidjourneyImagineAction.GENERATE,
        translation: this.preset?.translation,
        callback_url: CALLBACK_URL
      };
      await this.onStartTask(request);
      this.prompt = '';
      this.elements = [];
      this.references = [];
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
    async onSyncTasks() {
      await this.$store.dispatch('midjourney/getImagineTasks', {
        limit: 50,
        offset: 0
      });
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
    max-height: 400px;
    bottom: 60px;
    left: 0;
  }
}
</style>
