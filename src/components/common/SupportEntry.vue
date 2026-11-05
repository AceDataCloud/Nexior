<template>
  <div
    v-if="site?.id && site.features?.support?.enabled !== false"
    ref="anchor"
    class="support-anchor"
    :class="{ 'keyboard-open': keyboardOpen }"
  >
    <el-button
      class="support-launcher"
      round
      :style="{ transform: `translateY(-${raise}px)` }"
      :aria-label="$t('common.support.title')"
      aria-haspopup="dialog"
      :aria-expanded="visible"
      @click="onOpen"
    >
      <support-icon :size="'18px' as any" aria-hidden="true" focusable="false" />
      <span>{{ $t('common.support.launcher') }}</span>
    </el-button>
  </div>
  <el-dialog
    v-model="visible"
    :title="title"
    width="min(460px, calc(100vw - 32px))"
    class="support-dialog"
    align-center
    append-to-body
    destroy-on-close
  >
    <div v-if="view === 'contacts'" class="support-content">
      <p class="welcome">{{ $t('common.support.welcome', { brand: brandName }) }}</p>
      <div v-if="contacts.length" class="support-contacts">
        <div v-for="(contact, index) in contacts" :key="contact.id || index" class="support-contact">
          <div class="contact-heading">
            <font-awesome-icon v-if="contactUsesFontAwesome(contact.type)" :icon="contactIcon(contact.type)" />
            <component
              :is="contactIcon(contact.type)"
              v-else
              :size="'18px' as any"
              aria-hidden="true"
              focusable="false"
            />
            <span>{{ contactLabel(contact) }}</span>
          </div>
          <a v-if="contactHref(contact)" :href="contactHref(contact)" v-bind="linkAttrs(contactHref(contact))">
            {{ contact.value || $t('common.support.openChannel') }}
          </a>
          <p v-else-if="contact.value" class="contact-value">{{ contact.value }}</p>
          <img v-if="httpUrl(contact.qr)" :src="httpUrl(contact.qr)" :alt="contactLabel(contact)" class="contact-qr" />
        </div>
      </div>
      <p v-else class="support-empty">{{ $t('common.support.noContacts') }}</p>
      <p v-if="feedbackHint" class="feedback-hint" role="status">{{ $t('common.support.feedbackHint') }}</p>
      <div class="support-actions">
        <a v-if="feedbackUrl" class="support-action" :href="feedbackUrl" v-bind="linkAttrs(feedbackUrl)">
          <message-icon :size="'18px' as any" aria-hidden="true" focusable="false" />
          {{ $t('common.support.feedback') }}
        </a>
        <button v-else type="button" class="support-action" @click="feedbackHint = true">
          <message-icon :size="'18px' as any" aria-hidden="true" focusable="false" />
          {{ $t('common.support.feedback') }}
        </button>
        <button type="button" class="support-action" @click="onReport">
          <warning-icon :size="'18px' as any" aria-hidden="true" focusable="false" />
          {{ $t('common.title.reportContent') }}
        </button>
      </div>
    </div>
    <template v-else-if="view === 'report'">
      <el-button class="support-back" text @click="view = 'contacts'">{{ $t('common.support.back') }}</el-button>
      <content-report-form
        :service="service"
        :snapshot="{ page_path: $route.path }"
        request-target
        @cancel="view = 'contacts'"
        @submitted="onSubmitted"
      />
    </template>
    <div v-else class="support-receipt" role="status">
      <p>{{ $t('common.message.reportSuccess') }}</p>
      <p class="receipt-label">{{ $t('common.support.reportId') }}</p>
      <code class="receipt-id">{{ reportId }}</code>
      <p>{{ $t('common.support.receiptHint') }}</p>
      <el-button round @click="view = 'contacts'">{{ $t('common.settings.contactSupport') }}</el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, watch, type WatchStopHandle } from 'vue';
import { ElButton, ElDialog } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { MessageIcon, SupportIcon, WarningIcon } from '@acedatacloud/core/icons/components';
import type { ISite, ISiteContact } from '@/models';
import { getBrandContacts, getBrandName } from '@/utils/site';
import { contactBrand, contactIcon, contactTypeI18nKey, contactUsesFontAwesome } from '@/utils/contactTypes';
import { feedbackHref, supportContactHref, supportHttpUrl } from '@/utils/support';
import { supportObstacleElement } from '@/utils/supportObstacle';
import ContentReportForm from './ContentReportForm.vue';

