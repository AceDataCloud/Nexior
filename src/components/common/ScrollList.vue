<template>
  <div ref="panel" class="scroll-list relative" @scroll="onHandleScroll">
    <!--
      Sentinel for IntersectionObserver-based "reach top" detection.
      Explicitly closed (not self-closed) — Vue's SFC compiler does not honor
      <div /> for non-void HTML elements in every release; an open-then-close
      pair is unambiguous.
    -->
    <div ref="topSentinel" class="scroll-list__sentinel" aria-hidden="true"></div>
    <top-loading v-if="loading" :text="loadingText" :floating="floatingLoader" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopLoading from './TopLoading.vue';

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
      default: 120
    }
  },
  emits: ['reach-top', 'scroll'],
  data() {
    return {
      observer: null as IntersectionObserver | null,
      sentinelVisible: false,
      scrollEndTimer: 0 as number
    };
  },
  watch: {
    loading(next: boolean, prev: boolean) {
      // When a load finishes while the sentinel is still visible (e.g. the
      // restored scrollTop still sits within the rootMargin, or no new rows
      // arrived) the observer would not re-fire without a fresh transition.
      // Re-emit so the parent can decide whether to keep paging.
      if (prev && !next && this.sentinelVisible) {
        this.$emit('reach-top');
      }
    }
  },
  mounted() {
    const root = this.$refs.panel as HTMLElement | undefined;
    const sentinel = this.$refs.topSentinel as HTMLElement | undefined;
    if (!root || !sentinel || typeof IntersectionObserver === 'undefined') {
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        this.sentinelVisible = entry.isIntersecting;
        if (entry.isIntersecting) {
          this.$emit('reach-top');
        }
      },
      {
        root,
        rootMargin: `${this.reachThreshold}px 0px 0px 0px`,
        threshold: 0
      }
    );
    this.observer.observe(sentinel);
  },
  beforeUnmount() {
    this.observer?.disconnect();
    this.observer = null;
    if (this.scrollEndTimer) {
      window.clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = 0;
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      this.$emit('scroll', el);
      // Synchronous trigger: catches the common case where a scroll event
      // does fire below the threshold. Cheap because reach-top guards on the
      // parent side (loadPreviousPage's loading + isBlocked + total checks).
      if (el.scrollTop <= this.reachThreshold) {
        this.$emit('reach-top');
      }
      // Debounced scroll-end trigger: macOS trackpad inertia often stops
      // dispatching scroll events the moment scrollTop hits 0, so the LAST
      // event the handler sees can have scrollTop > reachThreshold. After a
      // brief idle, re-check the final scrollTop and fire if we landed at the
      // top — this is the case the user reported as "need to scroll down then
      // up again to wake the loader".
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
.scroll-list__sentinel {
  width: 100%;
  height: 1px;
  pointer-events: none;
}
</style>
