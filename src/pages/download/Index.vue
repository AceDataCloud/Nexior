<template>
  <div class="download-page">
    <div class="ambient ambient--cyan"></div>
    <div class="ambient ambient--gold"></div>
    <div class="container">
      <section class="hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">AceData App</p>
          <h1>{{ $t('common.title.mobileApp') }}</h1>
          <p class="subtitle">{{ $t('common.message.mobileAppDescription') }}</p>

          <div class="hero-tags">
            <span class="tag">{{ $t('common.message.mobileAvailableNow') }}</span>
            <span class="tag">v{{ version }}</span>
            <span class="tag tag--soft">{{ $t('common.message.mobileSecureDelivery') }}</span>
          </div>

          <div class="hero-actions">
            <el-button
              v-if="hasAndroidDownload"
              type="primary"
              round
              size="large"
              tag="a"
              :href="androidDownloadUrl"
              target="_blank"
            >
              {{ $t('common.button.downloadAndroid') }}
            </el-button>
            <el-button round size="large" class="secondary-action" @click="openSupport">
              {{ $t('common.nav.support') }}
            </el-button>
          </div>

          <div class="metrics">
            <article class="metric">
              <strong>Android</strong>
              <span>{{ $t('common.message.mobileDirectInstall') }}</span>
            </article>
            <article class="metric">
              <strong>v{{ version }}</strong>
              <span>{{ $t('common.message.mobileLatestRelease') }}</span>
            </article>
            <article class="metric">
              <strong>AceData</strong>
              <span>{{ $t('common.message.mobileSharedAccount') }}</span>
            </article>
          </div>
        </div>

        <div class="hero-panels">
          <article class="panel panel--android">
            <div class="panel__head">
              <span class="platform-badge">Android</span>
              <span class="status status--live">{{ $t('common.message.mobileAvailableNow') }}</span>
            </div>
            <h2>{{ $t('common.button.downloadAndroid') }}</h2>
            <p class="panel__text">{{ $t('common.message.mobileAndroidHint') }}</p>
            <div v-if="hasAndroidDownload" class="qr-frame">
              <qr-code
                :value="androidDownloadUrl"
                :width="176"
                :height="176"
                class="qr"
                type="image/png"
                :color="{ dark: '#07253dff', light: '#ffffffff' }"
              />
            </div>
            <div class="panel__footer">
              <el-button
                v-if="hasAndroidDownload"
                type="primary"
                round
                size="large"
                tag="a"
                :href="androidDownloadUrl"
                target="_blank"
              >
                {{ $t('common.button.downloadAndroid') }}
              </el-button>
              <span class="panel__meta">{{ $t('common.message.mobileSecureDelivery') }}</span>
            </div>
          </article>

          <article class="panel panel--ios">
            <div class="panel__head">
              <span class="platform-badge platform-badge--ios">iOS</span>
              <span class="status status--pending">{{ $t('common.message.mobileIosPending') }}</span>
            </div>
            <h2>{{ $t('common.button.downloadIos') }}</h2>
            <p class="panel__text">
              {{ hasIosDownload ? $t('common.message.mobileIosHint') : $t('common.message.mobileIosPending') }}
            </p>
            <div class="device-ghost">
              <div class="device-ghost__screen">
                <span>iOS</span>
                <small>Signing in progress</small>
              </div>
            </div>
            <div class="panel__footer panel__footer--stacked">
              <div v-if="hasIosDownload" class="button-group">
                <el-button type="primary" round size="large" tag="a" :href="iosDownloadUrl" target="_blank">
                  {{ $t('common.button.installIos') }}
                </el-button>
                <el-button round size="large" tag="a" :href="iosFallbackUrl" target="_blank">
                  {{ $t('common.button.downloadIos') }}
                </el-button>
              </div>
              <el-button v-else round size="large" class="secondary-action" @click="openSupport">
                {{ $t('common.nav.support') }}
              </el-button>
              <span class="panel__meta">{{ $t('common.message.mobileInstallNote') }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="advantage-grid">
        <article class="advantage-card">
          <p class="advantage-card__eyebrow">01</p>
          <h3>{{ $t('common.title.mobileFastAccess') }}</h3>
          <p>{{ $t('common.message.mobileFastAccess') }}</p>
        </article>
        <article class="advantage-card">
          <p class="advantage-card__eyebrow">02</p>
          <h3>{{ $t('common.title.mobileTrustedRelease') }}</h3>
          <p>{{ $t('common.message.mobileTrustedRelease') }}</p>
        </article>
        <article class="advantage-card">
          <p class="advantage-card__eyebrow">03</p>
          <h3>{{ $t('common.title.mobileUnifiedExperience') }}</h3>
          <p>{{ $t('common.message.mobileUnifiedExperience') }}</p>
        </article>
      </section>

      <section class="note">
        <p>{{ $t('common.message.mobileInstallNote') }}</p>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import QrCode from 'vue-qrcode';
import {
  MOBILE_ANDROID_DOWNLOAD_URL,
  MOBILE_APP_VERSION,
  MOBILE_IOS_DOWNLOAD_URL,
  MOBILE_IOS_FALLBACK_URL
} from '@/constants';

export default defineComponent({
  name: 'DownloadIndex',
  components: {
    ElButton,
    QrCode
  },
  computed: {
    version() {
      return MOBILE_APP_VERSION;
    },
    androidDownloadUrl() {
      return MOBILE_ANDROID_DOWNLOAD_URL;
    },
    hasAndroidDownload() {
      return !!MOBILE_ANDROID_DOWNLOAD_URL;
    },
    iosDownloadUrl() {
      return MOBILE_IOS_DOWNLOAD_URL;
    },
    iosFallbackUrl() {
      return MOBILE_IOS_FALLBACK_URL;
    },
    hasIosDownload() {
      return !!MOBILE_IOS_DOWNLOAD_URL && !!MOBILE_IOS_FALLBACK_URL;
    }
  },
  methods: {
    openSupport() {
      window.open('https://platform.acedata.cloud/support', '_blank');
    }
  }
});
</script>

<style lang="scss" scoped>
.download-page {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 140px);
  background: linear-gradient(180deg, #e9f1f3 0%, #d4e3e7 48%, #f1f7f8 100%);
}

.ambient {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;

  &--cyan {
    top: 72px;
    left: -120px;
    width: 320px;
    height: 320px;
    background: rgba(139, 92, 246, 0.2);
  }

  &--gold {
    top: 220px;
    right: -80px;
    width: 260px;
    height: 260px;
    background: rgba(var(--app-brand-rgb), 0.15);
  }
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 72px 24px 96px;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 28px;
  align-items: stretch;
  margin-bottom: 28px;
}

.hero-copy {
  padding: 48px;
  border-radius: 36px;
  background: linear-gradient(
    135deg,
    rgba(11, 13, 23, 0.98) 0%,
    rgba(26, 16, 58, 0.96) 56%,
    rgba(109, 40, 217, 0.92) 100%
  );
  color: #f8fbff;
  box-shadow: 0 30px 80px rgba(11, 13, 23, 0.3);

  .eyebrow {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(196, 181, 253, 0.94);
  }

  h1 {
    margin: 0 0 16px;
    max-width: 560px;
    font-size: 56px;
    line-height: 1.1;
    color: #f8fbff;
  }

  .subtitle {
    max-width: 560px;
    margin: 0;
    font-size: 18px;
    line-height: 1.7;
    color: rgba(230, 239, 248, 0.82);
  }
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 28px 0 24px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fbff;
  font-size: 13px;
  font-weight: 600;

  &--soft {
    color: rgba(230, 239, 248, 0.82);
  }
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
}

.secondary-action {
  border-color: rgba(var(--app-brand-rgb), 0.18);
  background: rgba(255, 255, 255, 0.72);
  color: #0e2a33;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(17, 24, 39, 0.08);
  backdrop-filter: blur(10px);

  strong {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
  }

  span {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(230, 239, 248, 0.72);
  }
}

.hero-panels {
  display: grid;
  gap: 20px;
}

.panel {
  position: relative;
  padding: 28px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);

  &--android::before,
  &--ios::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  &--android::before {
    background: linear-gradient(145deg, rgba(var(--app-brand-rgb), 0.12), transparent 42%);
  }

  &--ios::before {
    background: linear-gradient(145deg, rgba(15, 23, 42, 0.06), transparent 48%);
  }

  h2 {
    position: relative;
    z-index: 1;
    margin: 0 0 10px;
    font-size: 32px;
    line-height: 1.15;
    color: #0f172a;
  }
}

