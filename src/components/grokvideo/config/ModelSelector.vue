<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('grokvideo.name.model') }}</h2>
        <info-icon :content="$t('grokvideo.description.model')" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('grokvideo.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { GROKVIDEO_DEFAULT_MODEL, GROKVIDEO_MODEL_1_5_PREVIEW, GROKVIDEO_MODEL_DEFAULT } from '@/constants';

export default defineComponent({
  name: 'GrokVideoModelSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      options: [
        { value: GROKVIDEO_MODEL_DEFAULT, label: this.$t('grokvideo.model.default') },
        { value: GROKVIDEO_MODEL_1_5_PREVIEW, label: this.$t('grokvideo.model.preview15') }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.grokvideo?.config?.model;
      },
      set(val: string) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
          model: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = GROKVIDEO_DEFAULT_MODEL;
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
    width: 200px;
  }
}
</style>
