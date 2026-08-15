<template>
  <section class="home-section" aria-labelledby="quick-create-title">
    <div class="section-heading">
      <div>
        <span>{{ $t('intro.home.quick.eyebrow') }}</span>
        <h2 id="quick-create-title">{{ $t('intro.home.quick.title') }}</h2>
      </div>
      <p>{{ $t('intro.home.quick.subtitle') }}</p>
    </div>
    <div class="quick-grid">
      <router-link v-for="item in items" :key="item.id" :to="item.path" class="quick-card">
        <span class="quick-icon"><img :src="item.icon" alt="" loading="lazy" decoding="async" /></span>
        <span class="quick-copy">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </span>
        <span class="quick-arrow" aria-hidden="true">↗</span>
      </router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { IResolvedQuickCreate } from '../data';

defineProps<{ items: IResolvedQuickCreate[] }>();
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

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.quick-card {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 112px;
  gap: 15px;
  padding: 18px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 20px;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary) 12%);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--el-color-primary) 42%, var(--app-border-subtle));
    box-shadow: var(--app-shadow-md);
  }

  &:focus-visible {
    outline: 3px solid var(--el-color-primary);
    outline-offset: 3px;
  }
}

.quick-icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 16px;
  background: var(--el-bg-color);
  box-shadow: var(--app-shadow-sm);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.quick-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  padding-right: 18px;

  strong {
    font-size: 16px;
  }

  span {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.45;
    text-overflow: ellipsis;
  }
}

.quick-arrow {
  position: absolute;
  top: 14px;
  right: 16px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 920px) {
  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

  .quick-grid {
    gap: 10px;
  }

  .quick-card {
    min-height: 142px;
    align-items: flex-start;
    flex-direction: column;
    padding: 15px;
    border-radius: 17px;
  }

  .quick-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
  }

  .quick-copy {
    gap: 4px;
    padding-right: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quick-card {
    transition: none;
  }

  .quick-card:hover {
    transform: none;
  }
}
</style>
