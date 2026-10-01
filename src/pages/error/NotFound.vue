<template>
  <div class="not-found">
    <div class="glow" aria-hidden="true"></div>

    <main class="content">
      <p class="eyebrow">{{ $t('common.message.notFoundEyebrow') }}</p>
      <div class="code" aria-hidden="true">404</div>
      <h1 class="title">{{ $t('common.title.notFound') }}</h1>
      <p class="subtitle">{{ $t('common.message.notFound') }}</p>

      <div class="actions">
        <button class="btn btn--primary" @click="goHome">
          <home-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
          <span>{{ $t('common.button.backToHome') }}</span>
        </button>
        <back-navigation @click="goBack">{{ $t('common.button.goBack') }}</back-navigation>
      </div>

      <div v-if="path" class="path">
        <span class="path__label">{{ $t('common.message.notFoundPath') }}</span>
        <code class="path__value">{{ path }}</code>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { BackNavigation } from '@acedatacloud/core/components';
import { HomeIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'NotFound',
  components: {
    BackNavigation,
    HomeIcon
  },
  computed: {
    path(): string {
      return this.$route?.fullPath || '';
    }
  },
  mounted() {
    // Discourage indexing of 404 pages.
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex, nofollow');
  },
  beforeUnmount() {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) {
      robots.setAttribute('content', 'index, follow');
    }
  },
  methods: {
    goHome() {
      this.$router.push('/');
    },
    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.not-found {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  overflow: hidden;
  background: var(--adc-color-surface);
  color: var(--adc-color-text-primary);
}

.glow {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 720px;
  max-width: 120vw;
  aspect-ratio: 1 / 1;
  transform: translateX(-50%);
  background: radial-gradient(
    circle,
    rgba(var(--app-brand-rgb), 0.16) 0%,
    rgba(var(--app-brand-rgb), 0.08) 42%,
    transparent 68%
  );
  pointer-events: none;
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 540px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--adc-color-primary);
}

.code {
  font-size: clamp(96px, 22vw, 168px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: var(--app-gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  user-select: none;
}

.title {
  margin: 12px 0 0;
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 700;
  color: var(--adc-color-text-primary);
}

.subtitle {
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--adc-color-text-secondary);
  max-width: 440px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--adc-control-height);
  padding: 0 24px;
  border-radius: var(--adc-radius-round);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;

  &:active {
    transform: translateY(1px);
  }

  &--primary {
    color: #ffffff;
    background: var(--adc-color-primary);
    box-shadow: var(--app-shadow-sm);

    &:hover {
      background: var(--el-color-primary-dark-2);
    }
  }
}

.path {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
  padding: 8px 14px;
  border-radius: var(--adc-radius-control);
  background: var(--adc-color-surface-page);
  border: var(--adc-border-width) solid var(--adc-color-border-light);
  max-width: 100%;

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: var(--adc-color-text-secondary);
    white-space: nowrap;
  }

  &__value {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    color: var(--adc-color-text-regular);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
