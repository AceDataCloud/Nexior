<template>
  <div class="flex min-h-8 items-center" :class="{ 'mb-[10px]': !inline }">
    <h2 class="m-0 text-[14px] font-bold">{{ title }}</h2>
    <info-icon :content="description" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'MinimaxFieldTitle',
  components: {
    InfoIcon
  },
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    inline: {
      type: Boolean,
      default: false
    }
  }
});
</script>
