<template>
  <el-dialog :model-value="visible" @close="onClose">
    <div class="flex settings h-[460px]">
      <aside class="h-full border-r">
        <el-menu class="border-r-0">
          <el-menu-item
            v-for="(item, index) in navItems"
            :key="index"
            :index="item.key"
            :class="[
              'flex w-[160px] truncate items-center px-2 cursor-pointer py-2',
              activeTab === item.key ? 'active' : ''
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
        <div v-else-if="activeTab === 'site' && isSiteAdmin">
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
        { key: 'general', label: this.$t('common.settings.general'), icon: faCog },
        { key: 'site', label: this.$t('common.settings.site'), icon: faBell },
        { key: 'seo', label: this.$t('common.settings.seo'), icon: faUserShield },
        { key: 'distribution', label: this.$t('common.settings.distribution'), icon: faMoneyBill },
        { key: 'function', label: this.$t('common.settings.function'), icon: faMagic }
      ];
    },
    currentTabTitle() {
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
