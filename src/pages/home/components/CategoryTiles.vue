<template>
  <section class="dashboard-section" aria-labelledby="home-categories-title">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.quick.eyebrow') }}</span>
        <h2 id="home-categories-title">{{ $t('intro.home.quick.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.quick.subtitle') }}</p>
    </div>
    <div class="category-grid">
      <router-link v-for="item in items" :key="item.id" :to="{ name: item.routeName }" class="category-card">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.title"
          loading="lazy"
          decoding="async"
          :style="{ objectPosition: item.focalPoint || 'center' }"
          @error="$emit('image-error', item)"
        />
        <span v-else class="image-fallback"><img :src="item.icon" alt="" /></span>
        <span class="shade" />
        <span class="category-copy">
          <span class="capability">
            <img :src="item.icon" alt="" @error="$emit('icon-error', item)" />
            {{ item.name }}
          </span>
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
          <b>{{ $t('intro.home.createNow') }} →</b>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ResolvedHomeCategory } from '../data';

defineProps<{ items: ResolvedHomeCategory[] }>();
defineEmits<{
  'image-error': [item: ResolvedHomeCategory];
  'icon-error': [item: ResolvedHomeCategory];
}>();
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 15px;
  color: #fff;
  background: #0d131d;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.22);
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  > img,
  .image-fallback,
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

  .image-fallback {
    display: grid;
    place-items: center;
    background: radial-gradient(circle, rgba(var(--app-brand-rgb), 0.2), transparent 45%), #0d131d;

    img {
      width: 66px;
      height: 66px;
      border-radius: 18px;
      object-fit: cover;
    }
  }

  .shade {
    background: linear-gradient(180deg, rgba(4, 8, 15, 0.02) 15%, rgba(4, 8, 15, 0.92) 100%);
  }

  &:hover {
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

  > strong {
    font-size: 22px;
    line-height: 1.15;
  }

  > span:not(.capability) {
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

.capability {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 750;

  img {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.9);
    object-fit: cover;
  }
}

@media (max-width: 1120px) {
  .category-grid {
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

  .category-grid {
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

    > strong {
      font-size: 17px;
    }
  }
}

@media (max-width: 380px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .category-card,
  .category-card > img {
    transition: none;
  }

  .category-card:hover,
  .category-card:hover > img {
    transform: none;
  }
}
</style>
