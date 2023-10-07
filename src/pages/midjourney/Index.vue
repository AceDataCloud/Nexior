<template>
  <div class="page">
    <div class="presets">
      <channel-selector v-model="channel" />
      <preset-panel v-model="preset" />
    </div>
    <div class="main">
      <prompt-input v-model="prompt" class="mb-4" />
      <elements-selector v-model="elements" class="mb-4" />
      <ignore-selector v-model="ignore" class="mb-4" />
      <el-button type="primary" @click="onGenerate"> 生成 </el-button>
      <imagine-preview v-model="response" :state="state" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PresetPanel from '@/components/midjourney/PresetPanel.vue';
import PromptInput from '@/components/midjourney/PromptInput.vue';
import ElementsSelector from '@/components/midjourney/ElementsSelector.vue';
import IgnoreSelector from '@/components/midjourney/IgnoreSelector.vue';
import { ElButton, ElImage } from 'element-plus';
import ChannelSelector from '@/components/midjourney/ChannelSelector.vue';
import ImaginePreview from '@/components/midjourney/ImaginePreview.vue';
import {
  IApplication,
  IMidjourneyChannel,
  MidjourneyImagineAction,
  IMidjourneyImagineResponse,
  IMidjourneyPreset,
  MIDJOURNEY_CHANNEL_FAST,
  applicationOperator,
  midjourneyOperator,
  MidjourneyImagineState
} from '@/operators';

interface IData {
  channel: IMidjourneyChannel;
  preset: IMidjourneyPreset;
  prompt: string;
  elements: string[];
  ignore: string;
  initializing: boolean;
  applied: boolean | undefined;
  application: IApplication | undefined;
  response: IMidjourneyImagineResponse | undefined;
  state: MidjourneyImagineState | undefined;
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
    ImaginePreview
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
      response: undefined,
      state: undefined
    };
  },
  mounted() {
    this.onFetchChannel();
  },
  methods: {
    async onFetchChannel() {
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
    async onGenerate() {
      this.state = MidjourneyImagineState.PENDING;
      const token = this.application?.credential?.token;
      const endpoint = this.application?.api?.endpoint;
      const path = this.application?.api?.path;
      if (!token || !endpoint || !this.prompt || !path) {
        console.error('no token or endpoint or question');
        return;
      }
      midjourneyOperator
        .imagine(
          {
            prompt: this.prompt,
            action: MidjourneyImagineAction.GENERATE
          },
          {
            token,
            endpoint,
            path,
            stream: (response: IMidjourneyImagineResponse) => {
              console.log(response);
              this.state = MidjourneyImagineState.GENERATING;
              this.response = response;
            }
          }
        )
        .then((res) => {
          this.state = MidjourneyImagineState.FINISHED;
          console.log(res);
        })
        .catch(() => {
          this.state = MidjourneyImagineState.FAILED;
        });
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
    background-color: var(--el-bg-color-page);
  }
  .main {
    flex: 1;
    padding: 15px;
    .title {
      font-size: 14px;
      margin-bottom: 10px;
    }
  }
}
</style>
