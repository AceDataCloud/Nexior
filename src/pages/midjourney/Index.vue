<template>
  <layout>
    <template #presets>
      <preset-panel />
    </template>
    <template #operation>
      <div class="top">
        <mode-selector class="mb-4" />
        <application-status
          :initializing="initializing"
          :application="application"
          :service="service"
          :need-apply="needApply"
          class="mb-4"
          @refresh="onGetApplication"
        />
        <reference-image class="mb-4" @change="references = $event" />
        <prompt-input v-model="prompt" class="mb-4" />
        <elements-selector v-model="elements" :advanced="preset?.advanced" class="mb-4" />
        <ignore-selector v-if="preset?.advanced" v-model="ignore" class="mb-4" />
        <final-prompt v-if="finalPrompt" :model-value="finalPrompt" />
      </div>
      <div class="bottom">
        <el-button type="primary" round class="btn btn-generate" :disabled="!finalPrompt" @click="onGenerate">
          <font-awesome-icon icon="fa-solid fa-magic" class="mr-2" />
          {{ $t('midjourney.button.generate') }}
        </el-button>
      </div>
    </template>
    <template #results>
      <task-brief-list @custom="onCustom" @refresh="onGetApplication" />
    </template>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Layout from '@/layouts/Midjourney.vue';
import PresetPanel from '@/components/midjourney/PresetPanel.vue';
import PromptInput from '@/components/midjourney/PromptInput.vue';
import ElementsSelector from '@/components/midjourney/ElementsSelector.vue';
import IgnoreSelector from '@/components/midjourney/IgnoreSelector.vue';
import { ElButton, ElMessage } from 'element-plus';
import ModeSelector from '@/components/midjourney/ModeSelector.vue';
import ReferenceImage from '@/components/midjourney/ReferenceImage.vue';
import { applicationOperator, midjourneyOperator } from '@/operators';
import ApplicationStatus from '@/components/application/Status.vue';
import TaskBriefList from '@/components/midjourney/tasks/TaskBriefList.vue';
import FinalPrompt from '@/components/midjourney/FinalPrompt.vue';
import { ERROR_CODE_DUPLICATION } from '@/constants/errorCode';
import { MidjourneyImagineMode, Status } from '@/models';
import { IMidjourneyImagineRequest, IApplicationDetailResponse, MidjourneyImagineAction } from '@/models';
import {
  MIDJOURNEY_DEFAULT_IMAGE_WEIGHT,
  MIDJOURNEY_DEFAULT_RATIO,
  MIDJOURNEY_DEFAULT_STYLIZE,
  MIDJOURNEY_DEFAULT_WIRED
} from '@/constants';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  prompt: string;
  elements: string[];
  ignore: string;
  references: string[];
}

const CALLBACK_URL = 'https://webhook.acedata.cloud/midjourney';

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ModeSelector,
    ReferenceImage,
    FontAwesomeIcon,
    PresetPanel,
    PromptInput,
    ElementsSelector,
    IgnoreSelector,
    ElButton,
    ApplicationStatus,
    TaskBriefList,
    FinalPrompt,
    Layout
  },
  data(): IData {
    return {
      prompt: '',
      elements: [],
      ignore: '',
      references: []
    };
  },
  computed: {
    service() {
      return this.$store.state.midjourney.service;
    },
    mode() {
      return this.$store.state.midjourney.mode;
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
      if (this.preset?.quality && !content.includes(`--quality `) && !content.includes(`--q `)) {
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
      return this.prompt || this.references?.length > 0 ? content : '';
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
        });
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = {
        image_id: payload.image_id,
        action: payload.action,
        mode: this.mode.name as MidjourneyImagineMode,
        callback_url: CALLBACK_URL
      };
      this.onStartTask(request);
    },
    async onGenerate() {
      const request = {
        mode: this.mode.name as MidjourneyImagineMode,
        prompt: this.finalPrompt,
        action: MidjourneyImagineAction.GENERATE,
        translation: this.preset?.translation,
        callback_url: CALLBACK_URL
      };
      this.onStartTask(request);
    }
  }
});
</script>

<style lang="scss" scoped>
.top {
  flex: 1;
  height: calc(100% - 40px);
  margin-bottom: 5px;
  overflow-y: scroll;
}
.bottom {
  height: 40px;
  width: 100%;
  .btn {
    height: 40px;
    width: 100%;
  }
}
</style>
