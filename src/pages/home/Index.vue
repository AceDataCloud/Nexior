<template>
  <main v-if="siteLoaded" ref="homeScroll" class="studio-home" tabindex="-1" @scroll.passive="onHomeScroll">
    <div class="dashboard">
      <home-carousel v-if="bannerEnabled && banners.length" :slides="banners" @image-error="onImageError" />
      <category-tiles
        v-if="categoriesEnabled && categories.length"
        :items="categories"
        :heading="$t('intro.home.quick.title')"
        :subtitle="$t('intro.home.quick.subtitle')"
        @category-image-error="onCategoryImageError"
        @icon-error="onIconError"
      />
      <home-custom-sections
        v-if="rawHomeSections.length"
        :sections="rawHomeSections"
        :site="site"
        :locale="String($i18n.locale || 'en')"
      />
      <showcase-grid
        v-if="showcaseEnabled && visibleShowcases.length"
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
        v-if="showcaseEnabled && hasMoreShowcases"
        ref="showcaseLoadMore"
        type="button"
        class="showcase-load-more"
        @click="onShowcaseLoadMoreClick"
      >
        {{ $t('intro.home.showcase.loadMore') }}
      </button>
    </div>
    <Transition name="back-to-top">
      <button
        v-if="showBackToTop"
        type="button"
        class="home-back-to-top"
        :aria-label="$t('intro.home.backToTop')"
        :title="$t('intro.home.backToTop')"
        @click="scrollToTop"
      >
        <ArrowUpToLine :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </Transition>
    <showcase-detail-dialog :item="selectedShowcase" @close="selectedShowcase = undefined" />
  </main>
  <div v-else class="home-loading" role="status" :aria-label="$t('common.status.loading')">
    <span />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ArrowUpToLine } from '@lucide/vue';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import type { ISiteBanner, ISiteHomeSection, IShowcase, ResolvedShowcase } from '@/models';
import { showcaseOperator, siteBannerOperator, siteHomeSectionOperator } from '@/operators';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import { resolveShowcase } from '@/utils/showcase';
import { getSiteOrigin } from '@/utils/site';
import { isCapabilityAvailableOnBuild, isWeb } from '@/utils/surface';
import { resolveSiteBannerText } from '@/utils/siteBanner';
import { getHiddenCategoryIds, getHiddenDefaultBannerIds, isHomeSectionEnabled } from '@/utils/siteHome';
import ShowcaseGrid from '@/components/common/ShowcaseGrid.vue';
import ShowcaseDetailDialog from '@/components/showcase/ShowcaseDetailDialog.vue';
import CategoryTiles from './components/CategoryTiles.vue';
import HomeCarousel from './components/HomeCarousel.vue';
import HomeCustomSections from './components/HomeCustomSections.vue';
import {
  HOME_BANNERS,
  HOME_CATEGORIES,
  HOME_CAPABILITY_DEFINITIONS,
  type HomeCapability,
  type ResolvedHomeBanner,
  type ResolvedHomeCapability,
  type ResolvedHomeCategory
} from './data';

const SHOWCASE_BATCH_SIZE = 12;

