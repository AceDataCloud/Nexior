<template>
  <div ref="panel" class="scroll-list relative" @scroll="onHandleScroll">
    <!--
      Sentinel for IntersectionObserver-based "reach top" detection. Polling scrollTop
      from the @scroll handler misses the boundary on macOS trackpad inertia / rubber-band
      overscroll: the browser stops firing scroll events the instant scrollTop hits 0,
      so the last fired event often has scrollTop > reachThreshold and the load never
      triggers — the user has to scroll down then back up to wake it. The observer
      fires reliably whenever the sentinel enters the viewport (initial mount, layout
      shifts, content swaps, and the moment momentum scrolling reaches the top).
    -->
    <div ref="topSentinel" class="scroll-list__sentinel" aria-hidden="true" />
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
  data() {
    return {
      observer: null as IntersectionObserver | null,
      sentinelVisible: false
    };
  },
  watch: {
    loading(next: boolean, prev: boolean) {
      // When a load just finished while the sentinel is still in view (e.g. the
      // restored scrollTop still sits within the rootMargin), the observer will
      // not re-fire without a fresh transition. Nudge the parent so the next
      // page can be requested if there is more data.
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
        // Treat "within reachThreshold of the top" as already intersecting, matching
        // the previous scroll-poll semantics.
        rootMargin: `${this.reachThreshold}px 0px 0px 0px`,
        threshold: 0
      }
    );
    this.observer.observe(sentinel);
  },
  beforeUnmount() {
    this.observer?.disconnect();
    this.observer = null;
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      this.$emit('scroll', el);
      // Fallback for environments without IntersectionObserver. The observer is the
      // primary trigger; we only emit from @scroll if the observer never attached.
      if (!this.observer && el.scrollTop <= this.reachThreshold) {
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
.scroll-list__sentinel {
  // Zero-content marker pinned at the very top of the scroll content; only its
  // intersection with the scroll viewport matters.
  width: 100%;
  height: 1px;
  pointer-events: none;
}
</style>
