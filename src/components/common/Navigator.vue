<template>
  <div :direction="direction" class="navigator">
    <div class="top">
      <div v-if="direction === 'column'">
        <logo-tiny @click="onHome" />
      </div>
      <div
        v-for="(link, linkIndex) in links"
        :key="linkIndex"
        :class="{link: true, active: link.routes.includes($route.name as string)}"
      >
        <el-tooltip v-if="direction === 'column'" effect="dark" :content="link.displayName" placement="right">
          <el-button
            :class="{button: true, active: link.routes.includes($route.name as string)}"
            @click="$router.push(link.route)"
          >
            <font-awesome-icon :icon="link.icon" />
          </el-button>
        </el-tooltip>
        <div v-else class="cursor-pointer" @click="$router.push(link.route)">
          <font-awesome-icon :icon="link.icon" />
          <p class="description">{{ link.displayName }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  ROUTE_CHAT_CONVERSATION,
  ROUTE_CHAT_CONVERSATION_NEW,
  ROUTE_CONSOLE_ROOT,
  ROUTE_PROFILE_INDEX,
  ROUTE_DISTRIBUTION_INDEX,
  ROUTE_INDEX,
  ROUTE_MIDJOURNEY_INDEX,
  ROUTE_QRART_INDEX,
  ROUTE_QRART_HISTORY,
  ROUTE_LUMA_INDEX,
  ROUTE_LUMA_HISTORY,
  ROUTE_PIKA_INDEX,
  ROUTE_PIKA_HISTORY,
  ROUTE_HAILUO_INDEX,
  ROUTE_HAILUO_HISTORY,
  ROUTE_HEADSHOTS_INDEX,
  ROUTE_HEADSHOTS_HISTORY,
  ROUTE_SUNO_INDEX,
  ROUTE_SUNO_HISTORY,
  ROUTE_SITE_INDEX
} from '@/router/constants';
import LogoTiny from './LogoTiny.vue';
import HelpEntry from '@/components/common/HelpEntry.vue';

