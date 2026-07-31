<template>
  <div class="console">
    <div class="main">
      <side-panel class="side" />
      <router-view :class="['panel', `panel--${panelVariant}`]" />
    </div>
    <navigator class="navigator" :direction="mobile ? 'row' : 'column'" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import SidePanel from '@/components/console/SidePanel.vue';

export default defineComponent({
  name: 'LayoutConsole',
  components: {
    SidePanel,
    Navigator
  },
  data() {
    return {
      mobile: window.innerWidth < 768
    };
  },
  computed: {
    // `document` pages flow downwards and let `.panel` scroll; `workspace`
    // pages (connectors / skills) need a full-height flex column for their
    // independently-scrolling two-pane UI. Declared per route so pages don't
    // have to fight `.panel` with their own `height: 100%` wrapper.
    panelVariant(): string {
      return (this.$route.meta?.layout as string) || 'document';
    }
  },
  mounted() {
    // Stable reference so beforeUnmount can remove it — see Main.vue for
    // the same pattern; without removal each navigation leaked one listener.
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    onResize() {
      this.mobile = window.innerWidth < 768;
    }
  }
});
</script>

<style lang="scss" scoped>
.console {
  // Single source of truth for the sidebar width. SidePanel reads this same
  // variable — previously each file declared its own value (200px here,
  // 220px there) and this file's higher-specificity `.console .main .side`
  // silently won, so the sidebar's inner list overflowed by 8px.
  --console-side-width: 220px;
}

@media screen and (min-width: 768px) {
  .console {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row-reverse;

    .navigator {
      height: 100%;
      width: 60px;
    }

    .main {
      height: 100%;
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: row;
      overflow: hidden;

      .panel {
        flex: 1;
        height: 100%;
        padding: 30px;
        background-color: var(--el-bg-color-page);
        min-width: 0;
        box-sizing: border-box;
      }

      // Content flows downwards; the panel scrolls it.
      .panel--document {
        overflow-y: auto;
        overflow-x: hidden;
      }

      // Full-height flex column for two-pane pages that scroll their own
      // panes. Replaces the `.page-shell` wrapper each such page used to
      // inline to override `.panel`.
      .panel--workspace {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }
    }
  }
}

@media screen and (max-width: 767px) {
  .console {
    --console-safe-bottom: max(env(safe-area-inset-bottom, 0px), 10px);
    --console-safe-top: var(--app-safe-area-top);

    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    // Push content below iOS Dynamic Island / Android status bar.
    padding-top: var(--console-safe-top);
    .navigator {
      width: 100%;
      height: calc(var(--app-dock-height) + var(--console-safe-bottom));
      padding-bottom: var(--console-safe-bottom);
      position: fixed;
      bottom: 0;
      z-index: 10000;
      transition: height 0.18s ease;
    }
    .main {
      height: calc(100% - var(--app-dock-height) - var(--console-safe-bottom) - var(--console-safe-top));
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      .panel {
        width: 100%;
        padding: 12px;
        background-color: var(--el-bg-color-page);
        padding-bottom: calc(var(--app-dock-height) + 20px + var(--console-safe-bottom));
        box-sizing: border-box;
        min-height: 0;
        overflow-x: auto;
        overflow-y: auto;
      }

      // On phones a workspace page grows and scrolls with the panel rather
      // than trapping its panes in a viewport-height column.
      .panel--workspace {
        display: flex;
        flex-direction: column;
      }
      .side {
        width: 100%;
        height: auto;
        flex: 0 0 auto;
        padding: 8px 10px;
        background: var(--app-sidebar-bg);
        border-bottom: 1px solid var(--app-border-subtle);
      }
    }
  }
}
</style>

<style lang="scss">
.console {
  .panel {
    // Bare heading used by the document-style pages. Workspace pages render
    // <console-page-header>, which owns its own typography.
    .title {
      font-size: 26px;
      font-weight: bold;
      margin-bottom: 20px;
      color: var(--el-text-color-primary);
    }
  }

  .pagination {
    margin: auto;
    width: fit-content;
  }
}
</style>
