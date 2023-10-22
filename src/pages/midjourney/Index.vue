<template>
  <div class="page">
    <div class="presets">
      <preset-panel v-model="preset" />
    </div>
    <div class="main">
      <channel-selector v-model="channel" class="mb-4" @select="onSelectChannel" />
      <api-status :application="application" class="mb-4" />
      <prompt-input v-model="prompt" class="mb-4" />
      <elements-selector v-model="elements" class="mb-4" />
      <ignore-selector v-if="preset.advanced" v-model="ignore" class="mb-4" />
      <p>
        {{ finalPrompt }}
      </p>
      <el-button type="primary" @click="onGenerate"> 生成 </el-button>
    </div>
    <div class="tasks">
      <task-brief-list v-model:active-task="task" :application="application" @custom="onCustom" />
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
import {
  IApplication,
  IMidjourneyChannel,
  MidjourneyImagineAction,
  IMidjourneyImagineResponse,
  IMidjourneyPreset,
  MIDJOURNEY_CHANNEL_FAST,
  applicationOperator,
  midjourneyOperator,
  MidjourneyImagineState,
  IMidjourneyImagineTask,
  IMidjourneyImagineRequest
} from '@/operators';
import ApiStatus from '@/components/common/ApiStatus.vue';
import TaskBriefList from '@/components/midjourney/TaskBriefList.vue';

interface IData {
  channel: IMidjourneyChannel;
  preset: IMidjourneyPreset;
  prompt: string;
  elements: string[];
  ignore: string;
  initializing: boolean;
  applied: boolean | undefined;
  application: IApplication | undefined;
  task: IMidjourneyImagineTask | undefined;
}

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    ChannelSelector,
    PresetPanel,
    PromptInput,
    ElementsSelector,
    IgnoreSelector,
    ElButton,
    ApiStatus,
    TaskBriefList
  },
  data(): IData {
    return {
      application: undefined,
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
      if (this.preset.wired) {
        content += ` --wired ${this.preset.wired}`;
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
    this.onFetchApplication();
  },
  methods: {
    async onSelectChannel() {
      await this.onFetchApplication();
    },
    async onFetchApplication() {
      this.initializing = true;
      const { data: applications } = await applicationOperator.getAll({
        user_id: this.$store.state.user.id,
        api_id: this.channel.apiId
      });
      this.initializing = false;
      if (!applications || applications?.items?.length === 0) {
        this.applied = false;
        return;
      }
      this.application = applications.items[0];
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
        prompt: this.prompt,
        action: MidjourneyImagineAction.GENERATE
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
