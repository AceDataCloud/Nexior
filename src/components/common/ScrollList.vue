<template>
  <div
    ref="panel"
    class="scroll-list relative"
    tabindex="0"
    @scroll.passive="onHandleScroll"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @keydown="onKeydown"
  >
    <top-loading v-if="loading" :text="loadingText" :floating="floatingLoader" />
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TopLoading from './TopLoading.vue';

export default defineComponent({
  name: 'ScrollList',
  components: { TopLoading },
  props: {
    loading: { type: Boolean, default: false },
    loadingText: { type: String, default: '' },
    floatingLoader: { type: Boolean, default: true },
    reachThreshold: { type: Number, default: 200 }
  },
  emits: ['reach-top', 'scroll'],
  data() {
    return { lastScrollTop: 0, touchY: 0 };
  },
  watch: {
    loading: {
      flush: 'post',
      handler() {
        this.lastScrollTop = this.getScrollElement()?.scrollTop || 0;
      }
    }
  },
  methods: {
    requestEarlier() {
      const el = this.getScrollElement();
      if (el && el.scrollTop <= Math.max(this.reachThreshold, el.clientHeight)) {
        this.$emit('reach-top');
      }
    },
    onHandleScroll() {
      const el = this.getScrollElement();
      if (!el) return;
      this.$emit('scroll', el);
      if (!this.loading && el.scrollTop < this.lastScrollTop) this.requestEarlier();
      this.lastScrollTop = el.scrollTop;
    },
    onWheel(event: WheelEvent) {
      // At scrollTop=0 no scroll event fires, but upward input still must work.
      if (event.deltaY < 0 && !event.ctrlKey) this.requestEarlier();
    },
    onTouchStart(event: TouchEvent) {
      this.touchY = event.touches[0]?.clientY ?? 0;
    },
    onTouchMove(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? this.touchY;
      if (y > this.touchY) this.requestEarlier();
      this.touchY = y;
    },
    onKeydown(event: KeyboardEvent) {
      if (event.target === this.$refs.panel && ['ArrowUp', 'PageUp', 'Home'].includes(event.key)) {
        this.requestEarlier();
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
  min-height: 0;
  flex: 1;
  // Pagination explicitly preserves the current position when prepending.
  overflow-anchor: none;
}
</style>
