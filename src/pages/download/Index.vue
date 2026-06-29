<template>
  <div class="download-page">
    <div class="download-page__glow" aria-hidden="true"></div>
    <div class="download-page__inner">
      <!-- Hero -->
      <header class="hero">
        <span class="hero__brand">
          <img :src="brandLogo" :alt="brandTitle" class="hero__logo" />
        </span>
        <p class="hero__eyebrow">{{ brandTitle }} · {{ $t('common.nav.mobileApp') }}</p>
        <h1 class="hero__title">{{ $t('common.title.mobileApp') }}</h1>
        <p class="hero__subtitle">{{ $t('common.message.mobileAppDescription') }}</p>

        <div class="hero__badges">
          <span class="badge badge--live">
            <span class="badge__dot"></span>{{ $t('common.message.mobileAvailableNow') }}
          </span>
          <span class="badge">v{{ version }}</span>
          <span class="badge">{{ $t('common.message.mobileSharedAccount') }}</span>
        </div>

        <div class="hero__actions">
          <el-button v-if="hasPlayStore" type="primary" round size="large" tag="a" :href="playStoreUrl" target="_blank">
            <font-awesome-icon :icon="faGooglePlay" class="btn-icon" />
            {{ $t('common.button.getOnGooglePlay') }}
          </el-button>
          <el-button
            v-else-if="hasAndroidDownload"
            type="primary"
            round
            size="large"
            tag="a"
            :href="androidDownloadUrl"
            target="_blank"
          >
            <font-awesome-icon :icon="faAndroid" class="btn-icon" />
            {{ $t('common.button.downloadAndroid') }}
          </el-button>
          <el-button v-if="hasAppStore" round size="large" tag="a" :href="appStoreUrl" target="_blank">
            <font-awesome-icon :icon="faApple" class="btn-icon" />
            {{ $t('common.button.getOnAppStore') }}
          </el-button>
          <el-button round size="large" class="btn-ghost" @click="openSupport">
            {{ $t('common.nav.support') }}
          </el-button>
        </div>
      </header>

      <!-- Platform download cards -->
      <section class="platforms">
        <article class="platform platform--android">
          <div class="platform__head">
            <span class="platform__os">
              <font-awesome-icon :icon="faAndroid" class="platform__os-icon" />
              Android
            </span>
            <span class="chip chip--live">
              <span class="chip__dot"></span>{{ $t('common.message.mobileAvailableNow') }}
            </span>
          </div>
          <h2 class="platform__title">{{ $t('common.button.downloadAndroid') }}</h2>
          <p class="platform__text">{{ $t('common.message.mobileAndroidHint') }}</p>

          <div v-if="hasPlayStore || hasAndroidDownload" class="qr">
            <qr-code
              :value="hasPlayStore ? playStoreUrl : androidDownloadUrl"
              :width="184"
              :height="184"
              class="qr__img"
              type="image/png"
              :color="{ dark: '#0e2a33ff', light: '#ffffffff' }"
            />
            <p class="qr__hint">
              {{ hasPlayStore ? $t('common.message.mobilePlayStoreHint') : $t('common.message.mobileSecureDelivery') }}
            </p>
          </div>

          <div class="platform__foot platform__foot--stack">
            <el-button
              v-if="hasPlayStore"
              type="primary"
              round
              size="large"
              tag="a"
              :href="playStoreUrl"
              target="_blank"
            >
              <font-awesome-icon :icon="faGooglePlay" class="btn-icon" />
              {{ $t('common.button.getOnGooglePlay') }}
            </el-button>

            <template v-if="hasAndroidDownload">
              <div v-if="hasPlayStore" class="platform__fallback">
                <el-button round tag="a" :href="androidDownloadUrl" target="_blank" class="btn-ghost">
                  <font-awesome-icon :icon="faDownload" class="btn-icon" />
                  {{ $t('common.button.downloadAndroid') }}
                </el-button>
                <span class="platform__meta">{{ $t('common.message.mobileApkFallback') }} · v{{ version }}</span>
              </div>
              <template v-else>
                <el-button type="primary" round size="large" tag="a" :href="androidDownloadUrl" target="_blank">
                  <font-awesome-icon :icon="faDownload" class="btn-icon" />
                  {{ $t('common.button.downloadAndroid') }}
                </el-button>
                <span class="platform__meta">{{ $t('common.message.mobileDirectInstall') }} · v{{ version }}</span>
              </template>
            </template>
          </div>
        </article>

        <article class="platform platform--ios">
          <div class="platform__head">
            <span class="platform__os">
              <font-awesome-icon :icon="faApple" class="platform__os-icon" />
              iOS
            </span>
            <span :class="['chip', hasIos ? 'chip--live' : 'chip--pending']">
              <span class="chip__dot"></span>
              {{ hasIos ? $t('common.message.mobileNowOnAppStore') : $t('common.message.mobileComingSoon') }}
            </span>
          </div>
          <h2 class="platform__title">{{ $t('common.button.downloadIos') }}</h2>
          <p class="platform__text">
            {{ hasIos ? $t('common.message.mobileIosHint') : $t('common.message.mobileIosPending') }}
          </p>

          <div v-if="hasAppStore" class="qr">
            <qr-code
              :value="appStoreUrl"
              :width="184"
              :height="184"
              class="qr__img"
              type="image/png"
              :color="{ dark: '#0e2a33ff', light: '#ffffffff' }"
            />
            <p class="qr__hint">{{ $t('common.message.mobileAppStoreHint') }}</p>
          </div>

          <template v-if="hasIos">
            <div class="platform__foot platform__foot--stack">
              <el-button
                v-if="hasAppStore"
                type="primary"
                round
                size="large"
                tag="a"
                :href="appStoreUrl"
                target="_blank"
              >
                <font-awesome-icon :icon="faApple" class="btn-icon" />
                {{ $t('common.button.getOnAppStore') }}
              </el-button>

              <template v-if="hasIosDownload">
                <div class="btn-row">
                  <el-button
                    :type="hasAppStore ? 'default' : 'primary'"
                    round
                    :size="hasAppStore ? 'default' : 'large'"
                    :class="{ 'btn-ghost': hasAppStore }"
                    tag="a"
                    :href="iosDownloadUrl"
                    target="_blank"
                  >
                    <font-awesome-icon :icon="faApple" class="btn-icon" />
                    {{ $t('common.button.installIos') }}
                  </el-button>
                  <el-button round size="large" class="btn-ghost" tag="a" :href="iosFallbackUrl" target="_blank">
                    {{ $t('common.button.downloadIos') }}
                  </el-button>
                </div>
                <span class="platform__meta">{{ $t('common.message.mobileInstallNote') }}</span>
              </template>
            </div>
          </template>

          <template v-else>
            <div class="ios-soon">
              <font-awesome-icon :icon="faApple" class="ios-soon__icon" />
              <p class="ios-soon__text">{{ $t('common.message.mobileComingSoon') }}</p>
            </div>
            <div class="platform__foot platform__foot--stack">
              <el-button round size="large" class="btn-ghost" @click="openSupport">
                {{ $t('common.nav.support') }}
              </el-button>
            </div>
          </template>
        </article>
      </section>

      <!-- Advantages -->
      <section class="advantages">
        <article class="advantage">
          <span class="advantage__num">01</span>
          <h3 class="advantage__title">{{ $t('common.title.mobileFastAccess') }}</h3>
          <p class="advantage__text">{{ $t('common.message.mobileFastAccess') }}</p>
        </article>
        <article class="advantage">
          <span class="advantage__num">02</span>
          <h3 class="advantage__title">{{ $t('common.title.mobileTrustedRelease') }}</h3>
          <p class="advantage__text">{{ $t('common.message.mobileTrustedRelease') }}</p>
        </article>
        <article class="advantage">
          <span class="advantage__num">03</span>
          <h3 class="advantage__title">{{ $t('common.title.mobileUnifiedExperience') }}</h3>
          <p class="advantage__text">{{ $t('common.message.mobileUnifiedExperience') }}</p>
        </article>
      </section>

      <!-- Install note -->
      <aside v-if="hasIosDownload" class="note">
        <font-awesome-icon :icon="faCircleInfo" class="note__icon" />
        <p class="note__text">{{ $t('common.message.mobileInstallNote') }}</p>
      </aside>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import QrCode from 'vue-qrcode';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faAndroid, faApple, faGooglePlay } from '@fortawesome/free-brands-svg-icons';
