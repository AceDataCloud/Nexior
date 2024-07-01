<template>
  <el-dialog :model-value="visible" :width="300" class="text-center" @close="$emit('close')">
    <el-select v-model="value" @change="onSelectLocale">
      <el-option
        v-for="(locale, localeIndex) in locales"
        :key="localeIndex"
        :label="locale.label"
        :value="locale.value"
      />
    </el-select>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog, ElSelect, ElOption } from 'element-plus';
import { SUPPORTED_LOCALES, setI18nLanguage } from '@/i18n';
import { setCookie } from 'typescript-cookie';
import { getDomain } from '@/utils/initializer';

export default defineComponent({
  name: 'LocaleSelector',
  components: {
    ElDialog,
    ElSelect,
    ElOption
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  data() {
    return {
      value: this.$i18n.locale,
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
  display: inline-block;
}
</style>
