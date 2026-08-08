<template>
  <span class="copy-control">
    <el-tooltip :visible="copied" effect="dark" :content="$t('common.message.copied')" placement="top-start">
      <button
        type="button"
        class="copy-control__button"
        :aria-label="copied ? $t('common.message.copied') : $t('common.button.copy')"
        @click.stop="onCopy"
      >
        <success-icon v-if="copied" :size="16" aria-hidden="true" focusable="false" />
        <copy-icon v-else :size="16" aria-hidden="true" focusable="false" />
      </button>
    </el-tooltip>
    <span class="sr-only" role="status" aria-live="polite">{{ copied ? $t('common.message.copied') : '' }}</span>
  </span>
</template>

<script lang="ts">
import { CopyIcon, SuccessIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import copy from 'copy-to-clipboard';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    CopyIcon,
    SuccessIcon,
    ElTooltip
  },
  props: {
    content: {
      type: [String, Number],
      required: false,
      default: ''
    }
  },
  data() {
    return {
      copied: false,
      resetTimer: undefined as number | undefined
    };
  },
  beforeUnmount() {
    if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
  },
  methods: {
    async onCopy() {
      const text = this.content.toString();
      if (!text) {
        return;
      }
      try {
        if (!(await copy(text, { debug: true }))) return;
      } catch {
        return;
      }
      this.copied = true;
      if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
      this.resetTimer = window.setTimeout(() => {
        this.copied = false;
        this.resetTimer = undefined;
      }, 3000);
    }
  }
});
</script>

<style lang="scss" scoped>
.copy-control {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  line-height: 1;
}

.copy-control__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-inline-start: 4px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  line-height: 1;
  transition:
    color var(--adc-motion-duration-fast),
    background-color var(--adc-motion-duration-fast);

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  &:focus-visible {
    outline: var(--adc-focus-outline);
    outline-offset: var(--adc-focus-outline-offset);
  }
}

.copy-control__button :deep(svg) {
  display: block;
  width: 14px;
  height: 14px;
}
</style>
