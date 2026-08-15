<template>
  <main v-if="siteLoaded" class="creative-home">
    <div class="home-glow home-glow--one" />
    <div class="home-glow home-glow--two" />
    <div class="home-container">
      <workbench-hero
        :title="heroTitle"
        :subtitle="heroSubtitle"
        :banners="banners"
        @start="onStart"
        @explore="scrollToFeatured"
      />
      <quick-create-intents v-if="quickCreates.length" :items="quickCreates" />
      <capability-rail
        v-if="featuredCapabilities.length"
        :items="featuredCapabilities"
        @icon-error="onCapabilityIconError"
      />
      <inspiration-gallery
        v-if="inspirationItems.length"
        :items="inspirationItems"
        @icon-error="onCapabilityIconError"
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
import { getDefaultRoute } from '@/router';
import { resolveCapabilityPresentation } from '@/utils/capabilityPresentation';
import CapabilityRail from './components/CapabilityRail.vue';
import InspirationGallery from './components/InspirationGallery.vue';
import QuickCreateIntents from './components/QuickCreateIntents.vue';
import WorkbenchHero from './components/WorkbenchHero.vue';
import {
  FEATURED_CAPABILITIES,
  HOME_BANNERS,
  INSPIRATION_ITEMS,
  QUICK_CREATE,
  type IHomeDestination,
  type ILocalizedImage,
  type IResolvedCapability,
  type IResolvedInspiration,
  type IResolvedQuickCreate
} from './data';

export default defineComponent({
  name: 'CreativeHome',
  components: {
    CapabilityRail,
    InspirationGallery,
    QuickCreateIntents,
    WorkbenchHero
  },
  data() {
    return {
      failedCapabilityIcons: {} as Partial<Record<CapabilityKey, boolean>>
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    siteLoaded(): boolean {
      return Boolean(this.site?.id);
    },
    isChineseLocale(): boolean {
      return String(this.$i18n.locale).toLowerCase().startsWith('zh');
    },
    enabledKeys(): Set<CapabilityKey> {
      if (!this.siteLoaded) return new Set();
      const features = (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
      return new Set(CAPABILITY_KEYS.filter((key) => features[key]?.enabled));
    },
    usesDefaultHero(): boolean {
      const configuredOrigin = String(this.site?.origin ?? '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .split('/')[0];
      const hostname = typeof window === 'undefined' ? '' : window.location.hostname.toLowerCase();
      return ['studio.acedata.cloud', 'hub.acedata.cloud', '127.0.0.1', 'localhost'].includes(
        configuredOrigin || hostname
      );
    },
    heroTitle(): string {
      return (!this.usesDefaultHero && this.site?.title?.trim()) || this.$t('intro.home.title');
    },
    heroSubtitle(): string {
      return (!this.usesDefaultHero && this.site?.description?.trim()) || this.$t('intro.home.subtitle');
    },
    banners() {
      return HOME_BANNERS.filter((item) => this.enabledKeys.has(item.capability)).map((item) => ({
        id: item.id,
        path: item.path,
        eyebrow: this.$t(item.eyebrowKey),
        title: this.$t(item.titleKey),
        description: this.$t(item.descriptionKey),
        image: this.pickImage(item.image),
        focalPoint: item.focalPoint
      }));
    },
    quickCreates(): IResolvedQuickCreate[] {
      return QUICK_CREATE.map((item): IResolvedQuickCreate | undefined => {
        const destination = item.destinations.find((candidate) => this.enabledKeys.has(candidate.capability));
        if (!destination) return undefined;
        return {
          id: item.id,
          path: destination.path,
          title: this.$t(item.titleKey),
          description: this.$t(item.descriptionKey),
          icon: this.presentation(destination).icon
        };
      }).filter((item): item is IResolvedQuickCreate => Boolean(item));
    },
    featuredCapabilities(): IResolvedCapability[] {
      return FEATURED_CAPABILITIES.filter((item) => this.enabledKeys.has(item.capability)).map((item) => {
        const presentation = this.presentation(item);
        return {
          capability: item.capability,
          path: item.path,
          name: presentation.name,
          description: this.$t(item.descriptionKey),
          icon: presentation.icon,
          defaultIcon: CAPABILITY_ICONS[item.capability],
          image: item.image ? this.pickImage(item.image) : undefined,
          focalPoint: item.focalPoint
        };
      });
    },
    inspirationItems(): IResolvedInspiration[] {
      return INSPIRATION_ITEMS.filter((item) => this.enabledKeys.has(item.capability)).map((item) => {
        const presentation = this.presentation(item);
        return {
          id: item.id,
          capability: item.capability,
          path: item.path,
          name: presentation.name,
          description: this.$t(item.descriptionKey),
          icon: presentation.icon,
          defaultIcon: CAPABILITY_ICONS[item.capability],
          image: this.pickImage(item.image),
          title: this.$t(item.titleKey),
          aspect: item.aspect,
          focalPoint: item.focalPoint
        };
      });
    }
  },
  methods: {
    pickImage(source: ILocalizedImage): string {
      return this.isChineseLocale ? source.zh : source.en;
    },
    presentation(destination: IHomeDestination): { name: string; icon: string } {
      const defaultIcon = CAPABILITY_ICONS[destination.capability];
      const resolved = resolveCapabilityPresentation(
        this.site,
        destination.capability,
        destination.defaultName,
        defaultIcon
      );
      return {
        name: resolved.displayName,
        icon: this.failedCapabilityIcons[destination.capability] ? defaultIcon : resolved.iconUrl
      };
    },
    onCapabilityIconError(item: IResolvedCapability): void {
      if (item.icon !== item.defaultIcon) {
        this.failedCapabilityIcons[item.capability] = true;
      }
    },
    onStart(): void {
      this.$router.push(getDefaultRoute());
    },
    scrollToFeatured(): void {
      document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});
</script>

<style lang="scss" scoped>
.creative-home {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 64px);
  color: var(--el-text-color-primary);
  background:
    radial-gradient(circle at 84% 4%, color-mix(in srgb, var(--el-color-primary) 12%, transparent), transparent 28%),
    var(--el-bg-color);
}

.home-container {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
}

.home-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  opacity: 0.16;
  filter: blur(100px);
  pointer-events: none;

  &--one {
    top: 320px;
    left: -220px;
    background: var(--el-color-primary);
  }

  &--two {
    top: 980px;
    right: -240px;
    background: #7c3aed;
  }
}

.home-loading {
  display: grid;
  min-height: calc(100vh - 64px);
  place-items: center;
  background: var(--app-gradient-hero);

  span {
    width: 42px;
    height: 42px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: home-spin 0.9s linear infinite;
  }
}

@keyframes home-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .home-container {
    width: calc(100% - 32px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-loading span {
    animation-duration: 1.8s;
  }
}
</style>
