<template>
  <section class="home-section inspiration" aria-labelledby="inspiration-title">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.inspiration.eyebrow') }}</span>
        <h2 id="inspiration-title">{{ $t('intro.home.inspiration.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.inspiration.subtitle') }}</p>
    </div>
    <div class="inspiration-grid">
      <router-link
        v-for="item in items"
        :key="item.id"
        :to="item.path"
        class="inspiration-card"
        :class="`is-${item.aspect}`"
      >
        <img
          :src="item.image"
          :alt="item.title"
          loading="lazy"
          decoding="async"
          :style="{ objectPosition: item.focalPoint || 'center' }"
        />
        <span class="inspiration-shade" />
        <span class="inspiration-copy">
          <span class="inspiration-product">
            <img :src="item.icon" alt="" loading="lazy" decoding="async" @error="$emit('icon-error', item)" />
            {{ item.name }}
          </span>
          <strong>{{ item.title }}</strong>
          <span>{{ $t('intro.home.inspiration.try') }} →</span>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IResolvedInspiration } from '../data';

defineProps<{ items: IResolvedInspiration[] }>();
defineEmits<{ 'icon-error': [item: IResolvedInspiration] }>();
</script>

<style lang="scss" scoped>
.home-section {
  padding: 52px 0 84px;
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

.inspiration-grid {
  display: grid;
  grid-auto-flow: dense;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 170px;
  gap: 14px;
}

.inspiration-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 22px;
  color: #fff;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-sm);
  isolation: isolate;

  &.is-square,
  &.is-landscape {
    grid-column: span 2;
  }

  &.is-wide {
    grid-column: span 2;
    grid-row: span 2;
  }

  &.is-portrait {
    grid-row: span 2;
  }

  > img,
  .inspiration-shade {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  > img {
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &:hover > img {
    transform: scale(1.035);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}

.inspiration-shade {
  z-index: 1;
  background: linear-gradient(180deg, rgba(2, 6, 15, 0.02) 30%, rgba(2, 6, 15, 0.88));
}

.inspiration-copy {
  position: absolute;
  z-index: 2;
  right: 18px;
  bottom: 17px;
  left: 18px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 6px;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.5);

  strong {
    font-size: clamp(17px, 2vw, 24px);
    line-height: 1.15;
  }

  > span:last-child {
    color: rgba(255, 255, 255, 0.78);
    font-size: 12px;
  }
}

.inspiration-product {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 750;

  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
  }
}

@media (max-width: 900px) {
  .inspiration-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .home-section {
    padding: 38px 0 62px;
  }

  .section-heading {
    display: block;

    p {
      margin-top: 10px;
      font-size: 14px;
    }
  }

  .inspiration-grid {
    grid-auto-rows: 126px;
    gap: 10px;
  }

  .inspiration-card {
    border-radius: 17px;

    &.is-wide {
      grid-column: span 2;
      grid-row: span 2;
    }

    &.is-landscape,
    &.is-square {
      grid-column: span 1;
      grid-row: span 2;
    }
  }

  .inspiration-copy {
    right: 13px;
    bottom: 13px;
    left: 13px;

    strong {
      font-size: 16px;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .inspiration-card > img {
    transition: none;
  }

  .inspiration-card:hover > img {
    transform: none;
  }
}
</style>
