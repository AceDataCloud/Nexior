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
    <help-dialog :visible="operating.help == true" @close="operating.help = false" />
    <el-dialog
      v-model="deleteDialogVisible"
      :title="$t('common.nav.deleteAccount')"
      width="90%"
      align-center
      class="delete-account-dialog"
      @closed="onDeleteDialogClosed"
    >
      <el-alert
        :title="$t('common.message.deleteAccountWarning')"
        type="error"
        :closable="false"
        show-icon
        class="mb-3"
      />
      <p class="delete-consequences">{{ $t('common.message.deleteAccountConsequences') }}</p>
      <p class="delete-type-prompt">{{ $t('common.message.deleteAccountTypePrompt') }}</p>
      <p class="delete-username">{{ user.username }}</p>
      <el-input
        v-model="deleteConfirmText"
        :placeholder="$t('common.message.deleteAccountPlaceholder')"
        autocomplete="off"
      />
      <template #footer>
        <el-button round @click="deleteDialogVisible = false">
          {{ $t('common.button.cancel') }}
        </el-button>
        <el-button
          type="danger"
          round
          :disabled="!deleteConfirmMatched"
          :loading="deleting"
          @click="confirmDeleteAccount"
        >
          {{ $t('common.button.deletePermanently') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElImage, ElMessage, ElDialog, ElInput, ElButton, ElAlert } from 'element-plus';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_CONSOLE_USAGE_LIST,
  ROUTE_DISTRIBUTION_INDEX,
  ROUTE_INDEX,
  ROUTE_SETTINGS_INDEX
} from '@/router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getBaseUrlAuth, getBaseUrlPlatform, isIOS, withCurrentUserIdAndSite } from '@/utils';
import { userOperator } from '@/operators';
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
    ElDialog,
    ElInput,
    ElButton,
    ElAlert,
    HelpDialog,
    FontAwesomeIcon
  },
  data() {
    return {
      operating: {
        locale: false,
        dark: false,
        help: false
      },
      deleteDialogVisible: false,
      deleteConfirmText: '',
      deleting: false
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    // Require the user to type their exact username to unlock the
    // irreversible delete — a locale-independent guard against misclicks.
    deleteConfirmMatched(): boolean {
      const username = this.$store.getters.user?.username;
      return !!username && this.deleteConfirmText.trim() === username;
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
                name: ROUTE_SETTINGS_INDEX,
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
        ...(isIOS()
          ? [
              {
                key: 'delete-account',
                text: this.$t('common.nav.deleteAccount'),
                icon: 'fa-solid fa-user-xmark',
                callback: () => {
                  this.onDeleteAccount();
                }
              }
            ]
          : []),
        {
          key: 'logout',
          text: this.$t('common.nav.logOut'),
          icon: 'fa-solid fa-arrow-right-from-bracket',
          callback: async () => {
            await this.$store.dispatch('logout');
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
    onDeleteAccount() {
      this.deleteConfirmText = '';
      this.deleteDialogVisible = true;
    },
    async confirmDeleteAccount() {
      if (!this.deleteConfirmMatched || this.deleting) {
        return;
      }
      this.deleting = true;
      try {
        await userOperator.deleteMe();
        this.deleting = false;
        this.deleteDialogVisible = false;
        ElMessage.success(this.$t('common.message.deleteAccountSuccess').toString());
        await this.$store.dispatch('logout');
        this.$router.push({ name: ROUTE_INDEX });
      } catch {
        this.deleting = false;
        ElMessage.error(this.$t('common.message.deleteAccountFailed').toString());
      }
    },
    onDeleteDialogClosed() {
      this.deleteConfirmText = '';
    },
    onNavigate(link: ILink) {
      if (link.name) {
        this.$router.push({
          name: link.name
        });
      } else if (link.href) {
        // Append `?user_id=<currentUserId>` so the destination site can
        // detect a cross-site identity mismatch and re-auth, plus `?site=`
        // so AuthFrontend renders the calling subsite's white-label logo
        // (no-op on the bare main official host).
        window.open(withCurrentUserIdAndSite(link.href), '_blank');
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
    filter: blur(20px) brightness(0.6);
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(var(--app-brand-rgb), 0.3);
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
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
    $height: 44px;
    height: $height;
    display: block;
    width: 100%;
    cursor: pointer;
    margin-bottom: 4px;
    position: relative;
    color: var(--el-text-color-primary);
    line-height: $height;
    border-radius: 12px;
    padding: 0 12px;
    transition: background-color 0.15s ease;
    &:hover {
      background-color: var(--el-fill-color-extra-light);
    }
    .suffix {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--el-text-color-placeholder);
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

<style lang="scss" scoped>
.delete-account-dialog {
  .mb-3 {
    margin-bottom: 12px;
  }
  .delete-consequences {
    margin: 12px 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
  }
  .delete-type-prompt {
    margin: 12px 0 4px;
    font-size: 13px;
  }
  .delete-username {
    margin: 0 0 10px;
    font-weight: 700;
    font-size: 15px;
    word-break: break-all;
    color: var(--el-color-danger);
  }
}
</style>
