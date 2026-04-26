<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('openaiimage.name.model') }}</h2>
        <info-icon :content="modelDescription" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('openaiimage.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import {
  OPENAIIMAGE_DEFAULT_MODEL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_1,
  OPENAIIMAGE_MODEL_GPT_IMAGE_15,
  OPENAIIMAGE_MODEL_GPT_IMAGE_2
} from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'OpenAIImageModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: OPENAIIMAGE_MODEL_GPT_IMAGE_1,
          label: this.$t('openaiimage.model.gptImage1')
        },
        {
          value: OPENAIIMAGE_MODEL_GPT_IMAGE_15,
          label: this.$t('openaiimage.model.gptImage15')
        },
        {
          value: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
          label: this.$t('openaiimage.model.gptImage2')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.openaiimage?.config?.model;
      },
      set(val: string) {
        this.$store.commit('openaiimage/setConfig', {
          ...this.$store.state.openaiimage?.config,
          model: val
        });
      }
    },
    modelDescription(): string {
      return this.$t('openaiimage.description.model');
    }
  },
  mounted() {
    if (!this.value) {
      this.value = OPENAIIMAGE_DEFAULT_MODEL;
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
