<template>
  <div class="organic-result rounded-lg p-4 transition-all duration-200 hover:bg-[var(--el-fill-color-lighter)]">
    <div v-if="displayUrl" class="flex items-center gap-2 mb-1.5">
      <img
        :src="faviconUrl"
        :alt="hostname"
        class="w-4 h-4 rounded-sm flex-none"
        loading="lazy"
        @error="onFaviconError"
      />
      <span class="text-xs text-[var(--el-text-color-secondary)] truncate">{{ hostname }}</span>
      <span class="text-xs text-[var(--el-text-color-disabled)]">{{ pathname }}</span>
    </div>
    <a
      :href="data.link"
      target="_blank"
      rel="noopener noreferrer"
      class="text-base font-semibold text-[var(--el-color-primary)] hover:underline leading-snug block"
    >
      {{ data.title }}
    </a>
    <div v-if="data.date" class="text-xs text-[var(--el-text-color-disabled)] mt-1">{{ data.date }}</div>
    <p v-if="data.snippet" class="text-sm text-[var(--el-text-color-regular)] mt-1.5 leading-relaxed line-clamp-3">
      {{ data.snippet }}
    </p>
    <div v-if="data.sitelinks?.length" class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      <a
        v-for="(sitelink, index) in data.sitelinks"
        :key="index"
        :href="sitelink.link"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-[var(--el-color-primary-light-3)] hover:text-[var(--el-color-primary)] hover:underline transition-colors"
      >
        {{ sitelink.title }}
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ISerpOrganicResult } from '@/models';

export default defineComponent({
  name: 'OrganicResult',
  props: {
    data: {
      type: Object as PropType<ISerpOrganicResult>,
      required: true
    }
  },
  data() {
    return {
      faviconFailed: false
    };
  },
  computed: {
    hostname(): string {
      if (!this.data.link) return '';
      try {
        return new URL(this.data.link).hostname;
      } catch {
        return '';
      }
    },
    pathname(): string {
      if (!this.data.link) return '';
      try {
        const path = new URL(this.data.link).pathname;
        return path === '/' ? '' : path;
      } catch {
        return '';
      }
    },
    displayUrl(): string {
      return this.hostname;
    },
    faviconUrl(): string {
      if (this.faviconFailed || !this.hostname) return '';
      return `https://www.google.com/s2/favicons?domain=${this.hostname}&sz=32`;
    }
  },
  methods: {
    onFaviconError(e: Event) {
      this.faviconFailed = true;
      (e.target as HTMLImageElement).style.display = 'none';
    }
  }
});
</script>