import { faDownload, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import defaultLogo from '@/assets/images/logo.png';
import {
  MOBILE_ANDROID_DOWNLOAD_URL,
  MOBILE_ANDROID_PLAY_STORE_URL,
  MOBILE_APP_VERSION,
  MOBILE_IOS_APP_STORE_URL,
  MOBILE_IOS_DOWNLOAD_URL,
  MOBILE_IOS_FALLBACK_URL
} from '@/constants';

export default defineComponent({
  name: 'DownloadIndex',
  components: {
    ElButton,
    QrCode,
    FontAwesomeIcon
  },
  data() {
    return {
      faAndroid,
      faApple,
      faGooglePlay,
      faDownload,
      faCircleInfo
    };
  },
  computed: {
    version() {
      return MOBILE_APP_VERSION;
    },
    brandTitle(): string {
      return this.$store.state.site?.title || 'AceData';
    },
    brandLogo(): string {
      return this.$store.state.site?.logo || defaultLogo;
    },
    androidDownloadUrl() {
      return MOBILE_ANDROID_DOWNLOAD_URL;
    },
    hasAndroidDownload() {
      return !!MOBILE_ANDROID_DOWNLOAD_URL;
    },
    playStoreUrl() {
      return MOBILE_ANDROID_PLAY_STORE_URL;
    },
    hasPlayStore() {
      return !!MOBILE_ANDROID_PLAY_STORE_URL;
    },
    appStoreUrl() {
      return MOBILE_IOS_APP_STORE_URL;
    },
    hasAppStore() {
      return !!MOBILE_IOS_APP_STORE_URL;
    },
    iosDownloadUrl() {
      return MOBILE_IOS_DOWNLOAD_URL;
    },
    iosFallbackUrl() {
      return MOBILE_IOS_FALLBACK_URL;
    },
    hasIosDownload() {
      return !!MOBILE_IOS_DOWNLOAD_URL && !!MOBILE_IOS_FALLBACK_URL;
    },
    hasIos() {
      return this.hasAppStore || this.hasIosDownload;
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
  min-height: calc(100vh - 80px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.download-page__glow {
  position: absolute;
  top: -180px;
  left: 50%;
  transform: translateX(-50%);
  width: 760px;
  max-width: 120vw;
  height: 460px;
  background: radial-gradient(circle at center, rgba(var(--app-brand-rgb), 0.18), transparent 68%);
  pointer-events: none;
  z-index: 0;
}

.download-page__inner {
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: 0 auto;
  padding: 72px 24px 96px;
}

/* Hero */
.hero {
  max-width: 720px;
  margin: 0 auto 56px;
  text-align: center;
}

.hero__brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 26px;
}

.hero__logo {
  display: block;
  width: auto;
  height: 42px;
  object-fit: contain;
}

.hero__eyebrow {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--app-brand-hex);
}

.hero__title {
  margin: 0 0 18px;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.hero__subtitle {
  max-width: 600px;
  margin: 0 auto 32px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.hero__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 36px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: var(--app-bg-section);
  border: 1px solid var(--app-border-subtle);
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
}

.badge--live {
  background: rgba(var(--app-brand-rgb), 0.1);
  border-color: rgba(var(--app-brand-rgb), 0.22);
  color: var(--app-brand-hex);
}

.badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.18);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
}

.btn-icon {
  margin-right: 8px;
}

.btn-ghost {
  background: var(--app-bg-surface);
  border-color: var(--app-border-subtle);
  color: var(--el-text-color-primary);
}

/* Platform download cards */
.platforms {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 56px;
}

.platform {
  display: flex;
  flex-direction: column;
  padding: 32px;
  border-radius: 20px;
  background: var(--app-bg-surface);
  border: 1px solid var(--app-border-subtle);
  box-shadow: var(--app-shadow-md);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.platform:hover {
  transform: translateY(-2px);
  box-shadow: var(--app-shadow-lg);
}

.platform__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.platform__os {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.platform__os-icon {
  font-size: 20px;
  color: var(--app-brand-hex);
}

.platform--ios .platform__os-icon {
  color: var(--el-text-color-primary);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.chip--live {
  background: rgba(16, 185, 129, 0.14);
  color: #047857;
}

.chip--live .chip__dot {
  background: #10b981;
}

.chip--pending {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.chip--pending .chip__dot {
  background: #f59e0b;
}

.platform__title {
  margin: 0 0 10px;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.platform__text {
  margin: 0 0 22px;
  min-height: 51px;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.qr__img {
  display: block;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.qr__hint {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.ios-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 24px;
  padding: 36px 24px;
  border-radius: 18px;
  background: var(--app-bg-section);
  border: 1px dashed var(--app-border-subtle);
}

.ios-soon__icon {
  font-size: 42px;
  color: var(--el-text-color-secondary);
}

.ios-soon__text {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.platform__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.platform__foot--stack {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
}

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.platform__fallback {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.platform__meta {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* Advantages */
.advantages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.advantage {
  padding: 28px;
  border-radius: 20px;
  background: var(--app-bg-section);
  border: 1px solid var(--app-border-subtle);
}

.advantage__num {
  display: inline-block;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--app-brand-hex);
}

.advantage__title {
  margin: 0 0 10px;
  font-size: 19px;
  line-height: 1.3;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.advantage__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

/* Install note */
.note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 24px;
  border-radius: 16px;
  background: rgba(var(--app-brand-rgb), 0.07);
  border: 1px solid rgba(var(--app-brand-rgb), 0.16);
}

.note__icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 18px;
  color: var(--app-brand-hex);
}

.note__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

/* Dark mode — keep the wordmark legible on a light chip */
html.dark .hero__brand {
  padding: 12px 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--app-shadow-md);
}

html.dark .qr__img {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Responsive */
@media (max-width: 860px) {
  .platforms,
  .advantages {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .download-page__inner {
    padding: 48px 16px 72px;
  }

  .platform {
    padding: 24px;
  }

  .platform__head {
    flex-wrap: wrap;
  }

  .hero__actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
