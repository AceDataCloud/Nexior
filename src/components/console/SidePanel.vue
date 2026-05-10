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
          <font-awesome-icon :icon="link.icon" class="text-sm" />
        </span>
        <span class="text">{{ link.text }}</span>
        <span class="outer">
          <font-awesome-icon
            v-if="!link.name && link.href"
            icon="fa-solid fa-up-right-from-square"
            class="text-sm ml-2"
          />
        </span>
        <span class="suffix"> </span>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_USAGE_LIST,
  ROUTE_INDEX
} from '@/router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { isOfficial } from '@/utils';

interface ILink {
  key: string;
  text: string;
  name?: string;
  href?: string;
  icon: string;
  admin?: boolean;
}

export default defineComponent({
  name: 'Navigator',
  components: {
    FontAwesomeIcon
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
      let links: ILink[] = [
        {
          key: 'application-list',
          text: this.$t('console.menu.applicationList'),
          name: ROUTE_CONSOLE_APPLICATION_LIST,
          icon: 'fa-solid fa-cube'
        },
        {
          key: 'order-list',
          text: this.$t('console.menu.orderList'),
          name: ROUTE_CONSOLE_ORDER_LIST,
          icon: 'fa-solid fa-store'
        },
        {
          key: 'usage-list',
          text: this.$t('console.menu.usageList'),
          name: ROUTE_CONSOLE_USAGE_LIST,
          icon: 'fa-solid fa-rotate-left'
        }
      ];

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
$width: 220px;
$padding-left: 12px;
.side {
  padding-left: $padding-left;
  width: $width;
  padding-top: 50px;
  height: 100%;
}

.links {
  width: $width - $padding-left;
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
    display: block;
    width: 100%;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    color: var(--el-text-color-primary);
    line-height: $height;
    padding-left: 12px;
    transition: background-color 0.15s ease;
    .suffix {
      width: 3px;
      height: $height;
      position: absolute;
      right: -5px;
      margin-right: 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .icon {
      width: 16px;
      height: 16px;
      display: inline-block;
      position: relative;
      margin-right: 10px;
      transform: translateY(-2%);
    }
    .text {
      font-size: 14px;
    }
    &.active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 500;
      .suffix {
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
      line-height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 12px;
      white-space: nowrap;

      .icon {
        margin-right: 6px;
      }

      .suffix {
        display: none;
      }
    }
  }
}
</style>
