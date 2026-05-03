<template>
  <div class="not-found">
    <div class="ambient ambient--violet"></div>
    <div class="ambient ambient--cyan"></div>

    <div class="container">
      <section class="hero">
        <div class="copy">
          <p class="eyebrow">{{ $t('common.message.notFoundEyebrow') }}</p>
          <h1 class="code" aria-hidden="true">404</h1>
          <h2 class="title">{{ $t('common.title.notFound') }}</h2>
          <p class="subtitle">{{ $t('common.message.notFound') }}</p>

          <div class="actions">
            <el-button type="primary" round size="large" @click="goHome">
              <font-awesome-icon icon="fa-solid fa-house" class="mr-2" />
              {{ $t('common.button.backToHome') }}
            </el-button>
            <el-button round size="large" class="secondary-action" @click="goBack">
              <font-awesome-icon icon="fa-solid fa-arrow-left" class="mr-2" />
              {{ $t('common.button.goBack') }}
            </el-button>
          </div>

          <div v-if="path" class="meta">
            <span class="meta__label">{{ $t('common.message.notFoundPath') }}</span>
            <code class="meta__path">{{ path }}</code>
          </div>
        </div>

        <div class="art" aria-hidden="true">
          <div class="orb orb--lg"></div>
          <div class="orb orb--md"></div>
          <div class="orb orb--sm"></div>
          <div class="grid"></div>
          <div class="big-404">
            <span>4</span>
            <span class="zero">
              <span class="zero__inner"></span>
            </span>
            <span>4</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'NotFound',
  components: {
    ElButton,
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
  min-height: calc(100vh - 64px);
  overflow: hidden;
  background: radial-gradient(circle at 20% 0%, #f5f3ff 0%, #ffffff 45%, #ecfeff 100%);

  .ambient {
    position: absolute;
    border-radius: 50%;
    filter: blur(110px);
    opacity: 0.55;
    pointer-events: none;
    z-index: 0;

    &--violet {
      width: 520px;
      height: 520px;
      top: -180px;
      left: -160px;
      background: radial-gradient(circle, #c4b5fd 0%, transparent 70%);
    }

    &--cyan {
      width: 480px;
      height: 480px;
      right: -160px;
      bottom: -200px;
      background: radial-gradient(circle, #67e8f9 0%, transparent 70%);
    }
  }

  .container {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 80px 24px 96px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 56px;
    align-items: center;

    @media (max-width: 960px) {
      grid-template-columns: 1fr;
      gap: 32px;
      text-align: center;
    }
  }

  .copy {
    .eyebrow {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #6d28d9;
      background: rgba(196, 181, 253, 0.25);
      margin-bottom: 18px;
    }

    .code {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.4em;
      color: #94a3b8;
      margin: 0 0 8px;
    }

    .title {
      font-size: 40px;
      line-height: 1.15;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px;

      @media (max-width: 640px) {
        font-size: 32px;
      }
    }

    .subtitle {
      font-size: 17px;
      line-height: 1.7;
      color: #475569;
      margin: 0 0 32px;
      max-width: 520px;

      @media (max-width: 960px) {
        margin-left: auto;
        margin-right: auto;
      }
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      @media (max-width: 960px) {
        justify-content: center;
      }

      :deep(.el-button) {
        padding: 0 22px;
        height: 44px;
      }

      .secondary-action {
        background: #ffffff;
        border-color: #e2e8f0;
        color: #1e293b;

        &:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
      }
    }

    .meta {
      margin-top: 36px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(148, 163, 184, 0.25);
      backdrop-filter: blur(8px);
      max-width: 100%;

      &__label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
      }

      &__path {
        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
        color: #1e293b;
        background: rgba(241, 245, 249, 0.8);
        padding: 4px 8px;
        border-radius: 6px;
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .art {
    position: relative;
    aspect-ratio: 1 / 1;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;

    .grid {
      position: absolute;
      inset: 8%;
      border-radius: 32px;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.35) 100%),
        repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.12) 0 1px, transparent 1px 32px),
        repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.12) 0 1px, transparent 1px 32px);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 30px 80px -30px rgba(67, 56, 202, 0.35);
      backdrop-filter: blur(6px);
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(2px);

      &--lg {
        width: 38%;
        height: 38%;
        top: -8%;
        right: -6%;
        background: radial-gradient(circle at 30% 30%, #a78bfa 0%, #6d28d9 70%, #4c1d95 100%);
        box-shadow: 0 20px 60px -10px rgba(109, 40, 217, 0.5);
        animation: float 7s ease-in-out infinite;
      }

      &--md {
        width: 22%;
        height: 22%;
        bottom: -4%;
        left: -2%;
        background: radial-gradient(circle at 30% 30%, #67e8f9 0%, #06b6d4 70%, #0e7490 100%);
        box-shadow: 0 16px 40px -10px rgba(6, 182, 212, 0.5);
        animation: float 9s ease-in-out -2s infinite;
      }

      &--sm {
        width: 12%;
        height: 12%;
        top: 38%;
        right: 14%;
        background: radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 70%, #b45309 100%);
        box-shadow: 0 10px 24px -6px rgba(245, 158, 11, 0.5);
        animation: float 6s ease-in-out -4s infinite;
      }
    }

    .big-404 {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: clamp(96px, 18vw, 200px);
      font-weight: 800;
      letter-spacing: -0.04em;
      line-height: 1;
      background: linear-gradient(135deg, #1e293b 0%, #6d28d9 60%, #06b6d4 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      user-select: none;

      .zero {
        position: relative;
        display: inline-block;

        .zero__inner {
          position: absolute;
          inset: 18% 22%;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          box-shadow: inset 0 0 24px rgba(109, 40, 217, 0.25);
          animation: pulse 4s ease-in-out infinite;
          -webkit-text-fill-color: initial;
        }
      }
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) translateX(0);
  }
  50% {
    transform: translateY(-14px) translateX(6px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.05);
  }
}

// Dark-mode friendly tweak (Nexior uses light theme primarily, but be safe)
@media (prefers-color-scheme: dark) {
  .not-found {
    background: radial-gradient(circle at 20% 0%, #1e1b4b 0%, #0f172a 45%, #042f2e 100%);

    .copy {
      .title {
        color: #f8fafc;
      }
      .subtitle {
        color: #cbd5e1;
      }
      .eyebrow {
        background: rgba(196, 181, 253, 0.15);
        color: #c4b5fd;
      }
    }

    .meta {
      background: rgba(15, 23, 42, 0.6);
      border-color: rgba(148, 163, 184, 0.2);

      &__label {
        color: #94a3b8;
      }

      &__path {
        background: rgba(30, 41, 59, 0.8);
        color: #e2e8f0;
      }
    }

    .art .grid {
      background:
        linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.3) 100%),
        repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.08) 0 1px, transparent 1px 32px),
        repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.08) 0 1px, transparent 1px 32px);
      border-color: rgba(148, 163, 184, 0.15);
    }

    .big-404 {
      background: linear-gradient(135deg, #f8fafc 0%, #c4b5fd 60%, #67e8f9 100%);
      -webkit-background-clip: text;
      background-clip: text;
    }
  }
}
</style>
