<template>
  <div ref="panel" class="scroll-list relative" @scroll="onHandleScroll">
    <top-loading v-if="loading" :text="loadingText" :floating="floatingLoader" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopLoading from './TopLoading.vue';

// macOS trackpad inertia stops firing scroll events the moment scrollTop hits 0,
// so the LAST event the handler sees can have scrollTop > threshold. After this
// idle period, re-read scrollTop and emit reach-top if we landed at the top.
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
    /**
     * Static fallback threshold used only when the panel has no measurable
     * height at scroll time (initial frame before layout). Normally the
     * effective threshold is one viewport height — see thresholdPx().
     */
    reachThreshold: {
      type: Number,
      default: 200
    }
  },
  emits: ['reach-top', 'scroll'],
  data() {
    return {
      scrollEndTimer: 0 as number,
      lastScrollTop: -1
    };
  },
  beforeUnmount() {
    if (this.scrollEndTimer) {
      window.clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = 0;
    }
  },
  methods: {
    thresholdPx(el: HTMLElement): number {
      // Trigger pagination one viewport height before reaching the top.
      // After loadPreviousPage prepends rows it pins scrollTop to the
      // pre-prepend visual position (often hundreds of px > 0) to avoid a
      // jump; if the threshold were tiny, the user would need to scroll
      // almost the full new page to fire the next load. Using viewport
      // height makes the next load fire on the very next upward gesture.
      return Math.max(this.reachThreshold, el.clientHeight || 0);
    },
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      this.$emit('scroll', el);
      const top = el.scrollTop;
      const threshold = this.thresholdPx(el);
      const movingUp = this.lastScrollTop < 0 || top < this.lastScrollTop;
      this.lastScrollTop = top;
      // Only fire on upward motion within the threshold band. Pinning down
      // the direction prevents the post-prepend scrollTop adjustment (which
      // increases scrollTop without a real user gesture) from re-triggering
      // reach-top while still inside the threshold.
      if (movingUp && top <= threshold) {
        this.$emit('reach-top');
      }
      // macOS trackpad inertia: the final settle event can carry
      // scrollTop > threshold even though scrolling actually stopped at 0.
      // Re-check once after the panel has been quiet for a moment.
      if (this.scrollEndTimer) {
        window.clearTimeout(this.scrollEndTimer);
      }
      this.scrollEndTimer = window.setTimeout(() => {
        this.scrollEndTimer = 0;
        const node = this.$refs.panel as HTMLElement | undefined;
        if (!node) return;
        if (node.scrollTop <= this.thresholdPx(node)) {
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
