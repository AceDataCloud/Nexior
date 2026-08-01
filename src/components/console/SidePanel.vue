<template>
  <div class="side">
    <div class="links">
      <a
        v-for="(link, linkIndex) in links"
        :key="linkIndex"
        :class="{ link: true, active: $route.name === link.name }"
        @click="onNavigate(link)"
      >
        <span class="icon">
          <component :is="link.icon" class="text-sm" :size="'1em' as any" aria-hidden="true" focusable="false" />
        </span>
        <span class="text">{{ link.text }}</span>
        <span class="outer">
          <external-link-icon
            v-if="!link.name && link.href"
            class="text-sm ml-2"
            :size="'1em' as any"
            aria-hidden="true"
            focusable="false"
          />
        </span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import {
  ApplicationIcon,
  ConnectionIcon,
  DesktopIcon,
  ExternalLinkIcon,
  HistoryIcon,
  SkillIcon,
  StoreIcon
} from '@acedatacloud/core/icons/components';
import { defineComponent, type Component } from 'vue';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_BROWSER_DEVICES,
  ROUTE_CONSOLE_CONNECTORS,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_SKILLS,
  ROUTE_CONSOLE_USAGE_LIST,
  ROUTE_INDEX
} from '@/router';
import { isOfficial } from '@/utils';

interface ILink {
  key: string;
  text: string;
  name?: string;
  href?: string;
  icon: Component;
  admin?: boolean;
}

export default defineComponent({
  name: 'ConsoleSidePanel',
  components: {
    ExternalLinkIcon
  },
  computed: {
    isOfficial() {
      return isOfficial();
    },
    active() {
      return this.$route.matched[0].path;
    },
    user() {
      return this.$store.getters.user;
    },
    links(): ILink[] {
      const links: ILink[] = [
        {
          key: 'application-list',
          text: this.$t('console.menu.applicationList'),
          name: ROUTE_CONSOLE_APPLICATION_LIST,
          icon: ApplicationIcon
        },
        {
          key: 'order-list',
          text: this.$t('console.menu.orderList'),
          name: ROUTE_CONSOLE_ORDER_LIST,
          icon: StoreIcon
        },
        {
          key: 'usage-list',
          text: this.$t('console.menu.usageList'),
          name: ROUTE_CONSOLE_USAGE_LIST,
          icon: HistoryIcon
        },
        {
          key: 'connectors',
          text: this.$t('console.menu.connectors'),
          name: ROUTE_CONSOLE_CONNECTORS,
          icon: ConnectionIcon
        },
        {
          key: 'skills',
          text: this.$t('console.menu.skills'),
          name: ROUTE_CONSOLE_SKILLS,
          icon: SkillIcon
        },
        {
          key: 'browser-devices',
          text: this.$t('console.menu.browserDevices'),
          name: ROUTE_CONSOLE_BROWSER_DEVICES,
          icon: DesktopIcon
        }
      ];

      // Order history stays visible on iOS — purchases now happen in-app via
      // Apple IAP, so users should see their orders.

      return links;
    }
  },
  mounted() {},
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onNavigate(link: ILink) {
      if (link.name) {
        this.$router.push({
          name: link.name
        });
      } else if (link.href) {
        window.open(link.href, '_blank');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.side {
  // Width comes from the layout (`--console-side-width` on `.console`) so the
  // sidebar has exactly one source of truth. The fallback keeps this component
  // usable if it is ever mounted outside the console layout.
  width: var(--console-side-width, 220px);
  padding-left: 12px;
  padding-top: 50px;
  height: 100%;
  box-sizing: border-box;
  background-color: var(--app-sidebar-bg);
}

.links {
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  gap: 4px;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  .link {
    $height: 40px;
    height: $height;
    // Grid instead of a block box with absolutely-positioned bits: the text
    // column is `minmax(0, 1fr)`, so a long label compresses rather than
    // pushing the row past the sidebar. Overflow is prevented structurally,
    // not hidden by an ancestor's `overflow-x`.
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 10px;
    width: 100%;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    padding: 0 12px;
    transition: background-color 0.15s ease;
    .icon {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .text {
      font-size: 14px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .outer {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
    }
    &.active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
      // Indicator drawn inside the row's own box. It used to be a `.suffix`
      // span at `right: -5px`, which pushed 5px outside the sidebar and was
      // only invisible because some pages' root element clipped it.
      &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 3px;
        height: $height;
        border-radius: 3px;
        background-color: var(--el-color-primary);
      }
    }
    &:hover {
      background-color: var(--el-fill-color-extra-light);
    }
  }
}

@media screen and (max-width: 767px) {
  .side {
    width: 100%;
    height: auto;
    padding: 0;
  }

  .links {
    width: 100%;
    flex-direction: row;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;

    .link {
      flex: 1 0 max-content;
      min-width: 96px;
      height: 36px;
      // Center icon + label as a pair; the desktop 3-column grid would
      // stretch them across the full pill width.
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 12px;
      white-space: nowrap;

      &.active::after {
        display: none;
      }
    }
  }
}
</style>
