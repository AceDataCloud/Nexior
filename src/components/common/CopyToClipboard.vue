<template>
  <font-awesome-icon v-if="!copied" icon="fa-regular fa-copy" @click="onCopy" />
  <el-tooltip v-else :visible="copied" effect="dark" :content="$t('common.message.copied')" placement="top-start">
    <font-awesome-icon icon="fa-solid fa-check" />
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import copy from 'copy-to-clipboard';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    FontAwesomeIcon
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
