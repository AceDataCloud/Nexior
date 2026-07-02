<template>
  <div v-if="visible" class="desktop-drag-bar" :class="{ 'is-mac': isMac, 'is-win': !isMac }" aria-hidden="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { isDesktop, isMacOS } from '@/utils/surface';
import { desktopBridge } from '@/utils/desktop';

// Frameless desktop windows have no built-in drag handle: renderer must declare
// one via `-webkit-app-region: drag`. `Index.vue` gets it from `TopHeader`, but
// every service page (`Main.vue`, `Chat.vue`, `Console.vue`, `Bare.vue`, …)
// has no header — so the window can't be dragged at all there. Mount this once
// in `App.vue` and it covers every layout. `pointer-events: none` keeps the
// underlying UI (nav, buttons, credits pill) fully clickable — the drag hit-
// test is done by Chromium before pointer-events.
export default defineComponent({
  name: 'DesktopDragBar',
  data() {
    return {
      fullscreen: false,
      offFullscreen: null as null | (() => void)
    };
  },
  computed: {
    visible(): boolean {
      // Only on desktop, and hide in native fullscreen (no title-bar chrome).
      return isDesktop() && !this.fullscreen;
    },
    isMac(): boolean {
      return isMacOS();
    }
  },
  mounted() {
    if (!isDesktop()) return;
    // `desktopBridge` is a factory: () => DesktopBridge | undefined.
    // Preload emits current fullscreen state immediately, then on every change.
    const bridge = desktopBridge();
    this.offFullscreen =
      bridge?.onFullscreenChange?.((isFullscreen: boolean) => {
        this.fullscreen = !!isFullscreen;
      }) ?? null;
  },
  beforeUnmount() {
    this.offFullscreen?.();
    this.offFullscreen = null;
  }
});
</script>

<style lang="scss" scoped>
.desktop-drag-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  z-index: 100; // below status-floating(200), above router-view content
  -webkit-app-region: drag;
  // Do NOT eat clicks — underlying UI (credits pill, nav rail, close/max/min)
  // still gets pointer events. Only the window-drag hit-test uses this element.
  pointer-events: none;
}

// macOS hiddenInset traffic lights sit at x:16..76 y:20..34. Leave that alone
// so the native buttons stay clickable; drag bar starts to the right of them.
.desktop-drag-bar.is-mac {
  left: 84px;
  right: 0;
}

// Windows titleBarOverlay draws min/max/close in the top-right ~138px.
// Drag bar stops before them so buttons stay hittable.
.desktop-drag-bar.is-win {
  left: 0;
  right: 138px;
}
</style>
