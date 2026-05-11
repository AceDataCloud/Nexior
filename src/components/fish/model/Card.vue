<template>
  <div class="card">
    <div class="left">
      <el-image v-if="modelValue?.cover_image" :src="modelValue.cover_image" class="cover" fit="cover" />
      <el-image v-else src="https://cdn.acedata.cloud/e40fccc727.png" class="cover fallback" />
    </div>
    <div class="main">
      <div class="header">
        <span class="title">{{ modelValue?.title || $t('fish.name.untitledVoice') }}</span>
        <span v-if="modelValue?.created_at" class="datetime">
          {{ $dayjs.format('' + new Date(parseFloat((modelValue?.created_at || '').toString()) * 1000)) }}
        </span>
      </div>
      <p v-if="modelValue?.description" class="description">{{ modelValue?.description }}</p>
      <div v-if="sampleAudioUrl" class="sample mt-2">
        <audio :src="sampleAudioUrl" controls preload="metadata" class="w-full" />
      </div>
      <el-alert :closable="false" class="mt-2 success">
        <p class="text-[var(--el-text-color-regular)] text-xs mb-2">
          <font-awesome-icon icon="fa-solid fa-microphone" class="mr-1" />
          {{ $t('fish.name.referenceId') }}: {{ modelValue?.id }}
          <copy-to-clipboard :content="modelValue?.id || ''" />
        </p>
        <p v-if="modelValue?.visibility" class="text-[var(--el-text-color-regular)] text-xs mb-0">
          <font-awesome-icon icon="fa-solid fa-eye" class="mr-1" />
          {{ $t('fish.name.visibility') }}: {{ modelValue?.visibility }}
        </p>
      </el-alert>
      <div class="operations mt-2">
        <el-button type="primary" size="small" plain @click.stop="onUseVoice">
          <font-awesome-icon icon="fa-solid fa-volume-high" class="mr-1" />
          {{ $t('fish.button.useVoice') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElAlert, ElButton, ElImage } from 'element-plus';
import { IFishVoiceModel } from '@/models';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_FISH_TTS_INDEX } from '@/router/constants';

export default defineComponent({
  name: 'FishVoiceCard',
  components: {
    ElAlert,
    ElButton,
    ElImage,
    CopyToClipboard,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Object as () => IFishVoiceModel | undefined,
      required: true
    }
  },
  computed: {
    sampleAudioUrl(): string | undefined {
      const samples = this.modelValue?.samples;
      if (!samples?.length) return undefined;
      return samples[0]?.audio;
    }
  },
  methods: {
    onUseVoice() {
      const id = this.modelValue?.id;
      if (!id) return;
      this.$store.commit('fish/setConfig', {
        ...this.$store.state.fish?.config,
        reference_id: id
      });
      this.$router.push({ name: ROUTE_FISH_TTS_INDEX });
    }
  }
});
</script>

<style lang="scss" scoped>
$left-width: 90px;

.card {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--app-border-subtle);
  border-radius: 12px;
  box-shadow: var(--app-shadow-xs);

  .left {
    width: $left-width;
    flex: none;
    .cover {
      width: 70px;
      height: 70px;
      border-radius: 10px;
      &.fallback {
        opacity: 0.85;
      }
    }
  }

  .main {
    flex: 1;
    min-width: 0;
    padding: 0 4px;

    .header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
      .title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-color-primary);
      }
      .datetime {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .description {
      font-size: 13px;
      color: var(--el-text-color-regular);
      margin-top: 6px;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
  }
}
</style>
