<template>
  <el-dialog class="min-w-[450px]" :model-value="visible" :width="dialogWidth" @close="onClose">
    <div class="flex settings h-[450px]">
      <aside class="h-full border-r">
        <el-menu class="border-r-0 settings-menu">
          <el-menu-item
            v-for="(item, index) in navItems"
            :key="index"
            :index="item.key"
            :class="[
              'flex w-[180px] items-center px-2 cursor-pointer py-2',
              activeTab === item.key ? 'active' : '',
              item.visible ? '' : 'hidden'
            ]"
            @click="activeTab = item.key"
          >
            <font-awesome-icon :icon="item.icon" class="mr-2" />
            {{ item.label }}
          </el-menu-item>
        </el-menu>
      </aside>
      <main class="flex-1 p-6 overflow-y-auto">
        <div v-if="activeTab === SETTING_TAB_GENERAL">
          <general-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_API_KEY">
          <byok-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_SITE">
          <site-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_SEO && isSiteAdmin">
          <seo-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_DISTRIBUTION && isSiteAdmin">
          <distribution-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_FUNCTION && isSiteAdmin">
          <function-setting />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_SUBSITES && isMainOfficialHost">
          <subsite-setting :auto-open-create="autoOpenCreateSubsite" />
        </div>
        <div v-else-if="activeTab === SETTING_TAB_ABOUT">
          <about-setting @switch-tab="onSwitchTab" />
        </div>
      </main>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElMenu, ElMenuItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faCog,
  faBell,
  faKey,
  faUserShield,
  faMagic,
  faMoneyBill,
  faInfoCircle,
  faSitemap
} from '@fortawesome/free-solid-svg-icons';
import GeneralSetting from '@/components/setting/General.vue';
import ByokSetting from '@/components/setting/Byok.vue';
import SiteSetting from '@/components/setting/Site.vue';
import SeoSetting from '@/components/setting/Seo.vue';
import DistributionSetting from '@/components/setting/Distribution.vue';
import FunctionSetting from '@/components/setting/Function.vue';
import SubsiteSetting from '@/components/setting/Subsite.vue';
import AboutSetting from '@/components/setting/About.vue';
import {
  SETTING_TAB_ABOUT,
  SETTING_TAB_API_KEY,
  SETTING_TAB_DISTRIBUTION,
  SETTING_TAB_FUNCTION,
  SETTING_TAB_GENERAL,
  SETTING_TAB_SEO,
  SETTING_TAB_SITE,
  SETTING_TAB_SUBSITES,
  type SettingTabKey
} from '@/constants';
import { isMainOfficial } from '@/utils';

export default defineComponent({
  name: 'UserSetting',
  components: {
    ElDialog,
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon,
    GeneralSetting,
    ByokSetting,
    SiteSetting,
    SeoSetting,
    DistributionSetting,
    FunctionSetting,
    SubsiteSetting,
    AboutSetting
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialTab: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      // Expose the tab-key constants to the template so the v-if branches
      // and the navItems list refer to one source of truth.
      SETTING_TAB_GENERAL,
      SETTING_TAB_API_KEY,
      SETTING_TAB_SITE,
      SETTING_TAB_SEO,
      SETTING_TAB_DISTRIBUTION,
      SETTING_TAB_FUNCTION,
      SETTING_TAB_SUBSITES,
      SETTING_TAB_ABOUT,
      activeTab: SETTING_TAB_GENERAL as SettingTabKey,
      autoOpenCreateSubsite: false
    };
  },
  computed: {
    navItems(): Array<{ key: SettingTabKey; label: string; icon: typeof faCog; visible: boolean }> {
      return [
        { key: SETTING_TAB_GENERAL, label: this.$t('common.settings.general'), icon: faCog, visible: true },
        { key: SETTING_TAB_API_KEY, label: this.$t('common.settings.apiKey'), icon: faKey, visible: true },
        { key: SETTING_TAB_SITE, label: this.$t('common.settings.site'), icon: faBell, visible: this.isSiteAdmin },
        {
          key: SETTING_TAB_SEO,
          label: this.$t('common.settings.seo'),
          icon: faUserShield,
          visible: this.isSiteAdmin
        },
        {
          key: SETTING_TAB_DISTRIBUTION,
          label: this.$t('common.settings.distribution'),
          icon: faMoneyBill,
          visible: this.isSiteAdmin
        },
        {
          key: SETTING_TAB_FUNCTION,
          label: this.$t('common.settings.function'),
          icon: faMagic,
          visible: this.isSiteAdmin
        },
        {
          // Subsite (white-label child site) management. Only the official
          // main site (studio.acedata.cloud) exposes this — every subsite,
          // every white-label, and any other host doesn't get the entry.
          // The actual ``POST /api/v1/sites/`` is server-gated too, so
          // this is purely UI cleanup.
          key: SETTING_TAB_SUBSITES,
          label: this.$t('common.settings.subsites'),
          icon: faSitemap,
          visible: this.isMainOfficialHost
        },
        { key: SETTING_TAB_ABOUT, label: this.$t('common.settings.about'), icon: faInfoCircle, visible: true }
      ];
    },
    isSiteAdmin(): boolean {
      return !!this.$store?.state?.site?.admins?.includes(this.$store.getters.user?.id);
    },
    isMainOfficialHost(): boolean {
      return isMainOfficial();
    },
    dialogWidth(): string {
      // BYOK and Subsites both render multi-column tables that don't fit
      // the default 50% dialog width on most laptops.
      return this.activeTab === SETTING_TAB_API_KEY || this.activeTab === SETTING_TAB_SUBSITES ? '900px' : '50%';
    }
  },
  watch: {
    // When the parent opens the dialog with an explicit `initialTab`,
    // respect that on each open. Default is back to the General tab.
    visible(open: boolean) {
      if (open) {
        this.activeTab = (this.initialTab as SettingTabKey) || SETTING_TAB_GENERAL;
        this.autoOpenCreateSubsite = false;
      }
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false);
    },
    /**
     * Switch to a different tab from a child component. Used by the
     * About tab's "Build same site" button to drop the user straight
     * into the Subsites tab with the create dialog already open.
     */
    onSwitchTab(payload: { tab: SettingTabKey; autoOpenCreateSubsite?: boolean }) {
      if (!payload?.tab) return;
      this.activeTab = payload.tab;
      this.autoOpenCreateSubsite = payload.tab === SETTING_TAB_SUBSITES && !!payload.autoOpenCreateSubsite;
    }
  }
});
</script>

<style lang="scss" scoped>
:deep(.settings-list) {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

:deep(.settings-menu .el-menu-item) {
  white-space: normal;
  height: auto;
  line-height: 1.4;
  padding-top: 10px;
  padding-bottom: 10px;
}

:deep(.settings-menu .el-menu-item .el-menu-item__content) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  word-break: break-word;
}

:deep(.settings-menu .el-menu-item .svg-inline--fa) {
  margin-top: 2px;
}

:deep(.settings-item) {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-border-color-lighter) 40%, transparent);
}

:deep(.settings-item:last-child) {
  border-bottom: none;
  padding-bottom: 0;
}

:deep(.settings-label) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--el-text-color-primary);
}

:deep(.settings-title) {
  font-weight: 600;
  font-size: 14px;
}

:deep(.settings-tip) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  max-width: 440px;
}

:deep(.settings-content) {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 200px;
  text-align: right;
}

:deep(.settings-value) {
  color: var(--el-text-color-regular);
  word-break: break-word;
}

@media (max-width: 640px) {
  :deep(.settings-item) {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.settings-content) {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
}
</style>
