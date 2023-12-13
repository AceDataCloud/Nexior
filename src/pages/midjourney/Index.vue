<template>
  <div class="page">
    <div class="presets">
      <preset-panel v-model="preset" />
    </div>
    <div class="main">
      <reference-image class="mb-4" />
      <channel-selector v-model="channel" class="mb-4" @select="onSelectChannel" />
      <api-status :application="application" class="mb-4" />
      <prompt-input v-model="prompt" class="mb-4" />
      <elements-selector v-model="elements" :advanced="preset.advanced" class="mb-4" />
      <ignore-selector v-if="preset.advanced" v-model="ignore" class="mb-4" />
      <final-prompt v-if="finalPrompt" :model-value="finalPrompt" />
      <el-button type="primary" :disabled="!finalPrompt" @click="onGenerate"> 生成 </el-button>
    </div>
    <div class="tasks">
      <task-brief-list v-model:active-task="task" :applications="applications" @custom="onCustom" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PresetPanel from '@/components/midjourney/PresetPanel.vue';
import PromptInput from '@/components/midjourney/PromptInput.vue';
import ElementsSelector from '@/components/midjourney/ElementsSelector.vue';
import IgnoreSelector from '@/components/midjourney/IgnoreSelector.vue';
import { ElButton } from 'element-plus';
import ChannelSelector from '@/components/midjourney/ChannelSelector.vue';
import ReferenceImage from '@/components/midjourney/ReferenceImage.vue';
import {
  IApplication,
  IMidjourneyChannel,
  MidjourneyImagineAction,
  IMidjourneyImagineResponse,
  IMidjourneyPreset,
  MIDJOURNEY_CHANNEL_FAST,
  MIDJOURNEY_CHANNEL_TURBO,
  MIDJOURNEY_CHANNEL_RELAX,
  applicationOperator,
  midjourneyOperator,
  MidjourneyImagineState,
  IMidjourneyImagineTask,
  IMidjourneyImagineRequest
} from '@/operators';
import ApiStatus from '@/components/common/ApiStatus.vue';
import TaskBriefList from '@/components/midjourney/tasks/TaskBriefList.vue';
import FinalPrompt from '@/components/midjourney/FinalPrompt.vue';

interface IData {
  channel: IMidjourneyChannel;
  preset: IMidjourneyPreset;
  prompt: string;
  elements: string[];
  ignore: string;
  initializing: boolean;
  applied: boolean | undefined;
  applications: IApplication[];
  task: IMidjourneyImagineTask | undefined;
}

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ChannelSelector,
    ReferenceImage,
    PresetPanel,
    PromptInput,
    ElementsSelector,
    IgnoreSelector,
    ElButton,
    ApiStatus,
    TaskBriefList,
    FinalPrompt
  },
  data(): IData {
    return {
      applications: [],
      channel: MIDJOURNEY_CHANNEL_FAST,
      preset: {},
      prompt: '',
      elements: [],
      ignore: '',
      initializing: false,
      applied: undefined,
      task: undefined
    };
  },
  computed: {
    application() {
      if (this.applications && this.applications.length > 0) {
        return this.applications.filter((item) => item.api_id === this.channel.apiId)[0];
      }
      return undefined;
    },
    finalPrompt(): string {
      let content = '';
      if (this.prompt) {
        content += this.prompt;
      }
      if (this.elements.length > 0) {
        content += ',' + this.elements.join(',');
      }
      if (this.preset.version) {
        content += ` --version ${this.preset.version}`;
      }
      if (this.preset.chaos) {
        content += ` --chaos ${this.preset.chaos}`;
      }
      if (this.preset.quality) {
        content += ` --quality ${this.preset.quality}`;
      }
      if (this.preset.ratio) {
        content += ` --ar ${this.preset.ratio}`;
      }
      if (this.preset.stylize) {
        content += ` --stylize ${this.preset.stylize}`;
      }
      if (this.preset.weird) {
        content += ` --weird ${this.preset.weird}`;
      }
      if (this.ignore) {
        content += ` --no ${this.ignore}`;
      }
      if (this.preset.iw) {
        content += ` --iw ${this.preset.iw}`;
      }
      if (this.preset.raw) {
        content += ` --raw`;
      }
      return this.prompt ? content : '';
    }
  },
  mounted() {
    this.onFetchApplications();
  },
  methods: {
    async onSelectChannel() {
      await this.onFetchApplications();
    },
    async onFetchApplications() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.user.id,
        api_id: [MIDJOURNEY_CHANNEL_FAST.apiId, MIDJOURNEY_CHANNEL_RELAX.apiId, MIDJOURNEY_CHANNEL_TURBO.apiId]
      });
      this.initializing = false;
      this.applications = applications?.items;
    },
    async onStartTask(request: IMidjourneyImagineRequest) {
      const token = this.application?.credential?.token;
      const endpoint = this.application?.api?.endpoint;
      const path = this.application?.api?.path;
      if (!token || !endpoint || !path) {
        console.error('no token or endpoint or question');
        return;
      }
      this.task = {
        ...this.task,
        request,
        state: MidjourneyImagineState.PENDING
      };
      midjourneyOperator
        .imagine(request, {
          token,
          endpoint,
          path,
          stream: (response: IMidjourneyImagineResponse) => {
            console.log(response);
            this.task = {
              ...this.task,
              state: MidjourneyImagineState.GENERATING,
              response
            };
          }
        })
        .then(() => {
          this.task = {
            ...this.task,
            state: MidjourneyImagineState.FINISHED
          };
        })
        .catch((error) => {
          this.task = {
            ...this.task,
            state: MidjourneyImagineState.FAILED,
            response: error?.response as IMidjourneyImagineResponse
          };
        });
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = {
        image_id: payload.image_id,
        action: payload.action
      };
      this.onStartTask(request);
    },
    async onGenerate() {
      const request = {
        prompt: this.finalPrompt,
        action: MidjourneyImagineAction.GENERATE,
        translation: this.preset?.translation
      };
      this.onStartTask(request);
    }
  }
});
</script>

<style lang="scss">
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .presets {
    width: 260px;
    height: 100%;
    // background-color: var(--el-bg-color-page);
  }
  .main {
    flex: 1;
    padding: 15px;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
  .tasks {
    width: 400px;
    height: 100%;
    // background-color: var(--el-bg-color-page);
  }
}
</style>
