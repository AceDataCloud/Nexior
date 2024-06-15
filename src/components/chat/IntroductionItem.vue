<template>
  <div class="item">
    <div class="icon">
      <font-awesome-icon
        :icon="icon"
        :style="{
          color: color
        }"
      />
    </div>
    <div class="content">
      {{ content }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { color } from '@codemirror/theme-one-dark';

export default defineComponent({
  name: 'ConversationIntroductionItem',
  components: {
    FontAwesomeIcon
  },
  props: {
    content: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: 'rgb(0, 0, 0)'
    }
  },
  data() {
    return {};
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.item {
  height: 100px;
  font-size: 14px;
  background-color: var(--el-color-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
  padding: 10px 20px;
  border-radius: 20px;
  margin-bottom: 15px;
  &:hover {
    background-color: var(--el-bg-color-page);
  }
  .icon {
    font-size: 14px;
    margin-bottom: 10px;
  }
}
</style>
