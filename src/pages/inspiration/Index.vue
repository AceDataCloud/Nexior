<template>
  <main v-if="siteLoaded" class="inspiration-page">
    <div class="inspiration-shell">
      <public-section-nav />
      <header class="hero">
        <span>{{ $t('intro.inspiration.eyebrow') }}</span>
        <h1>{{ $t('intro.inspiration.title') }}</h1>
        <p>{{ $t('intro.inspiration.subtitle') }}</p>
      </header>

      <nav class="category-tabs" :aria-label="$t('intro.inspiration.categories')">
        <router-link v-for="category in categories" :key="category.route" :to="{ name: category.route }">
          {{ $t(category.label) }}
        </router-link>
      </nav>

      <div v-if="availableServices.length" class="service-filters" :aria-label="$t('intro.inspiration.models')">
        <button type="button" :class="{ active: !selectedService }" @click="setService()">
          {{ $t('intro.inspiration.allModels') }}
        </button>
        <button
          v-for="definition in availableServices"
          :key="definition.service"
          type="button"
          :class="{ active: selectedService === definition.service }"
          @click="setService(definition.service)"
        >
          {{ definition.defaultName }}
        </button>
      </div>

      <div v-if="loading" class="page-state" role="status">{{ $t('intro.inspiration.loading') }}</div>
      <div v-else-if="error" class="page-state error" role="alert">
        <span>{{ $t('intro.inspiration.loadFailed') }}</span>
        <button type="button" @click="load">{{ $t('intro.inspiration.retry') }}</button>
      </div>
      <div v-else-if="!filteredItems.length" class="page-state">{{ $t('intro.inspiration.empty') }}</div>
      <inspiration-masonry v-else :items="filteredItems" @select="openItem" />
    </div>
    <inspiration-detail-dialog :item="selectedItem" @close="closeItem" />
  </main>
  <div v-else class="page-state full" role="status">{{ $t('common.status.loading') }}</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import type { IShowcase, ResolvedShowcase } from '@/models';
import { showcaseOperator } from '@/operators';
import {
  ROUTE_INSPIRATION_ALL,
  ROUTE_INSPIRATION_IMAGES,
  ROUTE_INSPIRATION_MUSIC,
  ROUTE_INSPIRATION_VIDEOS
} from '@/router/constants';
import { resolveShowcase, SHOWCASE_SERVICES } from '@/utils/showcase';
import PublicSectionNav from '@/components/common/PublicSectionNav.vue';
import InspirationMasonry from './components/InspirationMasonry.vue';
import InspirationDetailDialog from './components/InspirationDetailDialog.vue';

const store = useStore();
const route = useRoute();
const router = useRouter();
const { locale } = useI18n();
const rawItems = ref<IShowcase[]>([]);
const loading = ref(false);
const error = ref(false);

const site = computed(() => store.state.site);
const siteLoaded = computed(() => Boolean(site.value?.id));
const categories = [
  { route: ROUTE_INSPIRATION_ALL, label: 'intro.inspiration.all' },
  { route: ROUTE_INSPIRATION_IMAGES, label: 'intro.inspiration.images' },
  { route: ROUTE_INSPIRATION_VIDEOS, label: 'intro.inspiration.videos' },
  { route: ROUTE_INSPIRATION_MUSIC, label: 'intro.inspiration.music' }
];
const resolvedItems = computed(() => {
  if (!site.value) return [];
  return rawItems.value
    .map((item) => resolveShowcase(item, site.value, locale.value))
    .filter((item): item is ResolvedShowcase => Boolean(item));
});
const categoryType = computed(() => {
  if (route.name === ROUTE_INSPIRATION_IMAGES) return 'Image';
  if (route.name === ROUTE_INSPIRATION_VIDEOS) return 'Video';
  if (route.name === ROUTE_INSPIRATION_MUSIC) return 'Audio';
  return undefined;
});
const selectedService = computed(() => (typeof route.query.service === 'string' ? route.query.service : undefined));
const availableServices = computed(() => {
  const present = new Set(
    resolvedItems.value
      .filter((item) => !categoryType.value || item.mediaType === categoryType.value)
      .map((item) => item.service)
  );
  return [...SHOWCASE_SERVICES.values()].filter((definition) => present.has(definition.service));
});
const filteredItems = computed(() =>
  resolvedItems.value.filter(
    (item) =>
      (!categoryType.value || item.mediaType === categoryType.value) &&
      (!selectedService.value || item.service === selectedService.value)
  )
);
const selectedItem = computed(() => {
  const id = typeof route.query.showcase === 'string' ? route.query.showcase : undefined;
  return id ? resolvedItems.value.find((item) => item.id === id) : undefined;
});

