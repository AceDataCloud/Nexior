<template>
  <el-tooltip v-if="!copied" effect="dark" :content="$t('common.button.copy')" placement="top-start">
    <font-awesome-icon icon="fa-regular fa-copy" class="icon-copy" @click="onCopy"
  /></el-tooltip>

  <el-tooltip v-else :visible="copied" effect="dark" :content="$t('common.message.copied')" placement="top-start">
    <font-awesome-icon icon="fa-solid fa-check" class="icon-check" />
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import copy from 'copy-to-clipboard';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    FontAwesomeIcon,
    ElTooltip
  },
  props: {
    content: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      copied: false
    };
  },
  methods: {
    onCopy() {
      copy(this.content, {
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
  margin-left: 5px;
  cursor: pointer;
  color: inherit;
}
</style>
