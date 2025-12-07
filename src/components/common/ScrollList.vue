<template>
  <div ref="panel" class="scroll-list relative" @scroll="onHandleScroll">
    <top-loading v-if="loading" :text="loadingText" :floating="floatingLoader" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopLoading from './TopLoading.vue';

export default defineComponent({
  name: 'ScrollList',
  components: {
    TopLoading
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: ''
    },
    floatingLoader: {
      type: Boolean,
      default: true
    },
    reachThreshold: {
      type: Number,
      default: 40
    }
  },
  emits: ['reach-top', 'scroll'],
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      this.$emit('scroll', el);
      if (el.scrollTop <= this.reachThreshold) {
        this.$emit('reach-top');
      }
    },
    getScrollElement(): HTMLElement | undefined {
      return this.$refs.panel as HTMLElement | undefined;
    }
  }
});
</script>

<style lang="scss" scoped>
.scroll-list {
  position: relative;
}
</style>