async function load(): Promise<void> {
  loading.value = true;
  error.value = false;
  try {
    showcaseOperator.clearCache();
    rawItems.value = (await showcaseOperator.list()).data;
  } catch {
    error.value = true;
    rawItems.value = [];
  } finally {
    loading.value = false;
  }
}

function setService(service?: string): void {
  const query = { ...route.query };
  delete query.showcase;
  if (service) query.service = service;
  else delete query.service;
  void router.push({ name: route.name as string, query });
}

function openItem(item: ResolvedShowcase): void {
  void router.push({ name: route.name as string, query: { ...route.query, showcase: item.id } });
}

function closeItem(): void {
  const query = { ...route.query };
  delete query.showcase;
  void router.push({ name: route.name as string, query });
}

watch([categoryType, availableServices], () => {
  if (selectedService.value && !availableServices.value.some((item) => item.service === selectedService.value)) {
    setService();
  }
});
watch([selectedItem, resolvedItems], () => {
  if (route.query.showcase && !loading.value && !selectedItem.value) closeItem();
});
onMounted(() => void load());
</script>

<style lang="scss" scoped>
.inspiration-page,
.page-state.full {
  height: 100%;
  overflow-y: auto;
  color: var(--el-text-color-primary);
  background: var(--app-content-bg);
}

.inspiration-shell {
  width: min(1600px, calc(100% - 36px));
  margin: 0 auto;
  padding: 14px 0 42px;
}

.hero {
  padding: 42px 0 28px;

  > span {
    color: var(--el-color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0;
    font-size: clamp(32px, 5vw, 58px);
    letter-spacing: -0.04em;
  }

  p {
    max-width: 640px;
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
  }
}

.category-tabs {
  display: flex;
  gap: 26px;
  overflow-x: auto;
  border-bottom: 1px solid var(--app-border-subtle);

  a {
    position: relative;
    flex: none;
    padding: 12px 2px 15px;
    color: var(--el-text-color-secondary);
    font-weight: 750;

    &.router-link-exact-active {
      color: var(--el-text-color-primary);

      &::after {
        position: absolute;
        right: 0;
        bottom: -1px;
        left: 0;
        height: 2px;
        background: var(--el-color-primary);
        content: '';
      }
    }
  }
}

.service-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 18px 0 22px;

  button {
    min-height: 34px;
    flex: none;
    padding: 0 14px;
    border: 1px solid var(--app-border-subtle);
    border-radius: 999px;
    color: var(--el-text-color-secondary);
    background: var(--app-surface-elevated);
    cursor: pointer;

    &.active {
      color: #fff;
      border-color: var(--el-color-primary);
      background: var(--el-color-primary);
    }
  }
}

.page-state {
  display: grid;
  min-height: 300px;
  place-items: center;
  color: var(--el-text-color-secondary);

  &.error {
    align-content: center;
    gap: 12px;

    button {
      border: 0;
      color: var(--el-color-primary);
      background: transparent;
      cursor: pointer;
    }
  }

  &.full {
    place-items: center;
  }
}

@media (max-width: 767px) {
  .inspiration-shell {
    width: calc(100% - 24px);
  }

  .hero {
    padding-top: 28px;
  }
}
</style>
