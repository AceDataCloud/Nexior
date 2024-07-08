<template>
  <div class="profile">
    <div class="info">
      <el-image :src="user.avatar" fit="cover" class="avatar" />
      <h2>
        {{ user.username }}
      </h2>
      <div :style="{ backgroundImage: 'url(' + user.avatar + ')' }" class="background" />
    </div>
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
        <span class="suffix">
          <font-awesome-icon icon="fa-solid fa-chevron-right" class="text-sm" />
        </span>
      </a>
    </div>
    <locale-selector :visible="operating.locale == true" @close="operating.locale = false" />
    <dark-selector :visible="operating.dark == true" @close="operating.dark = false" />
    <help-dialog :visible="operating.help == true" @close="operating.help = false" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_USAGE_LIST,
  ROUTE_DISTRIBUTION_INDEX,
  ROUTE_INDEX,
  ROUTE_SITE_INDEX
} from '@/router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlAuth, getBaseUrlPlatform } from '@/utils';
import LocaleSelector from '@/components/common/LocaleSelector.vue';
import DarkSelector from '@/components/common/DarkSelector.vue';
import HelpDialog from '@/components/common/HelpDialog.vue';

interface ILink {
  key: string;
  text: string;
  name?: string;
  href?: string;
  icon: string;
  admin?: boolean;
  callback?: () => void;
}
export default defineComponent({
  name: 'ProfileIndex',
  components: {
    ElImage,
    HelpDialog,
    FontAwesomeIcon,
    LocaleSelector,
    DarkSelector
  },
  data() {
    return {
      operating: {
        locale: false,
        dark: false,
        help: false
      }
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    showSupport() {
      return (
        this.$store?.state?.site?.features?.support?.enabled &&
        (this.$store?.state?.site?.features?.support?.discord?.enabled ||
          this.$store?.state?.site?.features?.support?.wechat?.enabled)
      );
    },
    showSite() {
      return this.$store?.state?.site?.admins?.includes(this.$store.getters.user?.id);
    },
    links(): ILink[] {
      let links: ILink[] = [
        {
          key: 'profile',
          text: this.$t('console.menu.userProfile'),
          href: `${getBaseUrlAuth()}/user/profile`,
          icon: 'fa-regular fa-user'
        },
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
        },
        {
          key: 'distribution-index',
          text: this.$t('console.menu.distributionIndex'),
          name: ROUTE_DISTRIBUTION_INDEX,
          icon: 'fa-solid fa-coins'
        },
        ...(this.showSite
          ? [
              {
                key: 'site-index',
                text: this.$t('common.nav.site'),
                name: ROUTE_SITE_INDEX,
                icon: 'fa-solid fa-gear'
              }
            ]
          : []),
        {
          key: 'dark-setting',
          text: this.$t('common.nav.darkMode'),
          icon: 'fa-solid fa-moon',
          callback: () => {
            this.operating.dark = true;
          }
        },
        {
          key: 'locale-setting',
          text: this.$t('common.nav.locale'),
          icon: 'fa-solid fa-language',
          callback: () => {
            this.operating.locale = true;
          }
        },
        {
          key: 'developerPlatform',
          text: this.$t('console.menu.developerPlatform'),
          href: getBaseUrlPlatform(),
          icon: 'fa-solid fa-laptop-code'
        },
        ...(this.showSupport
          ? [
              {
                key: 'support',
                text: this.$t('common.nav.support'),
                callback: () => {
                  this.operating.help = true;
                },
                icon: 'fa-solid fa-question'
              }
            ]
          : []),
        {
          key: 'logout',
          text: this.$t('common.nav.logOut'),
          icon: 'fa-solid fa-arrow-right-from-bracket',
          callback: async () => {
            await this.$store.dispatch('resetAll');
            await this.$store.dispatch('chat/resetAll');
            await this.$store.dispatch('midjourney/resetAll');
            await this.$store.dispatch('chatdoc/resetAll');
            await this.$store.dispatch('qrart/resetAll');
            await this.$store.dispatch('login');
          }
        }
      ];

      return links;
    }
  },
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
      } else if (link.callback) {
        link.callback();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
}
.info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 0 20px 0;
  height: 200px !important;
  overflow: hidden;
  position: relative;
  .background {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
    filter: blur(15px) brightness(0.7);
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
  }
  h2 {
    font-size: 18px;
  }
}
</style>

<style lang="scss" scoped>
$width: 100%;
$padding-left: 10px;

.links {
  width: $width;
  flex: 1;
  padding: 20px;

  .link {
    $height: 40px;
    height: $height;
    display: block;
    width: 100%;
    cursor: pointer;
    margin-bottom: 5px;
    position: relative;
    color: var(--el-text-color-primary);
    line-height: $height;
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
  }
}
</style>
