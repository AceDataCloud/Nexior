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
      lastScrollTop: -1,
      // Number of reach-top emits that fired while a load was in progress.
      // The parent's loadPreviousPage drops these via its `loading` guard.
      // When the load completes we use this to detect "user was actively
      // trying to keep paginating" and emit one more reach-top so they don't
      // have to make a new gesture. Reset on every loading→true transition.
      emitsDuringLoad: 0
    };
  },
  watch: {
    loading(next: boolean, prev: boolean) {
      if (next) {
        this.emitsDuringLoad = 0;
        return;
      }
      // Load just finished. If the user fired reach-top while loading was
      // running (their continuous scroll gesture pinned them at the top
      // before load completed), the parent silently dropped those emits.
      // Auto-retry once. The watcher's emit does NOT go through doEmit() so
      // it cannot inflate emitsDuringLoad on the next load — preventing a
      // runaway loop if the parent has nothing more to load.
      if (prev && this.emitsDuringLoad > 0) {
        this.emitsDuringLoad = 0;
        this.$emit('reach-top');
      }
    }
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
        this.fireReachTop();
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
          this.fireReachTop();
        }
      }, SCROLL_END_DEBOUNCE_MS);
    },
    fireReachTop() {
      // If we emit while a load is already in progress, the parent will drop
      // it. Track the count so the loading watcher can compensate after the
      // load completes — see the loading watcher above.
      if (this.loading) {
        this.emitsDuringLoad += 1;
      }
      this.$emit('reach-top');
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
