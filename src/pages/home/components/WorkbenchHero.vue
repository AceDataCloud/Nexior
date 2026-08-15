<template>
  <section class="workbench-hero" aria-labelledby="home-title">
    <div class="hero-copy">
      <span class="hero-kicker">{{ $t('intro.home.kicker') }}</span>
      <h1 id="home-title">{{ title }}</h1>
      <p>{{ subtitle }}</p>
      <div class="hero-actions">
        <el-button type="primary" size="large" @click="$emit('start')">
          {{ $t('intro.home.start') }}
        </el-button>
        <el-button size="large" @click="$emit('explore')">
          {{ $t('intro.home.explore') }}
        </el-button>
      </div>
    </div>

    <div class="banner-rail" :aria-label="$t('intro.home.banner.label')">
      <router-link v-for="(banner, index) in banners" :key="banner.id" :to="banner.path" class="banner-card">
        <img
          :src="banner.image"
          :alt="banner.title"
          :loading="index === 0 ? 'eager' : 'lazy'"
          decoding="async"
          :fetchpriority="index === 0 ? 'high' : 'auto'"
          :style="{ objectPosition: banner.focalPoint || 'center' }"
        />
        <span class="banner-shade" />
        <span class="banner-copy">
          <span class="banner-eyebrow">{{ banner.eyebrow }}</span>
          <strong>{{ banner.title }}</strong>
          <span>{{ banner.description }}</span>
          <span class="banner-cta">{{ $t('intro.home.createNow') }} →</span>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus';
import type { IResolvedBanner } from '../data';

defineProps<{
  title: string;
  subtitle: string;
  banners: IResolvedBanner[];
}>();

defineEmits<{
  start: [];
  explore: [];
}>();
</script>

<style lang="scss" scoped>
.workbench-hero {
  display: grid;
  grid-template-columns: minmax(280px, 0.72fr) minmax(0, 1.28fr);
  align-items: center;
  gap: 48px;
  min-height: 520px;
  padding: 56px 0 48px;
}

.hero-copy {
  h1 {
    margin: 14px 0 18px;
    font-size: clamp(42px, 5vw, 68px);
    line-height: 1.02;
    letter-spacing: -0.045em;
  }

  p {
    max-width: 560px;
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 17px;
    line-height: 1.75;
  }
}

.hero-kicker {
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.banner-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 88%;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 6px 16px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.banner-card {
  position: relative;
  min-height: 410px;
  overflow: hidden;
  border: 1px solid var(--app-border-subtle);
  border-radius: 28px;
  color: #fff;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-lg);
  scroll-snap-align: center;
  isolation: isolate;

  img,
  .banner-shade {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  img {
    object-fit: cover;
    transition: transform 0.45s ease;
  }

  .banner-shade {
    z-index: 1;
    background: linear-gradient(180deg, rgba(3, 7, 18, 0.05) 20%, rgba(3, 7, 18, 0.88) 100%);
  }

  &:hover img {
    transform: scale(1.025);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}

.banner-copy {
  position: absolute;
  z-index: 2;
  inset: auto 30px 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.5);

  strong {
    max-width: 680px;
    font-size: clamp(28px, 3vw, 42px);
    line-height: 1.12;
  }

  > span:not(.banner-eyebrow, .banner-cta) {
    max-width: 620px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.55;
  }
}

.banner-eyebrow,
.banner-cta {
  font-size: 13px;
  font-weight: 750;
}

.banner-eyebrow {
  padding: 6px 9px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.26);
  backdrop-filter: blur(12px);
}

.banner-cta {
  margin-top: 6px;
}

@media (max-width: 980px) {
  .workbench-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: 30px;
    padding-top: 42px;
  }

  .hero-copy {
    max-width: 720px;
  }

  .banner-card {
    min-height: 380px;
  }
}

@media (max-width: 600px) {
  .workbench-hero {
    gap: 22px;
    padding: 30px 0 28px;
  }

  .hero-copy {
    h1 {
      margin-top: 10px;
      font-size: 38px;
    }

    p {
      font-size: 15px;
    }
  }

  .hero-actions {
    margin-top: 22px;
  }

  .banner-rail {
    grid-auto-columns: 94%;
    margin-right: -16px;
    padding-right: 16px;
  }

  .banner-card {
    min-height: 300px;
    border-radius: 22px;
  }

  .banner-copy {
    inset: auto 20px 20px;

    strong {
      font-size: 27px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .banner-rail {
    scroll-behavior: auto;
  }

  .banner-card img {
    transition: none;
  }

  .banner-card:hover img {
    transform: none;
  }
}
</style>
