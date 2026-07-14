<template>
  <div class="settings-list">
    <!--
      The first-party attribution + one-click build trio (Nexior source,
      Ace Data Cloud API, Build-your-own) is shown only on our own
      first-party official builds: the bare official web host, plus the
      native (Capacitor) / desktop (Electron) shells whose window.host is
      a useless "localhost"/"bundle" but which always run against studio.
      Web subsites and white-label tenants get their contacts block only.
    -->
    <template v-if="isFirstPartyOfficial">
      <section class="settings-item">
        <div class="settings-label">
          <p class="settings-title">{{ $t('common.settings.poweredBy') }}</p>
          <p class="settings-tip">{{ $t('common.settings.poweredByTip') }}</p>
        </div>
        <div class="settings-content">
          <a href="https://github.com/AceDataCloud/Nexior" target="_blank" rel="noopener noreferrer" class="about-link">
            <font-awesome-icon :icon="faGithub" class="icon" />
            <span>Nexior</span>
          </a>
        </div>
      </section>
      <section class="settings-item">
        <div class="settings-label">
          <p class="settings-title">{{ $t('common.settings.apiService') }}</p>
          <p class="settings-tip">{{ $t('common.settings.apiServiceTip') }}</p>
        </div>
        <div class="settings-content">
          <a href="https://platform.acedata.cloud" target="_blank" rel="noopener noreferrer" class="about-link">
            <globe-icon class="icon" :size="'1em' as any" aria-hidden="true" focusable="false" />
            <span>Ace Data Cloud</span>
          </a>
        </div>
      </section>
      <section class="settings-item">
        <div class="settings-label">
          <p class="settings-title">{{ $t('common.settings.buildYourOwn') }}</p>
          <p class="settings-tip">{{ $t('common.settings.buildYourOwnTip') }}</p>
        </div>
        <div class="settings-content">
          <!--
            One-click subsite create: ask the parent dialog (Setting.vue)
            to switch to the Subsites tab with the create form open.
          -->
          <el-button type="primary" @click="onBuildOneClick">
            <launch-icon class="mr-1" :size="'1em' as any" aria-hidden="true" focusable="false" />
            {{ $t('common.settings.buildNow') }}
          </el-button>
        </div>
      </section>
    </template>

    <!--
      Customer-service contacts the site owner filled in
      (Site.branding.contacts). Rendered whenever at least one channel is
      set, so the official main host can also surface them if configured.
    -->
    <section v-if="hasContacts" class="settings-item contacts-item">
      <div class="settings-label">
        <p class="settings-title">{{ $t('common.settings.contactSupport') }}</p>
        <p class="settings-tip">{{ $t('common.settings.contactSupportTip') }}</p>
      </div>
      <div class="settings-content contacts-content">
        <div v-for="(c, i) in contacts" :key="i" class="contact-entry">
          <a v-if="contactHref(c)" :href="contactHref(c)" v-bind="linkAttrs(c)" class="about-link">
            <font-awesome-icon v-if="contactUsesFontAwesome(c.type)" :icon="contactIconFor(c.type)" class="icon" />
            <component
              :is="contactIconFor(c.type)"
              v-else
              class="icon"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            <span>{{ contactText(c) }}</span>
          </a>
          <span v-else class="about-link contact-static">
            <font-awesome-icon v-if="contactUsesFontAwesome(c.type)" :icon="contactIconFor(c.type)" class="icon" />
            <component
              :is="contactIconFor(c.type)"
              v-else
              class="icon"
              :size="'1em' as any"
              aria-hidden="true"
              focusable="false"
            />
            <span>{{ contactText(c) }}</span>
          </span>
          <el-image
            v-if="c.qr"
            :src="c.qr"
            :preview-src-list="[c.qr]"
            :preview-teleported="true"
            fit="contain"
            class="contact-qr"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { GlobeIcon, LaunchIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton, ElImage } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { SETTING_TAB_SUBSITES } from '@/constants';
import { isMainOfficial, isNative, isDesktop, getBrandContacts, hasBrandContacts } from '@/utils';
import {
  contactIcon,
  contactMeta,
  contactBrand,
  contactTypeI18nKey,
  contactUsesFontAwesome
} from '@/utils/contactTypes';
import { ISite, ISiteContact } from '@/models';

export default defineComponent({
  name: 'AboutSetting',
  components: {
    ElButton,
    ElImage,
    FontAwesomeIcon,
    GlobeIcon,
    LaunchIcon
  },
  emits: ['switch-tab'],
  data() {
    return {
      faGithub
    };
  },
  computed: {
    site(): ISite | undefined {
      return this.$store?.state?.site;
    },
    isFirstPartyOfficial(): boolean {
      // Bare official web host, OR a native/desktop shell (host is
      // "localhost"/"bundle" there but the bundle always resolves the
      // studio Site row — see getSiteOrigin).
      return isMainOfficial() || isNative() || isDesktop();
    },
    contacts(): ISiteContact[] {
      return getBrandContacts(this.site);
    },
    hasContacts(): boolean {
      return hasBrandContacts(this.site);
    }
  },
  methods: {
    contactUsesFontAwesome,
    contactIconFor(type: string) {
      return contactIcon(type);
    },
    contactHref(c: ISiteContact): string {
      // An explicit URL always wins; otherwise derive tel:/mailto: from the
      // value for phone/email types. Backend validation guarantees url is
      // http(s) and phone/email values are scheme-safe, so no XSS here.
      if (c.url) return c.url;
      const scheme = contactMeta(c.type).scheme;
      if (c.value && scheme === 'tel') return `tel:${c.value}`;
      if (c.value && scheme === 'mailto') return `mailto:${c.value}`;
      return '';
    },
    linkAttrs(c: ISiteContact): Record<string, string> {
      // Only external http(s) links open in a new tab; tel:/mailto: don't.
      return /^https?:/i.test(this.contactHref(c)) ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    },
    contactText(c: ISiteContact): string {
      if (c.label) return c.label;
      if (c.value) return c.value;
      const brand = contactBrand(c.type);
      if (brand) return brand;
      const key = contactTypeI18nKey(c.type);
      return key ? (this.$t(key) as string) : this.capitalize(c.type);
    },
    capitalize(s: string): string {
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
    },
    onBuildOneClick() {
      // Ask the parent settings dialog to swap to the Subsites tab with
      // the create form pre-opened. Plain Vue emit, no global event bus.
      this.$emit('switch-tab', { tab: SETTING_TAB_SUBSITES, autoOpenCreateSubsite: true });
    }
  }
});
</script>

<style lang="scss" scoped>
.about-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: color 0.3s;
  font-size: 14px;

  .icon {
    font-size: 18px;
  }

  &:hover {
    color: var(--el-color-primary);
  }
}

.contacts-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-entry {
  display: flex;
  align-items: center;
  gap: 12px;

  .contact-static {
    cursor: default;

    &:hover {
      color: var(--el-text-color-regular);
    }

    span {
      user-select: text;
    }
  }

  .contact-qr {
    width: 96px;
    height: 96px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    cursor: zoom-in;
  }
}
</style>
