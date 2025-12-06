<template>
  <el-dialog class="min-w-[450px]" :model-value="visible" @close="onClose">
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
        <div v-if="activeTab === 'general'">
          <general-setting />
        </div>
        <div v-else-if="activeTab === 'site'">
          <site-setting />
        </div>
        <div v-else-if="activeTab === 'seo' && isSiteAdmin">
          <seo-setting />
        </div>
        <div v-else-if="activeTab === 'distribution' && isSiteAdmin">
          <distribution-setting />
        </div>
        <div v-else-if="activeTab === 'function' && isSiteAdmin">
          <function-setting />
        </div>
      </main>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElMenu, ElMenuItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCog, faBell, faUserShield, faMagic, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import GeneralSetting from '@/components/setting/General.vue';
import SiteSetting from '@/components/setting/Site.vue';
import SeoSetting from '@/components/setting/Seo.vue';
import DistributionSetting from '@/components/setting/Distribution.vue';
import FunctionSetting from '@/components/setting/Function.vue';

export default defineComponent({
  name: 'UserSetting',
  components: {
    ElDialog,
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon,
    GeneralSetting,
    SiteSetting,
    SeoSetting,
    DistributionSetting,
    FunctionSetting
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      activeTab: 'general',
      showSuggestions: true
    };
  },
  computed: {
    navItems() {
      return [
        { key: 'general', label: this.$t('common.settings.general'), icon: faCog, visible: true },
        { key: 'site', label: this.$t('common.settings.site'), icon: faBell, visible: this.isSiteAdmin },
        { key: 'seo', label: this.$t('common.settings.seo'), icon: faUserShield, visible: this.isSiteAdmin },
        {
          key: 'distribution',
          label: this.$t('common.settings.distribution'),
          icon: faMoneyBill,
          visible: this.isSiteAdmin
        },
        { key: 'function', label: this.$t('common.settings.function'), icon: faMagic, visible: this.isSiteAdmin }
      ];
    },
    currentTabTitle() {
      console.debug('activeTab', this.activeTab);
      const current = this.navItems.find((item) => item.key === this.activeTab);
      return current ? current.label : '';
    },
    isSiteAdmin(): boolean {
      return !!this.$store?.state?.site?.admins?.includes(this.$store.getters.user?.id);
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false);
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
  border-bottom: 1px solid var(--el-border-color-lighter);
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
