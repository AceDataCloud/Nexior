<template>
  <el-dropdown trigger="click" @command="onSelectLocale">
    <span class="el-dropdown-link">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="(locale, idx) in locales" :key="idx" :command="locale.value">
          {{ locale.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { setCookie } from 'typescript-cookie';
import { getDomain } from '@/utils/initializer';
import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';
import { setI18nLanguage } from '@/i18n';

export default defineComponent({
  name: 'Locale',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon,
    ArrowDown
  },
  data() {
    return {
      locales: I18N_SUPPORTED_LOCALES
    };
  },
  computed: {
    value(): string {
      return this.$i18n.locale;
    },
    currentLabel(): string {
      const found = this.locales.find((l) => l.value === this.value);
      return found ? found.label : this.value;
    }
  },
  methods: {
    async onSelectLocale(locale: string) {
      this.$router.push({ query: { ...this.$route.query, locale: undefined } });
      await setI18nLanguage(locale);
      setCookie('LOCALE', locale, {
        path: '/',
        domain: getDomain()
      });
    }
  }
});
</script>
