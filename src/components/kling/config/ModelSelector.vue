<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pika.name.model') }}</h2>
    <el-select
      :key="revertKey"
      :model-value="value"
      class="value"
      :placeholder="$t('pika.placeholder.select')"
      @change="onChange"
    >
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption, ElMessage, ElMessageBox } from 'element-plus';
import { KLING_DEFAULT_MODEL } from '@/constants';
import { findKlingConflicts, clearKlingConflicts } from '@/utils/kling/capabilities';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElSelect,
    ElOption
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // Bumped to force el-select to re-render and revert its internal display
      // when the user cancels a model switch.
      revertKey: 0,
      options: [
        {
          value: 'kling-v3',
          label: 'v3'
        },
        {
          value: 'kling-v3-omni',
          label: 'v3-Omni'
        },
        {
          value: 'kling-v2-6',
          label: 'v2.6'
        },
        {
          value: 'kling-v2-5-turbo',
          label: 'v2.5-Turbo'
        },
        {
          value: 'kling-v2-1-master',
          label: 'v2.1-Master'
        },
        {
          value: 'kling-v2-master',
          label: 'v2-Master'
        },
        {
          value: 'kling-v1-6',
          label: 'v1.6'
        },
        {
          value: 'kling-v1',
          label: 'v1'
        },
        {
          value: 'kling-video-o1',
          label: 'Video-o1'
        }
      ]
    };
  },
  computed: {
    value(): string | undefined {
      return this.$store.state.kling?.config?.model;
    }
  },
  mounted() {
    if (!this.value) {
      this.applyModel(KLING_DEFAULT_MODEL);
    }
  },
  methods: {
    async onChange(val: string) {
      const config = this.$store.state.kling?.config || {};
      const conflicts = findKlingConflicts(config, { model: val });
      if (conflicts.length === 0) {
        this.applyModel(val);
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
        const cleared = clearKlingConflicts({ ...config, model: val }, conflicts);
        this.$store.commit('kling/setConfig', cleared);
        ElMessage.success(this.$t('kling.message.featureRemovedNotice', { fields }));
      } catch {
        // User cancelled — force el-select to repaint with the current store value.
        this.revertKey += 1;
      }
    },
    applyModel(val: string) {
      this.$store.commit('kling/setConfig', {
        ...this.$store.state.kling.config,
        model: val
      });
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

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    width: 120px;
  }
}
</style>
