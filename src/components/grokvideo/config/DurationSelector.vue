<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('grokvideo.name.duration') }}</h2>
        <info-icon :content="$t('grokvideo.description.duration')" class="info" />
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
import { GROKVIDEO_DEFAULT_DURATION, GROKVIDEO_DURATION_OPTIONS, getGrokVideoMaxDuration } from '@/constants';

export default defineComponent({
  name: 'GrokVideoDurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  computed: {
    model(): string | undefined {
      return this.$store.state.grokvideo?.config?.model;
    },
    // grok-imagine-video supports up to 30s; grok-imagine-video-1.5-preview up to 15s.
    maxDuration(): number {
      return getGrokVideoMaxDuration(this.model);
    },
    options(): { value: number; label: string }[] {
      return GROKVIDEO_DURATION_OPTIONS.filter((d) => d <= this.maxDuration).map((d) => ({ value: d, label: `${d}s` }));
    },
    value: {
      get(): number | undefined {
        return this.$store.state.grokvideo?.config?.duration;
      },
      set(val: number) {
        this.$store.commit('grokvideo/setConfig', {
          ...this.$store.state.grokvideo?.config,
          duration: val
        });
      }
    }
  },
  watch: {
    // Switching to a model with a lower cap (e.g. 1.5-preview) clamps the value.
    maxDuration(max: number) {
      if (this.value && this.value > max) {
        this.value = max;
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = GROKVIDEO_DEFAULT_DURATION;
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
    width: 80px;
  }
}
</style>
