<template>
  <div class="item">
    <div class="icon">
      <component
        :is="iconComponent"
        :style="{
          color: color
        }"
        :size="'1em' as any"
        aria-hidden="true"
        focusable="false"
      />
    </div>
    <div class="content">
      {{ content }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type Component, type PropType } from 'vue';

export default defineComponent({
  name: 'ConversationIntroductionItem',
  props: {
    content: {
      type: String,
      required: true
    },
    iconComponent: {
      type: Object as PropType<Component>,
      required: true
    },
    color: {
      type: String,
      default: 'rgb(0, 0, 0)'
    }
  },
  data() {
    return {};
  }
});
</script>

<style lang="scss" scoped>
.item {
  font-size: 14px;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--app-border-subtle);
  padding: 14px 20px;
  border-radius: 16px;
  margin-bottom: 15px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
  &:hover {
    background-color: var(--el-bg-color-page);
    box-shadow: var(--app-shadow-md);
    transform: translateY(-2px);
  }
  .icon {
    font-size: 14px;
    margin-bottom: 10px;
  }
}
</style>
