<template>
  <div class="side-panel">
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
import { BASE_HOST_HUB } from '@/constants';
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
$width: 300px;
$padding-left: 10px;
.side-panel {
  padding-left: $padding-left;
  width: $width;
  padding-top: 50px;
  height: 100%;
}

.logo {
  width: 100%;
  cursor: pointer;
  margin-bottom: 30px;
}

.links {
  width: $width;
  .link {
    $height: 40px;
    height: $height;
    display: block;
    width: calc(100% - #{$padding-left});
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 5px;
    position: relative;
    color: var(--el-text-color-primary);
    line-height: $height;
    padding-left: 10px;
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
      .suffix {
        background-color: var(--el-color-primary);
      }
    }
    &:hover {
      background-color: var(--el-fill-color-extra-light);
    }
  }
}
</style>
