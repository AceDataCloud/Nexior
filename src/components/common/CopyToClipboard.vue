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
    <span class="copy-control__status" role="status" aria-live="polite">{{
      copied ? $t('common.message.copied') : ''
    }}</span>
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
  position: relative;
  display: inline;
  flex: 0 0 auto;
  align-items: center;
  margin-inline-start: 4px;
  vertical-align: middle;
  white-space: nowrap;
  line-height: 1;

  // Prevent an orphaned copy button after a wrapping value. Generated content
  // participates in line breaking without adding a character to copied text.
  &::before {
    content: '\2060';
  }
}

.copy-control__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--adc-radius-small);
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
    outline: var(--adc-focus-outline-width) solid var(--adc-focus-outline-color);
    outline-offset: var(--adc-focus-outline-offset);
  }
}

.copy-control__button :deep(svg) {
  display: block;
  width: 14px;
  height: 14px;
}

// Keep announcements out of layout even without the global utility stylesheet.
.copy-control__status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