.panel__head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel__text {
  position: relative;
  z-index: 1;
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.75;
  color: #475569;
}

.platform-badge,
.status {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.platform-badge {
  background: rgba(var(--app-brand-rgb), 0.12);
  color: var(--el-color-primary);
}

.platform-badge--ios {
  background: rgba(15, 23, 42, 0.08);
  color: #334155;
}

.status--live {
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
}

.status--pending {
  max-width: 220px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  text-align: right;
  justify-content: flex-end;
}

.qr-frame {
  position: relative;
  z-index: 1;
  display: inline-flex;
  padding: 18px;
  border-radius: 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
}

.qr {
  display: block;
}

.device-ghost {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin: 10px 0 18px;

  &__screen {
    width: 180px;
    height: 220px;
    border-radius: 34px;
    padding: 24px;
    background: linear-gradient(180deg, #0f172a 0%, #22314b 100%);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.22);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #f8fafc;

    span {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    small {
      margin-top: 10px;
      font-size: 13px;
      color: rgba(226, 232, 240, 0.72);
    }
  }
}

.panel__footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 22px;
}

.panel__footer--stacked {
  align-items: flex-start;
  flex-direction: column;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.panel__meta {
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.advantage-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.advantage-card {
  padding: 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);

  &__eyebrow {
    margin: 0 0 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: var(--el-color-primary);
  }

  h3 {
    margin: 0 0 12px;
    font-size: 24px;
    line-height: 1.2;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.75;
    color: #475569;
  }
}

.note {
  padding: 22px 24px;
  border-radius: 24px;
  background: rgba(9, 21, 38, 0.9);
  color: rgba(226, 232, 240, 0.82);
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .container {
    padding: 44px 16px 72px;
  }

  .hero-shell {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 32px 24px;

    h1 {
      font-size: 42px;
    }
  }

  .metrics,
  .advantage-grid {
    grid-template-columns: 1fr;
  }

  .panel {
    padding: 24px;
  }

  .panel__head,
  .panel__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .status--pending {
    max-width: none;
    text-align: left;
    justify-content: flex-start;
  }
}
</style>
