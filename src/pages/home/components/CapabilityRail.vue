<template>
  <section id="featured" class="home-section" aria-labelledby="featured-title">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.featured.eyebrow') }}</span>
        <h2 id="featured-title">{{ $t('intro.home.featured.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.featured.subtitle') }}</p>
    </div>
    <div class="capability-rail" :aria-label="$t('intro.home.featured.label')">
      <router-link v-for="item in items" :key="item.capability" :to="item.path" class="capability-card">
        <div class="capability-visual">
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            loading="lazy"
            decoding="async"
            :style="{ objectPosition: item.focalPoint || 'center' }"
          />
          <span v-else class="capability-placeholder">
            <img :src="item.icon" alt="" loading="lazy" decoding="async" @error="$emit('icon-error', item)" />
          </span>
          <span class="capability-gradient" />
          <span class="capability-name">
            <img :src="item.icon" alt="" loading="lazy" decoding="async" @error="$emit('icon-error', item)" />
            <strong>{{ item.name }}</strong>
          </span>
        </div>
        <span class="capability-copy">
          <span>{{ item.description }}</span>
          <strong>{{ $t('intro.home.createNow') }} →</strong>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IResolvedCapability } from '../data';

defineProps<{ items: IResolvedCapability[] }>();
defineEmits<{ 'icon-error': [item: IResolvedCapability] }>();
</script>

<style lang="scss" scoped>
.home-section {
  padding: 52px 0;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 36px;
  margin-bottom: 24px;

  span:first-child {
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h2 {
    margin: 8px 0 0;
    font-size: clamp(28px, 3vw, 38px);
    letter-spacing: -0.025em;
  }

  p {
    max-width: 480px;
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
  }
}

.capability-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(280px, 30%);
  gap: 16px;
  overflow-x: auto;
  padding: 5px 5px 18px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.capability-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--app-border-subtle);
  border-radius: 22px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--app-shadow-sm);
  scroll-snap-align: start;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--app-shadow-md);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 2px;
  }
}

.capability-visual {
  position: relative;
  height: 190px;
  overflow: hidden;
  background: var(--app-bg-surface);

  > img,
  .capability-gradient {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  > img {
    object-fit: cover;
  }
}

.capability-gradient {
  background: linear-gradient(180deg, transparent 38%, rgba(3, 7, 18, 0.78));
}

.capability-placeholder {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--el-color-primary) 28%, transparent), transparent 42%),
    var(--app-gradient-hero);

  img {
    width: 82px;
    height: 82px;
    border-radius: 24px;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
    object-fit: cover;
  }
}

.capability-name {
  position: absolute;
  z-index: 2;
  right: 18px;
  bottom: 16px;
  left: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;

  img {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
  }

  strong {
    overflow: hidden;
    font-size: 19px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.capability-copy {
  display: flex;
  min-height: 105px;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 18px 18px;

  span {
    display: -webkit-box;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.55;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  strong {
    color: var(--el-color-primary);
    font-size: 13px;
  }
}

@media (max-width: 900px) {
  .capability-rail {
    grid-auto-columns: minmax(270px, 44%);
  }
}

@media (max-width: 600px) {
  .home-section {
    padding: 38px 0;
  }

  .section-heading {
    display: block;

    p {
      margin-top: 10px;
      font-size: 14px;
    }
  }

  .capability-rail {
    grid-auto-columns: 78%;
    margin-right: -16px;
    padding-right: 16px;
  }

  .capability-visual {
    height: 172px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .capability-card {
    transition: none;
  }

  .capability-card:hover {
    transform: none;
  }
}
</style>
