<template>
  <div class="download-page">
    <div class="container">
      <section class="hero">
        <p class="eyebrow">AceData App</p>
        <h1>{{ $t('common.title.mobileApp') }}</h1>
        <p class="subtitle">{{ $t('common.message.mobileAppDescription') }}</p>
      </section>

      <section class="cards">
        <article class="card">
          <div class="card__header">
            <span class="badge">Android</span>
            <span class="version">v{{ version }}</span>
          </div>
          <h2>{{ $t('common.button.downloadAndroid') }}</h2>
          <p>{{ $t('common.message.mobileAndroidHint') }}</p>
          <qr-code
            v-if="hasAndroidDownload"
            :value="androidDownloadUrl"
            :width="168"
            :height="168"
            class="qr"
            type="image/png"
            :color="{ dark: '#111111ff', light: '#ffffffff' }"
          />
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
          <p v-else class="pending">{{ $t('common.message.mobileAndroidPending') }}</p>
        </article>

        <article class="card">
          <div class="card__header">
            <span class="badge">iOS</span>
            <span class="version">v{{ version }}</span>
          </div>
          <h2>{{ $t('common.button.downloadIos') }}</h2>
          <p>{{ hasIosDownload ? $t('common.message.mobileIosHint') : $t('common.message.mobileIosPending') }}</p>
          <qr-code
            v-if="hasIosDownload"
            :value="iosDisplayUrl"
            :width="168"
            :height="168"
            class="qr"
            type="image/png"
            :color="{ dark: '#111111ff', light: '#ffffffff' }"
          />
          <div v-if="hasIosDownload" class="actions">
            <el-button type="primary" round size="large" tag="a" :href="iosDownloadUrl" target="_blank">
              {{ $t('common.button.installIos') }}
            </el-button>
            <el-button round size="large" tag="a" :href="iosFallbackUrl" target="_blank">
              {{ $t('common.button.downloadIos') }}
            </el-button>
          </div>
          <p v-else class="pending">{{ $t('common.message.mobileIosPending') }}</p>
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
    },
    iosDisplayUrl() {
      return MOBILE_IOS_FALLBACK_URL || MOBILE_IOS_DOWNLOAD_URL;
    }
  }
});
</script>

<style lang="scss" scoped>
.download-page {
  min-height: calc(100vh - 140px);
  background:
    radial-gradient(circle at top left, rgba(64, 158, 255, 0.16), transparent 28%),
    linear-gradient(180deg, #f7fbff 0%, #eef4ff 100%);
}

.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 72px 24px 96px;
}

.hero {
  text-align: center;
  margin-bottom: 48px;

  .eyebrow {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #409eff;
  }

  h1 {
    margin: 0 0 16px;
    font-size: 48px;
    line-height: 1.1;
    color: #111827;
  }

  .subtitle {
    max-width: 720px;
    margin: 0 auto;
    font-size: 18px;
    line-height: 1.7;
    color: #4b5563;
  }
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  text-align: center;

  .card__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .badge {
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(64, 158, 255, 0.12);
    color: #2563eb;
    font-weight: 700;
  }

  .version {
    color: #6b7280;
    font-size: 14px;
  }

  h2 {
    margin: 0 0 12px;
    font-size: 28px;
    color: #111827;
  }

  p {
    min-height: 56px;
    margin: 0 0 20px;
    font-size: 15px;
    line-height: 1.7;
    color: #4b5563;
  }

  .qr {
    padding: 14px;
    border-radius: 24px;
    background: #ffffff;
    box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.08);
    margin-bottom: 20px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
  }

  .pending {
    min-height: auto;
    margin-bottom: 0;
    color: #6b7280;
  }
}

.note {
  margin-top: 24px;
  padding: 20px 24px;
  border-radius: 20px;
  background: rgba(17, 24, 39, 0.04);
  color: #4b5563;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .container {
    padding: 48px 16px 72px;
  }

  .hero {
    h1 {
      font-size: 36px;
    }

    .subtitle {
      font-size: 16px;
    }
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 24px;
  }
}
</style>
