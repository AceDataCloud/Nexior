<template>
  <el-dialog :model-value="visible" @close="onClose">
    <div class="flex h-full bg-gray-50">
      <aside class="w-56 bg-white border-r">
        <nav class="flex flex-col p-2 space-y-1">
          <button
            v-for="(item, index) in navItems"
            :key="index"
            @click="activeTab = item.key"
            :class="[
              'flex items-center px-4 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100',
              activeTab === item.key ? 'bg-gray-100 font-medium' : 'text-gray-700'
            ]"
          >
            <font-awesome-icon :icon="item.icon" class="mr-2 text-gray-500" />
            {{ item.label }}
          </button>
        </nav>
      </aside>

      <main class="flex-1 p-6 overflow-y-auto">
        <div v-if="activeTab === 'general'" class="space-y-6">
          <h2 class="text-lg font-semibold mb-4">通用设置</h2>
          <div class="flex justify-between items-center mb-4">
            <label class="block mb-2 text-sm font-medium text-gray-700">主题</label>
            <theme-switcher />
          </div>
          <div class="flex justify-between items-center mb-4">
            <label class="block mb-2 text-sm font-medium text-gray-700">语言</label>
            <locale-switcher />
          </div>
        </div>
        <div v-else-if="activeTab === 'notifications'">
          <p>这里是通知设置区域</p>
        </div>

        <div v-else-if="activeTab === 'privacy'">
          <p>这里是隐私管理区域</p>
        </div>
      </main>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCog, faBell, faUserShield } from '@fortawesome/free-solid-svg-icons';
import ThemeSwitcher from '@/components/user/Theme.vue';
import LocaleSwitcher from '@/components/user/Locale.vue';

export default defineComponent({
  name: 'UserSetting',
  components: { ElDialog, FontAwesomeIcon, ThemeSwitcher, LocaleSwitcher },
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
      showSuggestions: true,
      navItems: [
        { key: 'general', label: '通用设置', icon: faCog },
        { key: 'notifications', label: '通知', icon: faBell },
        { key: 'privacy', label: '数据管理', icon: faUserShield }
        // 可以继续加更多 tab，比如安全、账户等
      ]
    };
  },
  computed: {
    currentTabTitle() {
      const current = this.navItems.find((item) => item.key === this.activeTab);
      return current ? current.label : '';
    }
  },
  methods: {
    onClose() {
      this.$emit('update:visible', false);
    }
  }
});
</script>

<style scoped>
/* 你可以额外加动画或过渡效果 */
</style>
