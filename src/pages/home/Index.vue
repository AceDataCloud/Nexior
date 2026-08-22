<template>
  <main v-if="siteLoaded" class="studio-home">
    <div class="dashboard">
      <home-carousel v-if="banners.length" :slides="banners" @image-error="onImageError" />
      <category-tiles
        v-if="categories.length"
        :items="categories"
        @category-image-error="onCategoryImageError"
        @icon-error="onIconError"
      />
      <showcase-grid
        v-if="visibleShowcases.length"
        :items="visibleShowcases"
        :eyebrow="$t('intro.home.showcase.eyebrow')"
        :title="$t('intro.home.showcase.title')"
        :subtitle="$t('intro.home.showcase.subtitle')"
        :aria-label="$t('intro.home.showcase.title')"
        detail-preview
        @select="selectedShowcase = $event"
        @icon-error="onShowcaseIconError"
      />
      <button
        v-if="hasMoreShowcases"
        ref="showcaseLoadMore"
        type="button"
        class="showcase-load-more"
        @click="onShowcaseLoadMoreClick"
      >
        {{ $t('intro.home.showcase.loadMore') }}
      </button>
    </div>
    <showcase-detail-dialog :item="selectedShowcase" @close="selectedShowcase = undefined" />
  </main>
  <div v-else class="home-loading" role="status" :aria-label="$t('common.status.loading')">
    <span />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import type { ISiteBanner, IShowcase, ResolvedShowcase } from '@/models';
import { showcaseOperator, siteBannerOperator } from '@/operators';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { resolveShowcase } from '@/utils/showcase';
import { getSiteOrigin } from '@/utils/site';
import { getHiddenDefaultBannerIds, resolveSiteBannerText } from '@/utils/siteBanner';
import ShowcaseGrid from '@/components/common/ShowcaseGrid.vue';
import ShowcaseDetailDialog from '@/components/showcase/ShowcaseDetailDialog.vue';
import CategoryTiles from './components/CategoryTiles.vue';
import HomeCarousel from './components/HomeCarousel.vue';
import {
  HOME_BANNERS,
  HOME_CATEGORIES,
  type HomeCapability,
  type ResolvedHomeBanner,
  type ResolvedHomeCapability,
  type ResolvedHomeCategory
} from './data';

const SHOWCASE_BATCH_SIZE = 12;

