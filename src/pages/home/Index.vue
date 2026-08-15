<template>
  <main v-if="siteLoaded" class="studio-home">
    <div class="dashboard">
      <home-carousel v-if="banners.length" :slides="banners" @image-error="onImageError" />
      <category-tiles
        v-if="categories.length"
        :items="categories"
        @image-error="onImageError"
        @icon-error="onIconError"
      />
      <popular-capability-grid
        v-if="popular.length"
        :items="popular"
        @image-error="onImageError"
        @icon-error="onIconError"
      />
    </div>
  </main>
  <div v-else class="home-loading" role="status" :aria-label="$t('common.status.loading')">
    <span />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import CategoryTiles from './components/CategoryTiles.vue';
import HomeCarousel from './components/HomeCarousel.vue';
import PopularCapabilityGrid from './components/PopularCapabilityGrid.vue';
import {
  HOME_BANNERS,
  HOME_CATEGORIES,
  HOME_POPULAR,
  type HomeCapability,
  type ResolvedHomeBanner,
  type ResolvedHomeCapability,
  type ResolvedHomeCategory
} from './data';

export default defineComponent({
  name: 'StudioHome',
  components: {
    CategoryTiles,
    HomeCarousel,
    PopularCapabilityGrid
  },
  data() {
    return {
      failedIcons: {} as Partial<Record<CapabilityKey, boolean>>,
      failedImages: {} as Partial<Record<CapabilityKey, boolean>>
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
      return HOME_BANNERS.filter((item) => this.enabledKeys.has(item.capability)).map((item) => ({
        ...this.resolve(item),
        id: item.id,
        eyebrow: this.$t(item.eyebrowKey),
        title: this.$t(item.titleKey)
      }));
    },
    categories(): ResolvedHomeCategory[] {
      return HOME_CATEGORIES.map((category) => {
        const destination = category.candidates.find((item) => this.enabledKeys.has(item.capability));
        if (!destination) return undefined;
        return {
          ...this.resolve({
            ...destination,
            descriptionKey: category.descriptionKey,
            imageUrl: category.imageUrl,
            focalPoint: category.focalPoint
          }),
          id: category.id,
          title: this.$t(category.titleKey)
        };
      }).filter((item): item is ResolvedHomeCategory => Boolean(item));
    },
    popular(): ResolvedHomeCapability[] {
      return HOME_POPULAR.filter((item) => this.enabledKeys.has(item.capability)).map(this.resolve);
    }
  },
  methods: {
    resolve(item: HomeCapability): ResolvedHomeCapability {
      const defaultIcon = CAPABILITY_ICONS[item.capability];
      const presentation = resolveCapabilityPresentation(this.site, item.capability, item.defaultName, defaultIcon);
      return {
        capability: item.capability,
        routeName: item.routeName,
        name: presentation.displayName,
        description: this.$t(item.descriptionKey),
        icon: this.failedIcons[item.capability] ? defaultIcon : presentation.iconUrl,
        defaultIcon,
        imageUrl: this.failedImages[item.capability] ? '' : item.imageUrl,
        focalPoint: item.focalPoint
      };
    },
    onIconError(item: ResolvedHomeCapability): void {
      if (item.icon !== item.defaultIcon) this.failedIcons[item.capability] = true;
    },
    onImageError(item: ResolvedHomeCapability): void {
      this.failedImages[item.capability] = true;
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