export default defineComponent({
  name: 'SupportEntry',
  components: { ElButton, ElDialog, FontAwesomeIcon, MessageIcon, SupportIcon, WarningIcon, ContentReportForm },
  data() {
    return {
      visible: false,
      view: 'contacts' as 'contacts' | 'report' | 'receipt',
      feedbackHint: false,
      reportId: '',
      raise: 0,
      keyboardOpen: false,
      frame: 0,
      observer: undefined as ResizeObserver | undefined,
      stopObstacleWatch: undefined as WatchStopHandle | undefined
    };
  },
  computed: {
    site(): ISite | undefined {
      return this.$store.state.site;
    },
    brandName(): string {
      return getBrandName(this.site);
    },
    contacts(): ISiteContact[] {
      return getBrandContacts(this.site).filter(
        (contact) => contact.type !== 'feedback' || !supportContactHref(contact)
      );
    },
    feedbackUrl(): string {
      return feedbackHref(this.site);
    },
    service(): string {
      return String(this.$route.meta.appName || 'studio');
    },
    title(): string {
      return this.$t(this.view === 'report' ? 'common.title.reportContent' : 'common.support.title');
    }
  },
  watch: {
    '$route.fullPath'() {
      this.visible = false;
      this.schedulePosition();
    },
    site() {
      this.$nextTick(this.schedulePosition);
    },
    '$store.state.setting.dockCollapsed'() {
      this.schedulePosition();
    }
  },
  mounted() {
    if (typeof ResizeObserver !== 'undefined') this.observer = new ResizeObserver(this.schedulePosition);
    this.stopObstacleWatch = watch(
      supportObstacleElement,
      (element) => {
        this.observer?.disconnect();
        if (element) this.observer?.observe(element);
        this.schedulePosition();
      },
      { immediate: true, flush: 'post' }
    );
    window.addEventListener('resize', this.schedulePosition);
    window.visualViewport?.addEventListener('resize', this.schedulePosition);
  },
  beforeUnmount() {
    this.stopObstacleWatch?.();
    this.observer?.disconnect();
    window.cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.schedulePosition);
    window.visualViewport?.removeEventListener('resize', this.schedulePosition);
  },
  methods: {
    contactIcon,
    contactUsesFontAwesome,
    contactHref: supportContactHref,
    httpUrl: supportHttpUrl,
    contactLabel(contact: ISiteContact): string {
      if (contact.label) return contact.label;
      const key = contactTypeI18nKey(contact.type);
      return key ? this.$t(key) : contactBrand(contact.type) || contact.type;
    },
    linkAttrs(href: string) {
      return /^https?:/.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    },
    onOpen() {
      this.view = 'contacts';
      this.feedbackHint = false;
      this.visible = true;
    },
    onReport() {
      if (!this.$store.getters.authenticated) {
        this.visible = false;
        this.$store.dispatch('login', { redirect: this.$route.fullPath });
        return;
      }
      this.view = 'report';
    },
    onSubmitted(id: string) {
      this.reportId = id;
      this.view = 'receipt';
    },
    schedulePosition() {
      window.cancelAnimationFrame(this.frame);
      this.frame = window.requestAnimationFrame(() => {
        this.keyboardOpen =
          window.innerWidth < 768 && (window.visualViewport?.height || window.innerHeight) < window.innerHeight - 120;
        const anchor = (this.$refs.anchor as HTMLElement | undefined)?.getBoundingClientRect();
        const obstacle = supportObstacleElement.value?.getBoundingClientRect();
        this.raise =
          anchor &&
          obstacle &&
          anchor.left < obstacle.right &&
          anchor.right > obstacle.left &&
          anchor.bottom > obstacle.top &&
          anchor.top < obstacle.bottom
            ? Math.max(0, anchor.bottom - obstacle.top + 12)
            : 0;
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.support-anchor {
  position: fixed;
  right: 24px;
  bottom: calc(24px + var(--app-safe-area-bottom, 0px));
  z-index: 190;
}
.support-launcher {
  height: 44px;
  margin: 0;
  padding: 0 16px;
  box-shadow: var(--app-shadow-md);
}
.support-launcher :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.support-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.welcome,
.support-empty {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.support-contacts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
}
.support-contact {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  overflow-wrap: anywhere;
}
.contact-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
}
.support-contact a {
  color: var(--el-color-primary);
}
.contact-value {
  color: var(--el-text-color-regular);
  white-space: pre-line;
}
.contact-qr {
  width: 160px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}
.support-actions {
  display: flex;
  flex-wrap: wrap;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
  gap: 12px;
}
.support-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  cursor: pointer;
  font: inherit;
  text-decoration: none;
}
.support-action:hover {
  background: var(--el-fill-color-light);
}
.feedback-hint {
  color: var(--el-text-color-regular);
}
.support-back {
  margin-bottom: 12px;
}
.support-receipt {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
}
.receipt-label {
  color: var(--el-text-color-secondary);
}
.receipt-id {
  overflow-wrap: anywhere;
  user-select: all;
}
.keyboard-open {
  visibility: hidden;
}
@media (max-width: 767px) {
  .support-anchor {
    right: 12px;
    bottom: calc(var(--app-dock-height, 60px) + var(--app-safe-area-bottom, 0px) + 12px);
  }
  .support-launcher {
    padding: 0 12px;
  }
}
</style>

<style lang="scss">
.support-dialog .el-dialog__body {
  max-height: calc(100dvh - 144px - var(--app-safe-area-top, 0px) - var(--app-safe-area-bottom, 0px));
  overflow-y: auto;
}
</style>