export default defineComponent({
  name: 'StudioHome',
  components: {
    CategoryTiles,
    ShowcaseGrid,
    ShowcaseDetailDialog,
    HomeCarousel
  },
  data() {
    return {
      failedIcons: {} as Partial<Record<CapabilityKey, boolean>>,
      failedBannerImages: {} as Record<string, boolean>,
      failedCategoryImages: {} as Record<string, boolean>,
      rawBanners: [] as ISiteBanner[],
      bannerLoadGeneration: 0,
      rawShowcases: [] as IShowcase[],
      showcaseLoaded: false,
      showcaseLoadGeneration: 0,
      visibleShowcaseCount: SHOWCASE_BATCH_SIZE,
      showcaseLoadObserver: undefined as IntersectionObserver | undefined,
      showcaseAutoLoadArmed: true,
      selectedShowcase: undefined as ResolvedShowcase | undefined
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    siteLoaded(): boolean {
      return Boolean(this.site?.id);
    },
    enabledKeys(): Set<CapabilityKey> {
      if (!this.siteLoaded) return new Set();
      const features = (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
      return new Set(CAPABILITY_KEYS.filter((key) => features[key]?.enabled));
    },
    banners(): ResolvedHomeBanner[] {
      const hiddenDefaults = getHiddenDefaultBannerIds(this.site);
      const defaults = HOME_BANNERS.filter(
        (item) => this.enabledKeys.has(item.capability) && !hiddenDefaults.has(item.id)
      ).map((item) => ({
        ...this.resolve(item),
        id: item.id,
        imageUrl: this.failedBannerImages[item.id] ? '' : item.imageUrl,
        eyebrow: this.$t(item.eyebrowKey),
        title: this.$t(item.titleKey),
        target: { routeName: item.routeName }
      }));
      const locale = String(this.$i18n.locale || 'en');
      const custom = this.rawBanners.map((item) => {
        const title = resolveSiteBannerText(item.title, locale);
        return {
          id: item.id || `custom-${item.sort_order || 0}`,
          name: title,
          eyebrow: '',
          title,
          description: resolveSiteBannerText(item.subtitle, locale),
          icon: this.site?.logo || this.site?.favicon || '',
          defaultIcon: this.site?.logo || this.site?.favicon || '',
          imageUrl: this.failedBannerImages[item.id || ''] ? '' : item.image_url || '',
          target: item.link_url ? { href: item.link_url } : null
        } as ResolvedHomeBanner;
      });
      return [...defaults, ...custom];
    },
    categories(): ResolvedHomeCategory[] {
      const resolved: ResolvedHomeCategory[] = [];
      for (const category of HOME_CATEGORIES) {
        const items = category.candidates
          .filter((item) => this.enabledKeys.has(item.capability))
          .map((item) => this.resolve(item));
        if (!items.length) continue;
        resolved.push({
          id: category.id,
          title: this.$t(category.titleKey),
          description: this.$t(category.descriptionKey),
          imageUrl: this.failedCategoryImages[category.id] ? '' : category.imageUrl,
          focalPoint: category.focalPoint,
          items
        });
      }
      return resolved;
    },
    resolvedShowcases(): ResolvedShowcase[] {
      const site = this.site;
      if (!site) return [];
      return this.rawShowcases
        .map((item) => resolveShowcase(item, site))
        .filter((item): item is ResolvedShowcase => Boolean(item))
        .map((item) => ({
          ...item,
          icon: this.failedIcons[item.capability] ? item.defaultIcon : item.icon
        }));
    },
    visibleShowcases(): ResolvedShowcase[] {
      return this.resolvedShowcases.slice(0, this.visibleShowcaseCount);
    },
    hasMoreShowcases(): boolean {
      return this.visibleShowcaseCount < this.resolvedShowcases.length;
    }
  },
  watch: {
    siteLoaded: {
      immediate: true,
      handler(loaded: boolean) {
        if (loaded && !this.showcaseLoaded) void this.loadShowcases();
        if (loaded) void this.loadBanners();
      }
    },
    '$i18n.locale'() {
      if (this.siteLoaded) {
        void this.loadShowcases();
        void this.loadBanners();
      }
    },
    hasMoreShowcases() {
      this.$nextTick(() => this.observeShowcaseLoadMore());
    }
  },
  mounted() {
    this.setupShowcaseLoadObserver();
  },
  beforeUnmount() {
    this.showcaseLoadObserver?.disconnect();
  },
  methods: {
    resolve(item: HomeCapability): ResolvedHomeCapability {
      const defaultIcon = CAPABILITY_ICONS[item.capability];
      const presentation = resolveCapabilityPresentation(this.site, item.capability, item.defaultName, defaultIcon);
      return {
        capability: item.capability,
        routeName: item.routeName,
        name: presentation.displayName,
        description: item.descriptionKey ? this.$t(item.descriptionKey) : '',
        icon: this.failedIcons[item.capability] ? defaultIcon : presentation.iconUrl,
        defaultIcon,
        imageUrl: item.imageUrl,
        focalPoint: item.focalPoint
      };
    },
    async loadBanners(): Promise<void> {
      const generation = ++this.bannerLoadGeneration;
      this.rawBanners = [];
      try {
        const origin = getSiteOrigin(this.site);
        const response = await siteBannerOperator.getPublic(origin);
        if (generation === this.bannerLoadGeneration) {
          this.rawBanners = Array.isArray(response.data) ? response.data : [];
        }
      } catch {
        if (generation === this.bannerLoadGeneration) this.rawBanners = [];
      }
    },
    async loadShowcases(): Promise<void> {
      const generation = ++this.showcaseLoadGeneration;
      const requestLocale = String(this.$i18n.locale || 'en');
      this.showcaseLoaded = true;
      this.visibleShowcaseCount = SHOWCASE_BATCH_SIZE;
      this.showcaseAutoLoadArmed = true;
      this.rawShowcases = [];
      this.selectedShowcase = undefined;
      try {
        const response = await showcaseOperator.list(undefined, requestLocale);
        if (generation === this.showcaseLoadGeneration && String(this.$i18n.locale || 'en') === requestLocale) {
          this.rawShowcases = Array.isArray(response.data) ? response.data : [];
        }
      } catch {
        if (generation === this.showcaseLoadGeneration) this.rawShowcases = [];
      }
    },
    loadMoreShowcases(): void {
      this.visibleShowcaseCount = Math.min(
        this.visibleShowcaseCount + SHOWCASE_BATCH_SIZE,
        this.resolvedShowcases.length
      );
    },
    onShowcaseLoadMoreClick(): void {
      this.showcaseAutoLoadArmed = false;
      this.loadMoreShowcases();
    },
    setupShowcaseLoadObserver(): void {
      if (!('IntersectionObserver' in window)) return;
      this.showcaseLoadObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              this.showcaseAutoLoadArmed = true;
              continue;
            }
            if (!this.showcaseAutoLoadArmed) continue;
            this.showcaseAutoLoadArmed = false;
            this.loadMoreShowcases();
          }
        },
        { root: this.$el as HTMLElement, rootMargin: '400px 0px' }
      );
      this.observeShowcaseLoadMore();
    },
    observeShowcaseLoadMore(): void {
      this.showcaseLoadObserver?.disconnect();
      const target = this.$refs.showcaseLoadMore;
      if (target instanceof HTMLElement) this.showcaseLoadObserver?.observe(target);
    },
    onIconError(item: ResolvedHomeCapability): void {
      if (item.icon !== item.defaultIcon) this.failedIcons[item.capability] = true;
    },
    onShowcaseIconError(item: ResolvedShowcase): void {
      if (item.icon !== item.defaultIcon) this.failedIcons[item.capability] = true;
    },
    onImageError(item: ResolvedHomeBanner): void {
      this.failedBannerImages[item.id] = true;
    },
    onCategoryImageError(id: string): void {
      this.failedCategoryImages[id] = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.studio-home {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  color: var(--el-text-color-primary);
  background: radial-gradient(circle at 82% 6%, rgba(var(--app-brand-rgb), 0.09), transparent 26%), #080c13;
  scrollbar-gutter: stable;
}

.dashboard {
  width: min(1580px, calc(100% - 36px));
  margin: 0 auto;
  padding: 18px 0 8px;
}

.home-loading {
  display: grid;
  height: 100%;
  place-items: center;
  background: #080c13;

  span {
    width: 38px;
    height: 38px;
    border: 3px solid rgba(255, 255, 255, 0.16);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: home-spin 0.9s linear infinite;
  }
}

@keyframes home-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 767px) {
  .dashboard {
    width: calc(100% - 24px);
    padding-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-loading span {
    animation-duration: 1.8s;
  }
}
</style>

<style lang="scss" scoped>
.showcase-load-more {
  display: block;
  min-height: 44px;
  margin: 4px auto 28px;
  padding: 0 24px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 750;
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}
</style>