export default defineComponent({
  name: 'Navigator',
  components: {
    ElButton,
    LogoTiny,
    ElTooltip,
    FontAwesomeIcon
  },
  props: {
    direction: {
      type: String,
      default: 'column'
    }
  },
  data() {
    return {
      operating: {
        dark: false,
        locale: false
      },
      activeIndex: this.$route.name as string
    };
  },
  computed: {
    links() {
      const result = [];
      // Add chat's leftmost icon
      if (this.$store?.state?.site?.features?.chat?.enabled) {
        result.push({
          route: {
            name: ROUTE_CHAT_CONVERSATION_NEW
          },
          displayName: this.$t('common.nav.chat'),
          icon: 'fa-regular fa-comment',
          routes: [ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW]
        });
      }
      // Add midjourney's leftmost icon
      if (this.$store?.state?.site?.features?.midjourney?.enabled) {
        result.push({
          route: {
            name: ROUTE_MIDJOURNEY_INDEX
          },
          displayName: this.$t('common.nav.image'),
          icon: 'fa-solid fa-palette',
          routes: [ROUTE_MIDJOURNEY_INDEX]
        });
      }
      // Add chatdoc's leftmost icon
      /*
      if (this.$store?.state?.site?.features?.chatdoc?.enabled) {
        result.push({
          route: {
            name: ROUTE_CHATDOC_INDEX
          },
          displayName: this.$t('common.nav.chatdoc'),
          icon: 'fa-solid fa-file-lines',
          routes: [ROUTE_CHATDOC_INDEX, ROUTE_CHATDOC_CONVERSATION, ROUTE_CHATDOC_MANAGE, ROUTE_CHATDOC_SETTING]
        });
      }
      */
      // Add qrart's leftmost icon
      if (this.$store?.state?.site?.features?.qrart?.enabled) {
        result.push({
          route: {
            name: ROUTE_QRART_INDEX
          },
          displayName: this.$t('common.nav.qrart'),
          icon: 'fa-solid fa-qrcode',
          routes: [ROUTE_QRART_INDEX, ROUTE_QRART_HISTORY]
        });
      }
      // Add suno's leftmost icon
      if (this.$store?.state?.site?.features?.suno?.enabled) {
        result.push({
          route: {
            name: ROUTE_SUNO_INDEX
          },
          displayName: this.$t('common.nav.music'),
          icon: 'fa-solid fa-music',
          routes: [ROUTE_SUNO_INDEX, ROUTE_SUNO_HISTORY]
        });
      }
      // Add luma, pika, hailuo's leftmost icon
      if (
        this.$store?.state?.site?.features?.luma?.enabled ||
        this.$store?.state?.site?.features?.pika?.enabled ||
        this.$store?.state?.site?.features?.hailuo?.enabled
      ) {
        result.push({
          route: {
            name: this.$store?.state?.site?.features?.luma?.enabled
              ? ROUTE_LUMA_INDEX
              : this.$store?.state?.site?.features?.pika?.enabled
              ? ROUTE_PIKA_INDEX
              : ROUTE_HAILUO_INDEX
          },
          displayName: this.$t('common.nav.video'),
          icon: 'fa-solid fa-film',
          routes: [
            ROUTE_LUMA_INDEX,
            ROUTE_LUMA_HISTORY,
            ROUTE_PIKA_INDEX,
            ROUTE_PIKA_HISTORY,
            ROUTE_HAILUO_INDEX,
            ROUTE_HAILUO_HISTORY
          ]
        });
      }
      // Add headshots's leftmost icon
      if (this.$store?.state?.site?.features?.headshots?.enabled) {
        result.push({
          route: {
            name: ROUTE_HEADSHOTS_INDEX
          },
          displayName: this.$t('common.nav.headshots'),
          icon: 'fa-solid fa-id-card',
          routes: [ROUTE_HEADSHOTS_INDEX, ROUTE_HEADSHOTS_HISTORY]
        });
      }

      if (this.direction === 'row') {
        result.push({
          route: {
            name: ROUTE_PROFILE_INDEX
          },
          displayName: this.$t('common.nav.profile'),
          icon: 'fa-solid fa-user',
          routes: [ROUTE_PROFILE_INDEX]
        });
      }
      return result;
    },
    authenticated() {
      return !!this.$store.state.token.access;
    },
    showSite() {
      return this.$store?.state?.site?.admins?.includes(this.$store.getters.user?.id);
    },
    showSupport() {
      return (
        this.$store?.state?.site?.features?.support?.enabled &&
        (this.$store?.state?.site?.features?.support?.discord?.enabled ||
          this.$store?.state?.site?.features?.support?.wechat?.enabled)
      );
    },
    showDistribution() {
      return (
        // if forcedInviterId is set, only the forced inviter can see the distribution menu
        // if forcedInviterId is not set, everyone can see the distribution menu
        !this.$store?.state?.site?.distribution?.force_inviter_id ||
        this.$store.getters.user?.id === this.$store?.state?.site?.distribution?.force_inviter_id
      );
    }
  },
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onSite() {
      this.$router.push({
        name: ROUTE_SITE_INDEX
      });
    },
    onDistribution() {
      this.$router.push({
        name: ROUTE_DISTRIBUTION_INDEX
      });
    },
    async onLogout() {
      await this.$store.dispatch('logout');
    },
    onConsole() {
      this.$router.push({ name: ROUTE_CONSOLE_ROOT });
    }
  }
});
</script>

<style lang="scss" scoped>
.navigator {
  display: flex;
  align-items: center;
  position: relative;
  &[direction='row'] {
    flex-direction: row;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color);
    .chevron,
    .logo {
      display: none;
    }
    .top {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-evenly;
      width: 100%;
      .link {
        text-align: center;
        .description {
          font-size: 10px;
          margin-top: 3px;
        }
        &.active {
          color: var(--el-color-primary);
        }
      }
    }
    .bottom {
      display: none;
    }
  }
  &[direction='column'] {
    flex-direction: column;
    .el-menu {
      width: 150px;
      border-right: none;
      background: none;
      .el-menu-item {
        height: 50px;
        color: var(--el-text-color-primary);
        &.active,
        &:hover,
        &:focus {
          background-color: var(--el-button-hover-bg-color);
          color: var(--el-color-primary);
        }
      }
    }

    .chevron {
      position: absolute;
      right: -12px;
      top: 50%;
      transform: translateY(-50%) scale(0.8);
      z-index: 10;
    }

    .logo {
      width: 80%;
      max-height: 50px;
      cursor: pointer;
      margin: 10px auto 20px auto;
      display: block;
      &.tiny {
        margin: 0 auto 10px auto;
        width: 40px;
        height: 40px;
      }
    }

    .top,
    .bottom {
      display: flex;
      flex-direction: column;
      padding-top: 10px;
      min-width: 60px;
      .link {
        width: 40px;
        height: 40px;
        margin: 0 10px 10px 10px;
        .button {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          color: var(--el-text-color-primary);
          background-color: var(--el-bg-color-page);
          &.active,
          &:hover,
          &:focus {
            color: var(--el-button-active-text-color);
          }
        }
      }
    }
    .bottom {
      display: block;
      position: absolute;
      bottom: 0;
    }
  }
}
</style>
