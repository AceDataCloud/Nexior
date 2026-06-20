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
          <font-awesome-icon icon="fa-solid fa-house" />
          <span>{{ $t('common.button.backToHome') }}</span>
        </button>
        <button class="btn btn--ghost" @click="goBack">
          <font-awesome-icon icon="fa-solid fa-arrow-left" />
          <span>{{ $t('common.button.goBack') }}</span>
        </button>
      </div>

      <div v-if="path" class="path">
        <span class="path__label">{{ $t('common.message.notFoundPath') }}</span>
        <code class="path__value">{{ path }}</code>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'NotFound',
  components: {
    FontAwesomeIcon
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
  background: #ffffff;
}

.glow {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 720px;
  max-width: 120vw;
  aspect-ratio: 1 / 1;
  transform: translateX(-50%);
  // Echoes the boot-loader spinner palette (spring-green → cyan → blue).
  background: radial-gradient(circle, rgba(7, 238, 166, 0.16) 0%, rgba(35, 171, 255, 0.08) 42%, transparent 68%);
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
  color: #0a9c84;
}

.code {
  font-size: clamp(96px, 22vw, 168px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #07eea6 0%, #29bee4 50%, #23abff 100%);
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
  color: #0f172a;
}

.subtitle {
  margin: 12px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: #64748b;
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
  height: 46px;
  padding: 0 24px;
  border-radius: 999px;
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
    background: linear-gradient(135deg, #06c79f 0%, #1fa6d8 100%);
    box-shadow: 0 10px 24px -10px rgba(11, 180, 160, 0.65);

    &:hover {
      box-shadow: 0 14px 30px -10px rgba(11, 180, 160, 0.85);
    }
  }

  &--ghost {
    color: #334155;
    background: #ffffff;
    border-color: #e2e8f0;

    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
  }
}

.path {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f6;
  max-width: 100%;

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
  }

  &__value {
    font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    color: #334155;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (prefers-color-scheme: dark) {
  .not-found {
    background: #0b1120;
  }

  .glow {
    background: radial-gradient(circle, rgba(7, 238, 166, 0.26) 0%, rgba(35, 171, 255, 0.14) 42%, transparent 68%);
  }

  .code {
    background: linear-gradient(135deg, #2bf3bf 0%, #5fd4f2 50%, #6fc0ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }

  .title {
    color: #f8fafc;
  }

  .subtitle {
    color: #94a3b8;
  }

  .btn--ghost {
    color: #e2e8f0;
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(148, 163, 184, 0.25);

    &:hover {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(148, 163, 184, 0.4);
    }
  }

  .path {
    background: rgba(30, 41, 59, 0.5);
    border-color: rgba(148, 163, 184, 0.18);

    &__value {
      color: #e2e8f0;
    }
  }
}
</style>
