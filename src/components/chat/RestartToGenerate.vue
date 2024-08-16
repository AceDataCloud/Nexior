<template>
  <el-tooltip effect="dark" :content="$t('common.button.restart')" placement="top-start">
    <font-awesome-icon icon="fa-solid fa-sync" class="icon-sync" @click="onRestart" />
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'CopyToClipboard',
  components: {
    FontAwesomeIcon,
    ElTooltip
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  emits: ['restart'],
  data() {
    return {
      copied: false
    };
  },
  methods: {
    onRestart() {
      this.$emit('restart');
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-sync {
  margin-left: 5px;
  cursor: pointer;
  color: inherit;
}
</style>
