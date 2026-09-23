<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('openaiimage.name.quality') }}</h2>
        <info-icon :content="$t('openaiimage.description.quality')" class="info" />
      </div>
    </div>
    <el-select v-model="quality" class="value" :placeholder="$t('openaiimage.placeholder.select')">
      <el-option v-for="item in qualities" :key="item" :label="$t(`openaiimage.quality.${item}`)" :value="item" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElOption, ElSelect } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { OPENAIIMAGE_DEFAULT_MODEL, OPENAIIMAGE_DEFAULT_QUALITY, OPENAIIMAGE_MODEL_QUALITIES } from '@/constants';
import type { IOpenAIImageConfig, OpenAIImageQuality } from '@/models';

export default defineComponent({
  name: 'OpenAIImageQualitySelector',
  components: { ElOption, ElSelect, InfoIcon },
  computed: {
    model(): string {
      return this.$store.state.openaiimage?.config?.model || OPENAIIMAGE_DEFAULT_MODEL;
    },
    storedQuality(): OpenAIImageQuality | undefined {
      return this.$store.state.openaiimage?.config?.quality;
    },
    qualities(): OpenAIImageQuality[] {
      return OPENAIIMAGE_MODEL_QUALITIES[this.model] ?? [OPENAIIMAGE_DEFAULT_QUALITY];
    },
    quality: {
      get(): OpenAIImageQuality {
        return this.storedQuality && this.qualities.includes(this.storedQuality)
          ? this.storedQuality
          : OPENAIIMAGE_DEFAULT_QUALITY;
      },
      set(value: OpenAIImageQuality) {
        this.commitQuality(value);
      }
    }
  },
  watch: {
    model() {
      if (this.storedQuality && this.qualities.includes(this.storedQuality)) return;
      this.commitQuality(OPENAIIMAGE_DEFAULT_QUALITY);
    }
  },
  methods: {
    commitQuality(quality: OpenAIImageQuality) {
      const config: IOpenAIImageConfig = {
        ...(this.$store.state.openaiimage?.config || {}),
        quality
      };
      this.$store.commit('openaiimage/setConfig', config);
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
  }
}
</style>
