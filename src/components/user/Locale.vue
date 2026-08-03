<template>
  <el-dropdown v-if="!isForced" trigger="click" @command="onSelectLocale">
    <span class="el-dropdown-link">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
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
import { ExpandDownIcon as ArrowDown } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';

import { setCookie } from 'typescript-cookie';
import { getDomain } from '@/utils';
import { setI18nLanguage } from '@/i18n';
import { getForcedLocale, getSiteLocaleOptions, resolveSiteLocale } from '@/utils/siteLocales';

export default defineComponent({
  name: 'Locale',
  components: {
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon,
    ArrowDown
  },
  computed: {
    site() {
      return this.$store.getters.site;
    },
    locales() {
      return getSiteLocaleOptions(this.site?.supported_locales);
    },
    isForced(): boolean {
      return !!getForcedLocale(this.site);
    },
    value(): string {
      return this.$i18n.locale;
    },
    currentLabel(): string {
      const found = this.locales.find((l) => l.value === this.value);
      return found ? found.label : this.value;
    }
  },
  watch: {
    locales: {
      immediate: true,
      handler() {
        this.ensureAllowedLocale();
      }
    },
    // `locales` can stay identical while the pin changes, so watch it too.
    isForced() {
      this.ensureAllowedLocale();
    }
  },
  methods: {
    async ensureAllowedLocale() {
      const locale = resolveSiteLocale(this.value, this.site);
      if (locale === this.value) return;
      await this.applyLocale(locale);
    },
    async onSelectLocale(locale: string) {
      this.$router.push({ query: { ...this.$route.query, locale: undefined } });
      await this.applyLocale(locale);
    },
    async applyLocale(locale: string) {
      await setI18nLanguage(locale);
      setCookie('LOCALE', locale, {
        path: '/',
        domain: getDomain()
      });
    }
  }
});
</script>
