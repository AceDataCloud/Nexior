<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('openaiimage.name.size') }}</h2>
        <info-icon :content="$t('openaiimage.description.size')" class="info" />
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
import InfoIcon from '@/components/common/InfoIcon.vue';
import {
  OPENAIIMAGE_DEFAULT_SIZE,
  OPENAIIMAGE_SIZE_1024,
  OPENAIIMAGE_SIZE_1024_1536,
  OPENAIIMAGE_SIZE_1536_1024
} from '@/constants';

export default defineComponent({
  name: 'OpenAIImageSizeSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: OPENAIIMAGE_SIZE_1024,
          label: OPENAIIMAGE_SIZE_1024
        },
        {
          value: OPENAIIMAGE_SIZE_1536_1024,
          label: OPENAIIMAGE_SIZE_1536_1024
        },
        {
          value: OPENAIIMAGE_SIZE_1024_1536,
          label: OPENAIIMAGE_SIZE_1024_1536
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.openaiimage?.config?.size;
      },
      set(val: string) {
        this.$store.commit('openaiimage/setConfig', {
          ...this.$store.state.openaiimage?.config,
          size: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = OPENAIIMAGE_DEFAULT_SIZE;
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
