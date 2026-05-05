<template>
  <div ref="panel" class="scroll-list relative" @scroll="onHandleScroll">
    <top-loading v-if="loading" :text="loadingText" :floating="floatingLoader" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopLoading from './TopLoading.vue';

// macOS trackpad inertia stops firing scroll events the moment scrollTop hits 0.
// The LAST event the handler sees can have scrollTop > reachThreshold, so synchronous
// polling alone misses the resting position. After this idle period, re-read the
// final scrollTop and emit reach-top if we landed at the top.
const SCROLL_END_DEBOUNCE_MS = 120;

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
      default: 80
    }
  },
  emits: ['reach-top', 'scroll'],
  data() {
    return {
      scrollEndTimer: 0 as number
    };
  },
  beforeUnmount() {
    if (this.scrollEndTimer) {
      window.clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = 0;
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      this.$emit('scroll', el);
      // Synchronous trigger for normal scroll events.
      if (el.scrollTop <= this.reachThreshold) {
        this.$emit('reach-top');
      }
      // Debounced scroll-end re-check (catches macOS trackpad inertia: when momentum
      // settles at scrollTop=0 the browser stops firing scroll events, and the LAST
      // dispatched event can have scrollTop > threshold). reach-top callers have
      // their own loading/total guards so a second emit is cheap and idempotent.
      if (this.scrollEndTimer) {
        window.clearTimeout(this.scrollEndTimer);
      }
      this.scrollEndTimer = window.setTimeout(() => {
        this.scrollEndTimer = 0;
        const node = this.$refs.panel as HTMLElement | undefined;
        if (node && node.scrollTop <= this.reachThreshold) {
          this.$emit('reach-top');
        }
      }, SCROLL_END_DEBOUNCE_MS);
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
