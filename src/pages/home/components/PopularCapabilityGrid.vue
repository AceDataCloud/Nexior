<template>
  <section class="dashboard-section popular-section" aria-labelledby="home-popular-title">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.popular.eyebrow') }}</span>
        <h2 id="home-popular-title">{{ $t('intro.home.popular.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.popular.subtitle') }}</p>
    </div>
    <div class="popular-grid">
      <router-link v-for="item in items" :key="item.capability" :to="{ name: item.routeName }" class="popular-card">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name"
          loading="lazy"
          decoding="async"
          :style="{ objectPosition: item.focalPoint || 'center' }"
          @error="$emit('image-error', item)"
        />
        <span v-else class="image-fallback"><img :src="item.icon" alt="" /></span>
        <span class="shade" />
        <span class="popular-copy">
          <span class="capability">
            <img :src="item.icon" alt="" @error="$emit('icon-error', item)" />
            {{ item.name }}
          </span>
          <span>{{ item.description }}</span>
          <b>{{ $t('intro.home.createNow') }} →</b>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ResolvedHomeCapability } from '../data';

defineProps<{ items: ResolvedHomeCapability[] }>();
defineEmits<{
  'image-error': [item: ResolvedHomeCapability];
  'icon-error': [item: ResolvedHomeCapability];
}>();
</script>

<style lang="scss" scoped>
.dashboard-section {
  padding-top: 34px;
}

.popular-section {
  padding-bottom: 34px;
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

.popular-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.popular-card {
  position: relative;
  min-width: 0;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 15px;
  color: #fff;
  background: #0d131d;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
      width: 74px;
      height: 74px;
      border-radius: 20px;
      object-fit: cover;
    }
  }

  .shade {
    background: linear-gradient(180deg, rgba(4, 8, 15, 0.02) 32%, rgba(4, 8, 15, 0.94) 100%);
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

.popular-copy {
  position: absolute;
  z-index: 1;
  right: 16px;
  bottom: 15px;
  left: 16px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.75);

  > span:not(.capability) {
    display: -webkit-box;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  b {
    margin-top: 2px;
    font-size: 12px;
  }
}

.capability {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 800;

  img {
    width: 27px;
    height: 27px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    object-fit: cover;
  }
}

@media (max-width: 1120px) {
  .popular-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .popular-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .dashboard-section {
    padding-top: 25px;
  }

  .popular-section {
    padding-bottom: 24px;
  }

  .section-heading {
    display: block;

    p {
      margin-top: 7px;
    }
  }

  .popular-grid {
    gap: 10px;
  }

  .popular-card {
    border-radius: 13px;
  }

  .popular-copy {
    right: 12px;
    bottom: 11px;
    left: 12px;

    > span:not(.capability) {
      display: none;
    }
  }

  .capability {
    font-size: 13px;

    img {
      width: 24px;
      height: 24px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .popular-card,
  .popular-card > img {
    transition: none;
  }

  .popular-card:hover,
  .popular-card:hover > img {
    transform: none;
  }
}
</style>
