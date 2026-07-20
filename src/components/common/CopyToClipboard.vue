<template>
  <el-tooltip v-if="!copied" effect="dark" :content="$t('common.button.copy')" placement="bottom">
    <button
      type="button"
      class="icon-copy"
      :aria-label="$t('common.button.copy')"
      :title="$t('common.button.copy')"
      @click.stop="onCopy"
    >
      <copy-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
  </el-tooltip>
  <el-tooltip v-else :visible="copied" effect="dark" :content="$t('common.message.copied')" placement="bottom">
    <confirm-icon class="icon-check" :size="'1em' as any" aria-hidden="true" focusable="false" />
  </el-tooltip>
</template>

<script lang="ts">
import { ConfirmIcon, CopyIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import copy from 'copy-to-clipboard';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    ConfirmIcon,
    CopyIcon,
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
      copied: false
    };
  },
  methods: {
    onCopy() {
      if (!this.content) {
        return;
      }
      copy(this.content.toString(), {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-check,
.icon-copy {
  margin-inline-start: 5px;
  cursor: pointer;
  color: inherit;
}

.icon-copy {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
}
</style>
