<template>
  <div v-if="siteLoaded" class="intro">
    <section class="hero">
      <div class="hero__grid" />
      <div class="container hero__content">
        <span class="eyebrow">{{ $t('intro.badge.hero') }}</span>
        <h1>{{ heroTitle }}</h1>
        <p class="hero__summary">{{ heroSubtitle }}</p>
        <div class="hero__actions">
          <el-button type="primary" size="large" @click="onStart">
            {{ $t('common.button.startForFree') }}
          </el-button>
          <el-button v-if="firstSectionKey" size="large" @click="scrollTo(firstSectionKey)">
            {{ $t('intro.button.explore') }}
          </el-button>
        </div>
        <dl class="hero__stats">
          <div v-for="stat in heroStats" :key="stat.labelKey">
            <dt>{{ stat.value }}</dt>
            <dd>{{ $t(stat.labelKey) }}</dd>
          </div>
        </dl>
        <div v-if="heroDesktop" class="hero__screens">
          <div class="macbook-frame hero__desktop" aria-hidden="true">
            <div class="macbook-frame__lid">
              <span class="macbook-frame__camera" />
              <div class="macbook-frame__viewport"><img :src="heroDesktop" alt="" /></div>
              <div class="macbook-frame__chin" />
            </div>
            <div class="macbook-frame__base"><span /></div>
          </div>
          <div v-if="heroMobile" class="phone-device hero__mobile" aria-hidden="true">
            <span class="phone-device__speaker" />
            <div class="phone-device__screen">
              <span class="phone-device__island" />
              <img :src="heroMobile" alt="" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section
      v-for="(section, index) in sections"
      :id="section.key"
      :key="section.key"
      class="section capability"
      :class="{ 'capability--alt': index % 2 === 1 }"
    >
      <div class="container">
        <div class="capability__head">
          <span class="eyebrow eyebrow--light">{{ $t(section.eyebrowKey) }}</span>
          <h2>{{ $t(section.displayTitleKey) }}</h2>
          <p>{{ section.subtitle }}</p>
        </div>

        <div
          class="capability__body"
          :class="{
            'capability__body--reverse': index % 2 === 1 && section.desktop,
            'capability__body--copy-only': !section.desktop
          }"
        >
          <div v-if="section.desktop" class="screen-pair" :class="{ 'screen-pair--with-phone': section.mobile }">
            <div class="macbook-frame screen-pair__desktop">
              <div class="macbook-frame__lid">
                <span class="macbook-frame__camera" aria-hidden="true" />
                <div class="macbook-frame__viewport">
                  <img :src="section.desktop" :alt="$t(section.titleKey)" loading="lazy" />
                </div>
                <div class="macbook-frame__chin" />
              </div>
              <div class="macbook-frame__base"><span /></div>
            </div>
            <div v-if="section.mobile" class="phone-device screen-pair__mobile">
              <span class="phone-device__speaker" aria-hidden="true" />
              <div class="phone-device__screen">
                <span class="phone-device__island" aria-hidden="true" />
                <img :src="section.mobile" alt="" loading="lazy" />
              </div>
            </div>
          </div>

          <div class="capability__copy">
            <ul class="feature-points">
              <li v-for="bulletKey in section.bulletKeys" :key="bulletKey">
                <confirm-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
                <span>{{ $t(bulletKey) }}</span>
              </li>
            </ul>
            <el-button type="primary" plain @click="open(section.path)">
              {{ $t('intro.button.try') }}
              <next-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </div>
        </div>

        <div
          class="model-grid"
          :style="{
            '--model-grid-columns': Math.min(section.entries.length, 5),
            '--model-grid-columns-tablet': Math.min(section.entries.length, 3),
            '--model-grid-columns-mobile': Math.min(section.entries.length, 2)
          }"
        >
          <article v-for="entry in section.entries" :key="entry.name" class="model-card">
            <div class="model-card__heading">
              <span class="model-card__logo" aria-hidden="true">
                <img :src="entry.icon" alt="" loading="lazy" />
              </span>
              <h3>{{ entry.name }}</h3>
            </div>
            <p>{{ $t(entry.descriptionKey) }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section connector-section">
      <div class="container">
        <div class="capability__head">
          <span class="eyebrow eyebrow--light">{{ $t('intro.eyebrow.connector') }}</span>
          <h2>{{ $t('intro.title.connector') }}</h2>
          <p>{{ $t('intro.subtitle.connector') }}</p>
        </div>
        <div class="capability__body">
          <div class="screen-pair">
            <div class="macbook-frame screen-pair__desktop">
              <div class="macbook-frame__lid">
                <span class="macbook-frame__camera" aria-hidden="true" />
                <div class="macbook-frame__viewport">
                  <img :src="connectorShot" :alt="$t('intro.title.connector')" loading="lazy" />
                </div>
                <div class="macbook-frame__chin" />
              </div>
              <div class="macbook-frame__base"><span /></div>
            </div>
          </div>
          <div class="capability__copy">
            <ul class="feature-points">
              <li v-for="bulletKey in connectorBullets" :key="bulletKey">
                <confirm-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
                <span>{{ $t(bulletKey) }}</span>
              </li>
            </ul>
            <el-button type="primary" plain @click="open('/console/connectors')">
              {{ $t('intro.button.try') }}
              <next-icon :size="'1em' as any" aria-hidden="true" focusable="false" />
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta__content">
        <div>
          <p class="story-kicker">{{ $t('intro.eyebrow.cta') }}</p>
          <h2>{{ $t('intro.title.cta') }}</h2>
          <p>{{ $t('intro.subtitle.cta') }}</p>
        </div>
        <div class="final-cta__actions">
          <el-button type="primary" size="large" @click="onStart">
            {{ $t('common.button.startForFree') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="intro-loading" role="status" :aria-label="$t('common.status.loading')">
    <span class="intro-loading__pulse" />
  </div>
</template>

<script lang="ts">
import { ConfirmIcon, NextIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import { getDefaultRoute } from '@/router';
import { INTRO_SECTIONS, INTRO_SHOTS, type IIntroScreenshot, type ILocalizedImage } from './data';

const CONNECTOR_BULLETS = [
  'intro.bullet.connector.catalog',
  'intro.bullet.connector.modes',
  'intro.bullet.connector.security'
];

export default defineComponent({
  name: 'ProductHome',
  components: {
    ElButton,
    ConfirmIcon,
    NextIcon
  },
  data() {
    return {
      connectorBullets: CONNECTOR_BULLETS
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    enabledFeatures(): Record<string, { enabled?: boolean } | undefined> {
      return (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
    },
    // Wait for the site record before rendering the catalog. Otherwise the
    // initial empty store would briefly expose every disabled capability.
    siteLoaded(): boolean {
      return Boolean(this.site?.id);
    },
    isChineseLocale(): boolean {
      return String(this.$i18n.locale).toLowerCase().startsWith('zh');
    },
    // Every site — including studio.acedata.cloud — advertises only what its
    // feature configuration enabled. Keep the directory empty until the site
    // object arrives so disabled capabilities never flash during bootstrap.
    availableKeys(): CapabilityKey[] {
      if (!this.siteLoaded) return [];
      return CAPABILITY_KEYS.filter((key) => this.enabledFeatures[key]?.enabled);
    },
    heroTitle(): string {
      return this.site?.title?.trim() || this.$t('intro.title.hero');
    },
    heroSubtitle(): string {
      return this.site?.description?.trim() || this.$t('intro.subtitle.hero');
    },
    heroStats() {
      return [
        { value: `${this.availableKeys.length}`, labelKey: 'intro.stat.capabilities' },
        { value: `${this.visibleEntryCount}`, labelKey: 'intro.stat.products' },
        { value: '80+', labelKey: 'intro.stat.connectors' }
      ];
    },
    visibleEntryCount(): number {
      return this.sections.reduce((n, s) => n + s.entries.length, 0);
    },
    sections() {
      const enabled = new Set<CapabilityKey>(this.availableKeys);
      return INTRO_SECTIONS.map((section) => {
        const entries = section.entries.filter((entry) => !entry.featureKey || enabled.has(entry.featureKey));
        const screenshot = this.sectionScreenshot(section.screenshots, enabled);
        return {
          ...section,
          displayTitleKey: this.siteLoaded ? section.siteTitleKey : section.titleKey,
          entries: entries.map((entry) => ({
            ...entry,
            icon: entry.icon ?? (entry.featureKey ? CAPABILITY_ICONS[entry.featureKey] : undefined)
          })),
          subtitle: this.siteLoaded ? entries.map((entry) => entry.name).join(' · ') : this.$t(section.subtitleKey),
          bulletKeys: section.bullets
            .filter((bullet) => {
              if (bullet.catalogOnly && this.siteLoaded) return false;
              return !bullet.featureKeys || bullet.featureKeys.some((key) => enabled.has(key));
            })
            .map((bullet) => bullet.key),
          desktop: screenshot ? this.pick(screenshot.desktop) : undefined,
          mobile: screenshot?.mobile ? this.pick(screenshot.mobile) : undefined
        };
      })
        .filter((section) => section.entries.length > 0)
        .map((section) => ({
          ...section,
          // The section's default destination may itself be disabled; fall back
          // to the first entry that survived filtering.
          path: section.entries.some((e) => e.path === section.path)
            ? section.path
            : (section.entries.find((e) => e.path)?.path ?? section.path)
        }));
    },
    firstSectionKey(): string | undefined {
      return this.sections[0]?.key;
    },
    // Lead with chat when the site has it; otherwise borrow the first surviving
    // section's matching shot. Never fall back to a disabled capability.
    heroDesktop(): string | undefined {
      return this.sections.find((s) => s.key === 'chat')?.desktop ?? this.sections.find((s) => s.desktop)?.desktop;
    },
    heroMobile(): string | undefined {
      return this.sections.find((s) => s.key === 'chat')?.mobile ?? this.sections.find((s) => s.mobile)?.mobile;
    },
    connectorShot(): string {
      return this.pick(INTRO_SHOTS.connectorsDesktop);
    }
  },
  methods: {
    pick(source: ILocalizedImage): string {
      return this.isChineseLocale ? source.zh : source.en;
    },
    sectionScreenshot(
      screenshots: Partial<Record<CapabilityKey, IIntroScreenshot>>,
      enabled: Set<CapabilityKey>
    ): IIntroScreenshot | undefined {
      for (const key of CAPABILITY_KEYS) {
        if (enabled.has(key) && screenshots[key]) return screenshots[key];
      }
      return undefined;
    },
    onStart() {
      this.$router.push(getDefaultRoute());
    },
    open(path: string) {
      this.$router.push(path);
    },
    scrollTo(id: string) {
      const app = document.getElementById('app');
      const target = document.getElementById(id);
      if (!app || !target) return;
      const headerHeight = document.querySelector<HTMLElement>('.header')?.offsetHeight ?? 0;
      app.scrollTop = target.offsetTop - headerHeight;
    }
  }
});
</script>

<style lang="scss" scoped>
.intro {
  --intro-ink: var(--el-text-color-primary);
  --intro-muted: var(--el-text-color-secondary);
  --intro-accent: var(--el-color-primary);
  color: var(--intro-ink);
  background: var(--el-bg-color);
}

.intro-loading {
  min-height: calc(100vh - 140px);
  display: grid;
  place-items: center;
  background: var(--app-gradient-hero);

  &__pulse {
    width: 42px;
    height: 42px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    animation: intro-spin 0.9s linear infinite;
  }
}

@keyframes intro-spin {
  to {
    transform: rotate(360deg);
  }
}

.container {
  width: min(1220px, calc(100% - 48px));
  margin: 0 auto;
}

.macbook-frame {
  position: relative;
  padding: 0 3.5%;
  filter: drop-shadow(0 24px 28px rgba(5, 12, 20, 0.24));

  &__lid {
    position: relative;
    z-index: 1;
    padding: 2.6% 2.2% 0;
    border: 1px solid #3c434d;
    border-radius: 18px 18px 3px 3px;
    background: linear-gradient(145deg, #11161d 0%, #050709 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 -14px 22px rgba(0, 0, 0, 0.35);
  }

  &__camera {
    position: absolute;
    top: 1.2%;
    left: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #1b2730;
    box-shadow: 0 0 0 1px #020304;
    transform: translateX(-50%);
  }

  &__viewport {
    overflow: hidden;
    border-radius: 11px 11px 2px 2px;
    background: #05070a;

    img {
      display: block;
      width: 100%;
      height: auto;
      border: 0;
      background: transparent;
      object-fit: contain;
    }
  }

  &__chin {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 12px;
  }

  &__base {
    position: relative;
    z-index: 2;
    width: 107.5%;
    height: 18px;
    margin-top: -1px;
    margin-left: -3.75%;
    border-radius: 2px 2px 14px 14px;
    background: linear-gradient(180deg, #d7d9dc 0%, #9ca1a7 38%, #575e66 72%, #c9ccd0 100%);
    box-shadow:
      inset 0 1px rgba(255, 255, 255, 0.85),
      0 5px 8px rgba(0, 0, 0, 0.24);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 18%;
      height: 46%;
      border-radius: 0 0 8px 8px;
      background: linear-gradient(180deg, #737a82, #b8bcc1);
      transform: translateX(-50%);
    }

    span {
      position: absolute;
      top: 0;
      left: 50%;
      width: 16%;
      height: 2px;
      background: rgba(255, 255, 255, 0.5);
      transform: translateX(-50%);
    }
  }
}

.phone-device {
  position: relative;
  padding: 9px 7px 12px;
  border: 1px solid #3d4248;
  border-radius: 32px;
  background: linear-gradient(145deg, #151a20, #030405);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 22px 48px rgba(5, 12, 20, 0.34);

  &__speaker {
    position: absolute;
    z-index: 3;
    top: 5px;
    left: 50%;
    width: 18%;
    height: 3px;
    border-radius: 9999px;
    background: #272d34;
    transform: translateX(-50%);
  }

  &__screen {
    position: relative;
    overflow: hidden;
    border-radius: 23px;
    background: #05070a;

    img {
      display: block;
      width: 100%;
      height: auto;
      border: 0;
      background: transparent;
      object-fit: contain;
    }
  }

  &__island {
    position: absolute;
    z-index: 2;
    top: 8px;
    left: 50%;
    width: 34%;
    height: 13px;
    border-radius: 9999px;
    background: #020304;
    transform: translateX(-50%);
  }
}

.eyebrow,
.story-kicker {
  color: var(--intro-accent);
  font-size: 13px;
  line-height: 1.4;
  font-weight: 800;
  text-transform: uppercase;
}

.eyebrow {
  display: inline-flex;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 9999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);

  &--light {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--intro-accent);
  }
}

.hero {
  position: relative;
  overflow: hidden;
  background: var(--app-gradient-hero);

  &__grid {
    position: absolute;
    inset: 0;
    opacity: 0.5;
    background-image: radial-gradient(rgba(var(--app-brand-rgb), 0.18) 1px, transparent 1px);
    background-size: 32px 32px;
    mask-image: linear-gradient(to bottom, #000 20%, transparent 92%);
  }

  &__content {
    position: relative;
    z-index: 1;
    padding: 84px 0 0;
    text-align: center;
  }

  h1 {
    max-width: 940px;
    margin: 20px auto 16px;
    font-size: 60px;
    line-height: 1.08;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(135deg, #fff 0%, #93b8c3 52%, #689caa 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__summary {
    max-width: 720px;
    margin: 0 auto 32px;
    color: rgba(255, 255, 255, 0.75);
    font-size: 18px;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;

    .el-button:not(.el-button--primary) {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 56px;
    margin: 48px 0 0;

    dt {
      margin-bottom: 6px;
      color: #fff;
      font-size: 30px;
      font-weight: 800;
    }

    dd {
      margin: 0;
      color: rgba(255, 255, 255, 0.65);
      font-size: 13px;
    }
  }

  &__screens {
    position: relative;
    max-width: 940px;
    margin: 60px auto 0;
    padding-bottom: 40px;
  }

  &__mobile {
    position: absolute;
    z-index: 3;
    right: -12px;
    bottom: 0;
    width: 17%;
  }
}

.section {
  padding: 104px 0;
  scroll-margin-top: 76px;
}

.capability {
  &--alt {
    background: var(--app-bg-surface);
  }

  &__head {
    max-width: 820px;
    margin: 0 auto 56px;
    text-align: center;

    h2 {
      margin: 12px 0 16px;
      font-size: 40px;
      line-height: 1.18;
    }

    p {
      margin: 0;
      color: var(--intro-muted);
      font-size: 17px;
      line-height: 1.8;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.6fr);
    align-items: center;
    gap: 56px;

    &--reverse {
      grid-template-columns: minmax(260px, 0.6fr) minmax(0, 1.4fr);

      .capability__copy {
        order: -1;
      }
    }

    &--copy-only {
      display: block;

      .capability__copy {
        max-width: 760px;
        margin: 0 auto;
        text-align: center;
      }

      .feature-points {
        display: inline-block;
        text-align: left;
      }
    }
  }

  &__copy {
    .el-button {
      margin-top: 8px;
    }
  }
}

.screen-pair {
  position: relative;

  &--with-phone {
    padding-right: 6%;
  }

  &__mobile {
    position: absolute;
    z-index: 3;
    right: -2%;
    bottom: -6%;
    width: 19%;
  }
}

.feature-points {
  margin: 0 0 20px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
    color: var(--intro-muted);
    font-size: 15px;
    line-height: 1.7;

    svg {
      flex: none;
      margin-top: 5px;
      color: var(--intro-accent);
    }
  }
}

// Flex + centered wrapping rather than a grid: card counts (3, 6, 7, 10) rarely
// divide evenly into the column count, and an auto-fill grid leaves the last row
// with a single orphaned card. Centering makes a short last row look deliberate.
.model-grid {
  --model-grid-active-columns: var(--model-grid-columns);
  --model-grid-gap: 18px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--model-grid-gap);
  width: 100%;
  max-width: calc(
    var(--model-grid-active-columns) * 228px + (var(--model-grid-active-columns) - 1) * var(--model-grid-gap)
  );
  margin: 64px auto 0;
}

.model-card {
  flex: 0 1
    calc((100% - (var(--model-grid-active-columns) - 1) * var(--model-grid-gap)) / var(--model-grid-active-columns));
  min-width: 0;
  padding: 24px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 18px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 24px rgba(8, 18, 28, 0.04);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--intro-accent) 36%, var(--app-border-subtle));
    box-shadow: 0 16px 36px rgba(8, 18, 28, 0.1);
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: 14px;
  }

  &__logo {
    flex: none;
    display: grid;
    place-items: center;
    width: 46px;
    height: 46px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--intro-accent) 20%, var(--app-border-subtle));
    border-radius: 50%;
    background: color-mix(in srgb, var(--el-bg-color) 90%, var(--intro-accent));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 5px 14px rgba(5, 14, 24, 0.12);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 750;
    line-height: 1.25;
  }

  p {
    margin: 0;
    color: var(--intro-muted);
    font-size: 14px;
    line-height: 1.7;
  }
}

.connector-section {
  background: var(--app-bg-surface);
}

.final-cta {
  padding: 96px 0;
  background: var(--app-gradient-hero);

  &__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 32px;

    h2 {
      margin: 12px 0 14px;
      font-size: 38px;
      line-height: 1.2;
      color: #fff;
    }

    p {
      margin: 0;
      max-width: 620px;
      color: rgba(255, 255, 255, 0.72);
      font-size: 16px;
      line-height: 1.8;
    }
  }

  .story-kicker {
    color: #fff;
    opacity: 0.75;
  }
}

@media (max-width: 1100px) {
  .capability__body,
  .capability__body--reverse {
    grid-template-columns: minmax(0, 1fr);

    .capability__copy {
      order: 0;
    }
  }

  .model-grid {
    --model-grid-active-columns: var(--model-grid-columns-tablet);
  }
}

@media (max-width: 768px) {
  .container {
    width: calc(100% - 32px);
  }

  .hero {
    &__content {
      padding-top: 56px;
    }

    h1 {
      font-size: 36px;
    }

    &__summary {
      font-size: 16px;
    }

    &__stats {
      gap: 28px;

      dt {
        font-size: 24px;
      }
    }

    &__mobile {
      display: none;
    }
  }

  .section {
    padding: 64px 0;
  }

  .capability__head h2 {
    font-size: 28px;
  }

  .screen-pair__mobile {
    display: none;
  }

  .screen-pair--with-phone {
    padding-right: 0;
  }

  .model-grid {
    --model-grid-active-columns: var(--model-grid-columns-mobile);
    --model-grid-gap: 12px;
    max-width: 100%;
    margin-top: 40px;
  }

  .model-card {
    padding: 18px;

    &__heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    &__logo {
      width: 42px;
      height: 42px;
    }
  }

  .final-cta h2 {
    font-size: 28px;
  }
}
</style>