export default defineComponent({
  name: 'StudioHome',
  components: {
    ArrowUpToLine,
    CategoryTiles,
    ShowcaseGrid,
    ShowcaseDetailDialog,
    HomeCarousel,
    HomeCustomSections
  },
  data() {
    return {
      showBackToTop: false,
      failedIcons: {} as Partial<Record<CapabilityKey, boolean>>,
      failedBannerImages: {} as Record<string, boolean>,
      failedCategoryImages: {} as Record<string, boolean>,
      rawBanners: [] as ISiteBanner[],
      bannerLoadGeneration: 0,
      rawShowcases: [] as IShowcase[],
      rawHomeSections: [] as ISiteHomeSection[],
      homeSectionLoadGeneration: 0,
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
    bannerEnabled(): boolean {
      return isHomeSectionEnabled(this.site, 'banner');
    },
    categoriesEnabled(): boolean {
      return isHomeSectionEnabled(this.site, 'categories');
    },
    showcaseEnabled(): boolean {
      return isHomeSectionEnabled(this.site, 'showcase');
    },
    bannerRequestKey(): string {
      if (!this.siteLoaded || !this.bannerEnabled) return '';
      return `${this.site?.id || ''}|${getSiteOrigin(this.site)}|${String(this.$i18n.locale || 'en')}`;
    },
    showcaseRequestKey(): string {
      if (!this.siteLoaded || !this.showcaseEnabled) return '';
      return `${this.site?.id || ''}|${String(this.$i18n.locale || 'en')}`;
    },
    homeSectionRequestKey(): string {
      if (!this.siteLoaded || !isWeb()) return '';
      return `${this.site?.id || ''}|${getSiteOrigin(this.site)}|${String(this.$i18n.locale || 'en')}`;
    },
    enabledKeys(): Set<CapabilityKey> {
      if (!this.siteLoaded) return new Set();
      const features = (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
      return new Set(CAPABILITY_KEYS.filter((key) => features[key]?.enabled && isCapabilityAvailableOnBuild(key)));
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
      const hiddenCategories = getHiddenCategoryIds(this.site);
      const configured = this.site?.home?.scenes;
      if (configured != null) {
        for (const scene of configured) {
          if (scene.visible === false) continue;
          const items = scene.tools.flatMap((tool) => {
            const definition = HOME_CAPABILITY_DEFINITIONS.get(tool.capability);
            if (!definition || !this.enabledKeys.has(tool.capability)) return [];
            return [this.resolve(definition)];
          });
          if (!items.length) continue;
          resolved.push({
            id: scene.id,
            title: scene.title,
            description: scene.description,
            imageUrl: this.failedCategoryImages[scene.id] ? '' : scene.image_url || '',
            items
          });
        }
        return resolved;
      }
      for (const category of HOME_CATEGORIES) {
        if (hiddenCategories.has(category.id as any)) continue;
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
    bannerRequestKey: {
      immediate: true,
      handler(key: string) {
        if (key) void this.loadBanners();
        else {
          this.bannerLoadGeneration += 1;
          this.rawBanners = [];
          this.failedBannerImages = {};
        }
      }
    },
    homeSectionRequestKey: {
      immediate: true,
      handler(key: string) {
        if (key) void this.loadHomeSections();
        else {
          this.homeSectionLoadGeneration += 1;
          this.rawHomeSections = [];
        }
      }
    },
    showcaseRequestKey: {
      immediate: true,
      handler(key: string) {
        if (key) void this.loadShowcases();
        else {
          this.showcaseLoadGeneration += 1;
          this.rawShowcases = [];
          this.visibleShowcaseCount = SHOWCASE_BATCH_SIZE;
          this.selectedShowcase = undefined;
        }
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
    this.bannerLoadGeneration += 1;
    this.homeSectionLoadGeneration += 1;
    this.showcaseLoadGeneration += 1;
    this.showcaseLoadObserver?.disconnect();
  },
  methods: {
    onHomeScroll(event: Event): void {
      this.showBackToTop = (event.currentTarget as HTMLElement).scrollTop > 300;
    },
    scrollToTop(): void {
      const container = this.$refs.homeScroll as HTMLElement;
      container.focus({ preventScroll: true });
      container.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    },
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
      if (!this.bannerRequestKey) return;
      const requestKey = this.bannerRequestKey;
      const generation = ++this.bannerLoadGeneration;
      this.rawBanners = [];
      try {
        const response = await siteBannerOperator.getPublic(getSiteOrigin(this.site));
        if (generation === this.bannerLoadGeneration && requestKey === this.bannerRequestKey) {
          this.rawBanners = Array.isArray(response.data) ? response.data : [];
        }
      } catch {
        if (generation === this.bannerLoadGeneration && requestKey === this.bannerRequestKey) this.rawBanners = [];
      }
    },
    async loadHomeSections(): Promise<void> {
      if (!this.homeSectionRequestKey) return;
      const requestKey = this.homeSectionRequestKey;
      const generation = ++this.homeSectionLoadGeneration;
      this.rawHomeSections = [];
      try {
        const response = await siteHomeSectionOperator.getPublic(
          getSiteOrigin(this.site),
          String(this.$i18n.locale || 'en')
        );
        if (generation === this.homeSectionLoadGeneration && requestKey === this.homeSectionRequestKey) {
          this.rawHomeSections = Array.isArray(response.data) ? response.data : [];
        }
      } catch {
        if (generation === this.homeSectionLoadGeneration && requestKey === this.homeSectionRequestKey) {
          this.rawHomeSections = [];
        }
      }
    },
    async loadShowcases(): Promise<void> {
      if (!this.showcaseRequestKey) return;
      const requestKey = this.showcaseRequestKey;
      const generation = ++this.showcaseLoadGeneration;
      const requestLocale = String(this.$i18n.locale || 'en');
      this.visibleShowcaseCount = SHOWCASE_BATCH_SIZE;
      this.showcaseAutoLoadArmed = true;
      this.rawShowcases = [];
      this.selectedShowcase = undefined;
      try {
        const response = await showcaseOperator.list(undefined, requestLocale);
        if (generation === this.showcaseLoadGeneration && requestKey === this.showcaseRequestKey) {
          this.rawShowcases = Array.isArray(response.data) ? response.data : [];
        }
      } catch {
        if (generation === this.showcaseLoadGeneration && requestKey === this.showcaseRequestKey)
          this.rawShowcases = [];
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

.home-back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 50%;
  color: #e2e8f0;
  background: rgba(22, 27, 38, 0.88);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    bottom 180ms ease;

  @media (hover: hover) {
    &:hover {
      border-color: rgba(var(--app-brand-rgb), 0.6);
      background: rgba(38, 44, 58, 0.96);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 3px;
  }

  &:active {
    background: rgba(38, 44, 58, 0.96);
  }
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(6px);
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
  .home-back-to-top {
    right: 16px;
    bottom: calc(var(--app-dock-height) + var(--app-safe-area-bottom) + 16px);
  }

  .dashboard {
    width: calc(100% - 24px);
    padding-top: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-back-to-top,
  .back-to-top-enter-active,
  .back-to-top-leave-active {
    transition: none;
  }

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
