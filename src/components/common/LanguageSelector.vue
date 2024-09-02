<template>
  <div>
    <el-dropdown max-height="700" trigger="click" @command="onSelectLocale">
      <i class="icon">
        <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24" width="1.2em" height="1.2em">
          <path
            fill="currentColor"
            d="m18.5 10l4.4 11h-2.155l-1.201-3h-4.09l-1.199 3h-2.154L16.5 10h2zM10 2v2h6v2h-1.968a18.222 18.222 0 0 1-3.62 6.301a14.864 14.864 0 0 0 2.336 1.707l-.751 1.878A17.015 17.015 0 0 1 9 13.725a16.676 16.676 0 0 1-6.201 3.548l-.536-1.929a14.7 14.7 0 0 0 5.327-3.042A18.078 18.078 0 0 1 4.767 8h2.24A16.032 16.032 0 0 0 9 10.877a16.165 16.165 0 0 0 2.91-4.876L2 6V4h6V2h2zm7.5 10.885L16.253 16h2.492L17.5 12.885z"
          ></path>
        </svg>
      </i>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="(locale, localeIndex) in locales" :key="localeIndex" :command="locale.value">
            {{ locale.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus';
import { SUPPORTED_LOCALES, setI18nLanguage } from '@/i18n';
import { setCookie } from 'typescript-cookie';
import { getDomain } from '@/utils/initializer';

export default defineComponent({
  name: 'LanguageSelector',
  components: {
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu
  },
  data() {
    return {
      locales: SUPPORTED_LOCALES
    };
  },
  methods: {
    async onSelectLocale(locale: string) {
      // change router
      this.$router.push({ query: { ...this.$route.query, locale: undefined } });
      await setI18nLanguage(locale);
      this.setCookie(locale);
      window.location.reload();
    },
    setCookie(locale: string) {
      setCookie('LOCALE', locale, {
        path: '/',
        domain: getDomain()
      });
    }
  }
});
</script>

<style scoped>
.icon {
  cursor: pointer;
  font-size: 16px;
  margin-top: 4px;
  color: var(--el-menu-text-color);
  display: inline-block;
}
</style>
