<template>
  <section class="dashboard-section" aria-labelledby="home-categories-title" @keydown.esc="closePanel">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.quick.eyebrow') }}</span>
        <h2 id="home-categories-title">{{ $t('intro.home.quick.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.quick.subtitle') }}</p>
    </div>
    <div class="category-grid">
      <button
        v-for="item in items"
        :key="item.id"
        :ref="(element) => rememberButton(item.id, element)"
        type="button"
        class="category-card"
        :aria-expanded="openId === item.id"
        :aria-controls="`home-category-panel-${item.id}`"
        @click="toggle(item.id)"
      >
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.title"
          loading="lazy"
          decoding="async"
          :style="{ objectPosition: item.focalPoint || 'center' }"
          @error="$emit('category-image-error', item.id)"
        />
        <span class="shade" />
        <span class="category-copy">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
          <b>{{ $t(openId === item.id ? 'intro.home.quick.close' : 'intro.home.quick.explore') }} ↓</b>
        </span>
      </button>
    </div>

    <transition name="panel">
      <div
        v-if="activeCategory"
        :id="`home-category-panel-${activeCategory.id}`"
        class="capability-panel"
        role="region"
        :aria-label="$t('intro.home.quick.panelLabel', { category: activeCategory.title })"
      >
        <router-link
          v-for="item in activeCategory.items"
          :key="item.capability"
          :to="{ name: item.routeName }"
          class="capability-card"
        >
          <img :src="item.icon" alt="" @error="$emit('icon-error', item)" />
          <span>
            <strong>{{ item.name }}</strong>
            <small>{{ item.description }}</small>
          </span>
          <b>{{ $t('intro.home.createNow') }} <span aria-hidden="true">→</span></b>
        </router-link>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';
import type { ResolvedHomeCapability, ResolvedHomeCategory } from '../data';

const props = defineProps<{ items: ResolvedHomeCategory[] }>();
defineEmits<{
  'category-image-error': [id: string];
  'icon-error': [item: ResolvedHomeCapability];
}>();

const openId = ref<string>();
const buttons = new Map<string, HTMLButtonElement>();
const activeCategory = computed(() => props.items.find((item) => item.id === openId.value));

function rememberButton(id: string, element: Element | ComponentPublicInstance | null): void {
  if (element instanceof HTMLButtonElement) buttons.set(id, element);
  else buttons.delete(id);
}

function toggle(id: string): void {
  openId.value = openId.value === id ? undefined : id;
}

function closePanel(): void {
  if (!openId.value) return;
  const button = buttons.get(openId.value);
  openId.value = undefined;
  button?.focus();
}

defineExpose({ openId, activeCategory, toggle, closePanel });
</script>

<style lang="scss" scoped>
.dashboard-section {
  padding-top: 34px;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 16px;

  > div > span {
    color: var(--el-color-primary);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 5px 0 0;
    font-size: 25px;
    letter-spacing: -0.02em;
  }

  p {
    max-width: 470px;
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.55;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.category-card {
  position: relative;
  min-width: 0;
  min-height: 205px;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 15px;
  color: #fff;
  background: #0d131d;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  > img,
  .shade {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  > img {
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .shade {
    background: linear-gradient(180deg, rgba(4, 8, 15, 0.02) 15%, rgba(4, 8, 15, 0.92) 100%);
  }

  &:hover,
  &[aria-expanded='true'] {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--el-color-primary) 44%, transparent);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);

    > img {
      transform: scale(1.035);
    }
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.category-copy {
  position: absolute;
  z-index: 1;
  right: 18px;
  bottom: 17px;
  left: 18px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.72);

  strong {
    font-size: 22px;
    line-height: 1.15;
  }

  > span {
    display: -webkit-box;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  b {
    margin-top: 4px;
    font-size: 12px;
  }
}

.capability-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 11px;
  margin-top: 13px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(13, 19, 29, 0.9);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.23);
  backdrop-filter: blur(18px);
}

.capability-card {
  display: grid;
  min-width: 0;
  grid-template-columns: 44px minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  padding: 13px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 13px;
  color: #fff;
  background: rgba(255, 255, 255, 0.035);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;

  > img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.92);
    object-fit: cover;
  }

  > span {
    min-width: 0;
  }

  strong,
  small {
    display: block;
  }

  strong {
    font-size: 14px;
  }

  small {
    display: -webkit-box;
    overflow: hidden;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  > b {
    grid-column: 2;
    color: color-mix(in srgb, var(--el-color-primary) 65%, #fff);
    font-size: 11px;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(var(--app-brand-rgb), 0.35);
    background: rgba(var(--app-brand-rgb), 0.08);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.panel-enter-active,
.panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1120px) {
  .category-grid,
  .capability-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .dashboard-section {
    padding-top: 25px;
  }

  .section-heading {
    display: block;

    p {
      margin-top: 7px;
    }
  }

  .category-grid,
  .capability-panel {
    gap: 10px;
  }

  .category-card {
    min-height: 195px;
    border-radius: 13px;
  }

  .category-copy {
    right: 13px;
    bottom: 13px;
    left: 13px;

    strong {
      font-size: 17px;
    }
  }

  .capability-panel {
    padding: 10px;
  }
}

@media (max-width: 430px) {
  .category-grid,
  .capability-panel {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-card,
  .category-card > img,
  .capability-card,
  .panel-enter-active,
  .panel-leave-active {
    transition: none;
  }

  .category-card:hover,
  .category-card:hover > img,
  .capability-card:hover {
    transform: none;
  }
}
</style>
