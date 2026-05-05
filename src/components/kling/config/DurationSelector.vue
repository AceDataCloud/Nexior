<template>
  <div class="field">
    <div class="control">
      <div class="label">
        <h2 class="title font-bold">{{ $t('kling.name.duration') }}</h2>
        <info-icon :content="$t('kling.description.duration')" class="info-icon ml-1" />
      </div>
      <el-select
        :key="revertKey"
        :model-value="selectValue"
        class="value"
        :placeholder="$t('kling.placeholder.select')"
        @change="onChange"
      >
        <el-option v-for="d in allowedDurations" :key="d" :label="`${d}s`" :value="d" />
      </el-select>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';
import { KLING_DEFAULT_DURATION, KLING_V3_MODELS } from '@/constants';
import { findKlingConflicts, clearKlingConflicts } from '@/utils/kling/capabilities';

const V3_VALUES = [3, 5, 8, 10, 12, 15];
const STANDARD_VALUES = [5, 10];

export default defineComponent({
  name: 'DurationSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  data() {
    return {
      // Bumped to force-rerender the select when the user cancels a
      // conflict-resolution prompt, so the dropdown snaps back to the
      // previous value.
      revertKey: 0
    };
  },
  computed: {
    selectedModel(): string {
      return this.$store.state.kling?.config?.model || '';
    },
    isV3Model(): boolean {
      return KLING_V3_MODELS.includes(this.selectedModel);
    },
    allowedDurations(): number[] {
      return this.isV3Model ? V3_VALUES : STANDARD_VALUES;
    },
    value(): number {
      return this.$store.state.kling?.config?.duration ?? KLING_DEFAULT_DURATION;
    },
    selectValue(): number {
      // Clamp the displayed value to a member of allowedDurations so the
      // select doesn't render a stale entry while a model switch is in flight.
      const allowed = this.allowedDurations;
      if (allowed.includes(this.value)) return this.value;
      return allowed.includes(KLING_DEFAULT_DURATION) ? KLING_DEFAULT_DURATION : allowed[0];
    }
  },
  watch: {
    isV3Model() {
      if (!this.allowedDurations.includes(this.value)) {
        this.applyDuration(KLING_DEFAULT_DURATION);
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.config?.duration) {
      this.applyDuration(KLING_DEFAULT_DURATION);
    }
  },
  methods: {
    async onChange(val: number) {
      const config = this.$store.state.kling?.config || {};
      const conflicts = findKlingConflicts(config, { duration: val });
      if (conflicts.length === 0) {
        this.applyDuration(val);
        return;
      }
      const fields = conflicts.map((c) => this.$t(c.i18nLabel)).join('、');
      try {
        await ElMessageBox.confirm(
          this.$t('kling.message.featureNotSupportedBody', { fields }),
          this.$t('kling.message.featureNotSupportedTitle'),
          {
            confirmButtonText: this.$t('kling.button.confirmContinue'),
            cancelButtonText: this.$t('kling.button.cancelSwitch'),
            type: 'warning'
          }
        );
        const cleared = clearKlingConflicts({ ...config, duration: val }, conflicts);
        this.$store.commit('kling/setConfig', cleared);
        ElMessage.success(this.$t('kling.message.featureRemovedNotice', { fields }));
      } catch {
        // User cancelled — repaint the dropdown with the previous value.
        this.revertKey += 1;
      }
    },
    applyDuration(val: number) {
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling.config,
        duration: val
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
}
.control {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.label {
  display: flex;
  flex-direction: row;
  align-items: center;
}
.title {
  font-size: 14px;
  margin: 0;
}
.value {
  width: 120px;
}
</style>
