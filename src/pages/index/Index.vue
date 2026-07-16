<template>
  <div class="landing">
    <section class="hero">
      <div class="hero__grid" />
      <div class="container hero__content">
        <div class="hero__copy">
          <span class="eyebrow">{{ $t('index.badge.hero') }}</span>
          <h1>{{ site?.title }}</h1>
          <p class="hero__headline">{{ $t('index.subtitle.banner') }}</p>
          <p class="hero__summary">{{ $t('index.subtitle.hero') }}</p>
          <div class="hero__actions">
            <el-button type="primary" size="large" @click="onStart">
              {{ $t('common.button.startForFree') }}
            </el-button>
            <el-button size="large" @click="scrollToPlatform">
              {{ $t('index.button.explore') }}
            </el-button>
          </div>
          <dl class="hero__stats">
            <div>
              <dt>{{ capabilityCount }}+</dt>
              <dd>{{ $t('index.stat.capabilities') }}</dd>
            </div>
            <div>
              <dt>5 min</dt>
              <dd>{{ $t('index.stat.subsite') }}</dd>
            </div>
            <div>
              <dt>24%</dt>
              <dd>{{ $t('index.stat.commission') }}</dd>
            </div>
          </dl>
        </div>
        <div class="hero__screens">
          <div class="macbook-frame hero__desktop" aria-hidden="true">
            <div class="macbook-frame__lid">
              <span class="macbook-frame__camera" />
              <div class="macbook-frame__viewport">
                <img :src="heroDesktop" alt="" />
              </div>
              <div class="macbook-frame__chin" />
            </div>
            <div class="macbook-frame__base"><span /></div>
          </div>
          <div class="phone-device hero__mobile" aria-hidden="true">
            <span class="phone-device__speaker" />
            <div class="phone-device__screen">
              <span class="phone-device__island" />
              <img :src="heroMobile" alt="" />
            </div>
          </div>
          <button type="button" class="hero__note hero__note--top" @click="scrollToCreation">
            <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" />
            <span>{{ $t('index.note.allInOne') }}</span>
          </button>
          <button v-if="isMainSite" type="button" class="hero__note hero__note--bottom" @click="scrollToSubsites">
            <font-awesome-icon icon="fa-solid fa-globe" />
            <span>{{ $t('index.note.customDomain') }}</span>
          </button>
        </div>
      </div>
    </section>

    <section id="platform" class="section platform-section">
      <div class="container">
        <div class="section-heading section-heading--wide">
          <span class="eyebrow eyebrow--light">{{ $t('index.eyebrow.business') }}</span>
          <h2>{{ $t('index.title.business') }}</h2>
          <p>{{ $t('index.subtitle.business') }}</p>
        </div>

        <article
          v-for="(item, itemIndex) in businessShowcases"
          :id="item.key"
          :key="item.key"
          class="platform-story"
          :class="{ 'platform-story--reverse': itemIndex % 2 === 1 }"
        >
          <div class="platform-story__copy">
            <span class="story-number">0{{ itemIndex + 1 }}</span>
            <p class="story-kicker">{{ $t(item.eyebrowKey) }}</p>
            <h3>{{ $t(item.titleKey) }}</h3>
            <p>{{ $t(item.subtitleKey) }}</p>
            <ul class="feature-points">
              <li v-for="bulletKey in item.bulletKeys" :key="bulletKey">
                <font-awesome-icon icon="fa-solid fa-check" />
                <span>{{ $t(bulletKey) }}</span>
              </li>
            </ul>
            <el-button
              v-if="item.href"
              tag="a"
              type="primary"
              plain
              :href="item.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t(item.buttonKey) }}
              <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </el-button>
            <el-button v-else type="primary" plain @click="openShowcase(item)">
              {{ $t(item.buttonKey) }}
              <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </el-button>
          </div>
          <div class="screen-pair screen-pair--large">
            <div class="macbook-frame screen-pair__desktop">
              <div class="macbook-frame__lid">
                <span class="macbook-frame__camera" aria-hidden="true" />
                <div class="macbook-frame__viewport">
                  <img :src="item.desktop" :alt="$t(item.titleKey)" loading="lazy" />
                </div>
                <div class="macbook-frame__chin" />
              </div>
              <div class="macbook-frame__base"><span /></div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section id="creation" class="section creation-section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow eyebrow--light">{{ $t('index.eyebrow.creation') }}</span>
          <h2>{{ $t('index.title.creation') }}</h2>
          <p>{{ $t('index.subtitle.creation') }}</p>
        </div>

        <div class="creation-grid">
          <article v-for="item in creationShowcases" :key="item.key" class="creation-item">
            <div class="screen-pair" :class="{ 'screen-pair--with-phone': item.mobile }">
              <div class="macbook-frame screen-pair__desktop">
                <div class="macbook-frame__lid">
                  <span class="macbook-frame__camera" aria-hidden="true" />
                  <div class="macbook-frame__viewport">
                    <img :src="item.desktop" :alt="$t(item.titleKey)" loading="lazy" />
                  </div>
                  <div class="macbook-frame__chin" />
                </div>
                <div class="macbook-frame__base"><span /></div>
              </div>
              <div v-if="item.mobile" class="phone-device screen-pair__mobile">
                <span class="phone-device__speaker" aria-hidden="true" />
                <div class="phone-device__screen">
                  <span class="phone-device__island" aria-hidden="true" />
                  <img :src="item.mobile" alt="" loading="lazy" />
                </div>
              </div>
            </div>
            <div class="creation-item__copy">
              <div>
                <p class="story-kicker">{{ $t(item.eyebrowKey) }}</p>
                <h3>{{ $t(item.titleKey) }}</h3>
              </div>
              <font-awesome-icon icon="fa-solid fa-arrow-up-right-from-square" />
              <p>{{ $t(item.subtitleKey) }}</p>
              <button type="button" class="creation-item__link" @click="openShowcase(item)">
                {{ $t('index.button.try') }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section capability-section">
      <div class="container">
        <div class="section-heading section-heading--wide">
          <span class="eyebrow eyebrow--light">{{ $t('index.eyebrow.directory') }}</span>
          <h2>{{ $t('index.title.directory') }}</h2>
          <p>{{ $t('index.subtitle.directory') }}</p>
        </div>
        <div class="capability-directory">
          <div v-for="capability in capabilityCards" :key="capability.key" class="capability-row">
            <img :src="capability.icon" alt="" />
            <span>{{ capability.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="final-cta">
      <div class="container final-cta__content">
        <div>
          <p class="story-kicker">{{ $t('index.eyebrow.cta') }}</p>
          <h2>{{ $t('index.title.cta') }}</h2>
          <p>{{ $t('index.subtitle.cta') }}</p>
        </div>
        <div class="final-cta__actions">
          <el-button type="primary" size="large" @click="onStart">
            {{ $t('common.button.startForFree') }}
          </el-button>
          <el-button v-if="isMainSite" size="large" @click="openSubsites">
            {{ $t('index.button.createSubsite') }}
          </el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { CAPABILITY_ICONS, CAPABILITY_KEYS, type CapabilityKey } from '@/constants/capabilities';
import { getDefaultRoute } from '@/router';
import { isMainOfficial } from '@/utils';

interface ILocalizedImage {
  zh: string;
  en: string;
}

interface IShowcase {
  key: string;
  featureKeys?: string[];
  bulletKeys?: string[];
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  buttonKey: string;
  path: string;
  href?: string;
  desktop: ILocalizedImage;
  mobile?: ILocalizedImage;
}

interface IResolvedShowcase extends Omit<IShowcase, 'desktop' | 'mobile'> {
  desktop: string;
  mobile?: string;
}

const image = (zh: string, en: string): ILocalizedImage => ({ zh, en });
const STUDIO_OVERVIEW_URL = 'https://platform.acedata.cloud/documents/studio-overview';
const HOMEPAGE_EXCLUDED_CAPABILITIES = new Set<CapabilityKey>(['qrart', 'pika']);

const SCREENSHOTS = {
  auth: image('https://cdn.acedata.cloud/ae2dceaacc.png', 'https://cdn.acedata.cloud/61f717db6c.png'),
  branding: image('https://cdn.acedata.cloud/d54f145c5c.png', 'https://cdn.acedata.cloud/6d59646c4d.png'),
  capabilities: image('https://cdn.acedata.cloud/2369fa145f.png', 'https://cdn.acedata.cloud/082a69ca54.png'),
  digitalHumanDesktop: image('https://cdn.acedata.cloud/b9ee357c33.png', 'https://cdn.acedata.cloud/a0228b206a.png'),
  distributionDesktop: image('https://cdn.acedata.cloud/6c25c74a49.png', 'https://cdn.acedata.cloud/a1e62e4425.png'),
  klingDesktop: image('https://cdn.acedata.cloud/e45bc3e2e2.png', 'https://cdn.acedata.cloud/03d73b16ce.png'),
  klingMobile: image('https://cdn.acedata.cloud/10dc431467.png', 'https://cdn.acedata.cloud/ea10c8e395.png'),
  maestroDesktop: image('https://cdn.acedata.cloud/1791398216.png', 'https://cdn.acedata.cloud/7854458ee3.png'),
  nanoDesktop: image('https://cdn.acedata.cloud/82252ec647.png', 'https://cdn.acedata.cloud/e047aea679.png'),
  nanoMobile: image('https://cdn.acedata.cloud/c7da634c96.png', 'https://cdn.acedata.cloud/dc5b2cca1d.png'),
  subsites: image('https://cdn.acedata.cloud/bf4356fffc.png', 'https://cdn.acedata.cloud/b1948ec2a2.png'),
  sunoDesktop: image('https://cdn.acedata.cloud/8ce288065b.png', 'https://cdn.acedata.cloud/1eebf72e3a.png')
};

const BUSINESS_SHOWCASES: IShowcase[] = [
  {
    key: 'subsites',
    eyebrowKey: 'index.eyebrow.subsites',
    titleKey: 'index.title.subsites',
    subtitleKey: 'index.subtitle.subsites',
    buttonKey: 'index.button.learnBusiness',
    path: '/chatgpt?dialog=settings&tab=subsites',
    href: STUDIO_OVERVIEW_URL,
    desktop: SCREENSHOTS.subsites,
    bulletKeys: [
      'index.benefit.subsites.noServer',
      'index.benefit.subsites.customDomain',
      'index.benefit.subsites.branding'
    ]
  },
  {
    key: 'capabilities',
    eyebrowKey: 'index.eyebrow.capabilities',
    titleKey: 'index.title.capabilities',
    subtitleKey: 'index.subtitle.capabilities',
    buttonKey: 'index.button.learnBusiness',
    path: '/chatgpt?dialog=settings&tab=function',
    href: STUDIO_OVERVIEW_URL,
    desktop: SCREENSHOTS.capabilities,
    bulletKeys: [
      'index.benefit.capabilities.catalog',
      'index.benefit.capabilities.display',
      'index.benefit.capabilities.pricing'
    ]
  },
  {
    key: 'operations',
    eyebrowKey: 'index.eyebrow.operations',
    titleKey: 'index.title.operations',
    subtitleKey: 'index.subtitle.operations',
    buttonKey: 'index.button.learnBusiness',
    path: '/chatgpt?dialog=settings&tab=seo',
    href: STUDIO_OVERVIEW_URL,
    desktop: SCREENSHOTS.auth,
    bulletKeys: [
      'index.benefit.operations.seo',
      'index.benefit.operations.auth',
      'index.benefit.operations.localization'
    ]
  },
  {
    key: 'distribution',
    eyebrowKey: 'index.eyebrow.distribution',
    titleKey: 'index.title.distribution',
    subtitleKey: 'index.subtitle.distribution',
    buttonKey: 'index.button.learnBusiness',
    path: '/distribution',
    href: STUDIO_OVERVIEW_URL,
    desktop: SCREENSHOTS.distributionDesktop,
    bulletKeys: [
      'index.benefit.distribution.noBarrier',
      'index.benefit.distribution.levels',
      'index.benefit.distribution.withdrawal'
    ]
  }
];

const CREATION_SHOWCASES: IShowcase[] = [
  {
    key: 'image',
    featureKeys: ['nanobanana'],
    eyebrowKey: 'index.eyebrow.image',
    titleKey: 'index.title.image',
    subtitleKey: 'index.subtitle.image',
    buttonKey: 'index.button.try',
    path: '/nanobanana',
    desktop: SCREENSHOTS.nanoDesktop,
    mobile: SCREENSHOTS.nanoMobile
  },
  {
    key: 'music',
    featureKeys: ['suno'],
    eyebrowKey: 'index.eyebrow.music',
    titleKey: 'index.title.music',
    subtitleKey: 'index.subtitle.music',
    buttonKey: 'index.button.try',
    path: '/suno',
    desktop: SCREENSHOTS.sunoDesktop
  },
  {
    key: 'workflow',
    featureKeys: ['maestro'],
    eyebrowKey: 'index.eyebrow.workflow',
    titleKey: 'index.title.workflow',
    subtitleKey: 'index.subtitle.workflow',
    buttonKey: 'index.button.try',
    path: '/maestro',
    desktop: SCREENSHOTS.maestroDesktop
  },
  {
    key: 'digitalHuman',
    featureKeys: ['digitalhuman'],
    eyebrowKey: 'index.eyebrow.digitalHuman',
    titleKey: 'index.title.digitalHuman',
    subtitleKey: 'index.subtitle.digitalHuman',
    buttonKey: 'index.button.try',
    path: '/digital-human',
    desktop: SCREENSHOTS.digitalHumanDesktop
  }
];

export default defineComponent({
  name: 'Index',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {};
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    enabledFeatures(): Record<string, { enabled?: boolean } | undefined> {
      return (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
    },
    isMainSite(): boolean {
      const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
      const isOfficialPreview =
        hostname.endsWith('.plain-river-2dfc.workers.dev') &&
        this.site?.origin === hostname &&
        this.site?.title === 'Ace Data Cloud' &&
        this.site?.branding === null;
      return this.site?.origin === 'studio.acedata.cloud' || isMainOfficial() || isOfficialPreview;
    },
    capabilityCount(): number {
      return this.site?.id ? this.capabilityCards.length : CAPABILITY_KEYS.length;
    },
    isChineseLocale(): boolean {
      return String(this.$i18n.locale).toLowerCase() === 'zh-cn';
    },
    heroDesktop(): string {
      return this.localizedImage(SCREENSHOTS.klingDesktop);
    },
    heroMobile(): string {
      return this.localizedImage(SCREENSHOTS.klingMobile);
    },
    businessShowcases(): IResolvedShowcase[] {
      return BUSINESS_SHOWCASES.filter((item) => item.key !== 'subsites' || this.isMainSite).map((item) =>
        this.resolveShowcase(item)
      );
    },
    creationShowcases(): IResolvedShowcase[] {
      const showcases = this.isMainSite
        ? CREATION_SHOWCASES
        : CREATION_SHOWCASES.filter((item) => item.featureKeys?.some((key) => this.enabledFeatures[key]?.enabled));
      return showcases.map((item) => this.resolveShowcase(item));
    },
    capabilityCards(): Array<{ key: CapabilityKey; label: string; icon: string }> {
      const availableKeys = this.isMainSite
        ? CAPABILITY_KEYS
        : CAPABILITY_KEYS.filter((key) => this.enabledFeatures[key]?.enabled);
      const keys = availableKeys.filter((key) => !HOMEPAGE_EXCLUDED_CAPABILITIES.has(key));
      return keys.map((key) => ({
        key,
        label: this.$t(`site.field.features${key.charAt(0).toUpperCase()}${key.slice(1)}`),
        icon: CAPABILITY_ICONS[key]
      }));
    }
  },
  methods: {
    localizedImage(source: ILocalizedImage): string {
      return this.isChineseLocale ? source.zh : source.en;
    },
    resolveShowcase(item: IShowcase): IResolvedShowcase {
      return {
        ...item,
        desktop: this.localizedImage(item.desktop),
        mobile: item.mobile ? this.localizedImage(item.mobile) : undefined
      };
    },
    onStart() {
      this.$router.push(getDefaultRoute());
    },
    openShowcase(item: { path: string }) {
      this.$router.push(item.path);
    },
    openSubsites() {
      this.$router.push('/chatgpt?dialog=settings&tab=subsites');
    },
    scrollToPlatform() {
      this.scrollToSection('platform');
    },
    scrollToCreation() {
      this.scrollToSection('creation');
    },
    scrollToSubsites() {
      this.scrollToSection('subsites');
    },
    scrollToSection(id: string) {
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
.landing {
  --landing-ink: var(--el-text-color-primary);
  --landing-muted: var(--el-text-color-secondary);
  --landing-accent: var(--el-color-primary);
  color: var(--landing-ink);
  background: var(--el-bg-color);
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

    &::after {
      content: '';
      position: absolute;
      right: 5%;
      bottom: -3px;
      left: 5%;
      height: 3px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.28);
      filter: blur(2px);
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

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: -3px;
    width: 3px;
    border-radius: 2px 0 0 2px;
    background: #363c43;
  }

  &::before {
    top: 23%;
    height: 8%;
  }

  &::after {
    top: 34%;
    height: 13%;
  }

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

.hero {
  position: relative;
  min-height: 720px;
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
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(560px, 1.12fr);
    align-items: center;
    gap: 56px;
    min-height: 720px;
    padding-top: 60px;
    padding-bottom: 60px;
  }

  h1 {
    margin: 18px 0 14px;
    font-size: 64px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: 0;
    color: #fff;
    background: linear-gradient(135deg, #fff 0%, #93b8c3 50%, #689caa 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__headline {
    max-width: 620px;
    margin: 0;
    font-size: 30px;
    line-height: 1.35;
    font-weight: 700;
    color: #fff;
  }

  &__summary {
    max-width: 590px;
    margin: 20px 0 32px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 17px;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .el-button:not(.el-button--primary) {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: 0.72fr 0.72fr 1.56fr;
    gap: 0;
    margin: 44px 0 0;
    padding: 22px 0 0;
    border-top: 1px solid rgba(255, 255, 255, 0.2);

    div {
      padding-right: 18px;
    }

    dt {
      margin-bottom: 6px;
      color: #fff;
      font-size: 20px;
      font-weight: 750;
    }

    dd {
      margin: 0;
      color: rgba(255, 255, 255, 0.65);
      font-size: 13px;
      line-height: 1.5;
    }
  }

  &__screens {
    position: relative;
    min-height: 430px;
  }

  &__desktop {
    width: 92%;
  }

  &__mobile {
    position: absolute;
    z-index: 3;
    right: 0;
    bottom: 12px;
    width: 27%;
  }

  &__note {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 1px solid #cddcda;
    border-radius: 12px;
    color: #172033;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 12px 30px rgba(30, 57, 68, 0.14);
    font-size: 13px;
    font-family: inherit;
    font-weight: 650;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 34px rgba(30, 57, 68, 0.2);
    }

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 3px;
    }

    svg {
      color: var(--landing-accent);
    }

    &--top {
      top: -22px;
      right: 10px;
    }

    &--bottom {
      left: -20px;
      bottom: 38px;
    }
  }
}

.eyebrow,
.story-kicker {
  color: var(--landing-accent);
  font-size: 13px;
  line-height: 1.4;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0;
}

.eyebrow {
  display: inline-flex;
  padding: 7px 10px;
  border: 1px solid #9fc0c5;
  border-radius: 9999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);

  &--light {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--landing-accent);
  }
}

.section {
  padding: 112px 0;
}

.section-heading {
  max-width: 760px;
  margin: 0 auto 64px;
  text-align: center;

  &--wide {
    max-width: 860px;
  }

  h2 {
    margin: 12px 0 16px;
    font-size: 42px;
    line-height: 1.18;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: var(--landing-muted);
    font-size: 17px;
    line-height: 1.8;
  }
}

.platform-section {
  scroll-margin-top: 76px;
  background: var(--el-bg-color);
}

.platform-story {
  display: grid;
  grid-template-columns: minmax(320px, 0.76fr) minmax(0, 1.24fr);
  align-items: center;
  gap: 72px;
  padding: 76px 0;
  margin-bottom: 28px;
  padding: 64px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 16px;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-sm);

  &--reverse {
    grid-template-columns: minmax(0, 1.24fr) minmax(320px, 0.76fr);

    .platform-story__copy {
      order: 2;
    }
  }

  &__copy {
    .story-number {
      display: block;
      margin-bottom: 28px;
      color: #c9d1d8;
      font-size: 42px;
      font-weight: 800;
    }

    h3 {
      margin: 10px 0 16px;
      font-size: 34px;
      font-weight: 800;
      line-height: 1.25;
      letter-spacing: 0;
    }

    > p:not(.story-kicker) {
      margin: 0 0 28px;
      color: var(--landing-muted);
      font-size: 16px;
      line-height: 1.85;
    }

    .el-button svg {
      margin-left: 8px;
    }

    .el-button {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }
  }
}

.feature-points {
  display: grid;
  gap: 12px;
  margin: 0 0 28px;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--landing-muted);
    font-size: 14px;
    line-height: 1.7;

    svg {
      flex: 0 0 auto;
      margin-top: 5px;
      color: var(--el-color-success);
    }
  }
}

.screen-pair {
  position: relative;
  padding: 12px 0 24px;

  &--large {
    padding-bottom: 18px;
  }

  &__desktop {
    width: 100%;
  }

  &__mobile {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 27%;
  }

  &--with-phone {
    padding-right: 9%;
    padding-bottom: 8%;
  }
}

.creation-section {
  background: var(--app-bg-section);
}

.creation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.creation-item {
  overflow: hidden;
  border: 1px solid #dbe2e5;
  border-radius: 16px;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-sm);

  .screen-pair {
    padding: 18px 18px 28px;
    background: var(--el-fill-color-light);

    &__mobile {
      right: 10px;
      bottom: 10px;
    }

    &--with-phone {
      padding-right: 13%;
      padding-bottom: 12%;
    }
  }

  &__copy {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 28px;

    h3 {
      margin: 5px 0 0;
      font-size: 24px;
      line-height: 1.25;
      letter-spacing: 0;
    }

    > svg {
      color: var(--landing-accent);
    }

    > p {
      grid-column: 1 / -1;
      min-height: 58px;
      margin: 0;
      color: var(--landing-muted);
      font-size: 14px;
      line-height: 1.7;
    }
  }

  &__link {
    grid-column: 1 / -1;
    width: fit-content;
    padding: 0;
    border: 0;
    color: var(--landing-accent);
    background: transparent;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
}

.capability-section {
  background: var(--el-bg-color);
  border-top: 1px solid var(--app-border-subtle);
}

.capability-directory {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.capability-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--app-border-subtle);
  border-radius: 12px;
  background: var(--app-bg-surface);
  box-shadow: var(--app-shadow-xs);

  img {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    object-fit: contain;
  }

  span {
    overflow: hidden;
    font-size: 14px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.final-cta {
  padding: 92px 0;
  color: #fff;
  background: var(--app-gradient-hero);

  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 48px;
  }

  h2 {
    margin: 8px 0 12px;
    font-size: 38px;
    line-height: 1.2;
    letter-spacing: 0;
  }

  p:not(.story-kicker) {
    margin: 0;
    color: #c6ceda;
    font-size: 16px;
  }

  .story-kicker {
    margin: 0;
    color: #79c0cd;
  }

  .el-button:not(.el-button--primary) {
    color: #fff;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    gap: 12px;
  }
}

@media only screen and (max-width: 1024px) {
  .hero {
    &__content {
      grid-template-columns: 1fr;
      min-height: auto;
      padding-top: 84px;
    }

    &__copy {
      max-width: 760px;
    }

    &__screens {
      width: min(800px, 100%);
      min-height: 520px;
    }
  }

  .platform-story,
  .platform-story--reverse {
    grid-template-columns: 1fr;
    gap: 36px;

    .platform-story__copy {
      order: 0;
      max-width: 720px;
    }
  }

  .capability-directory {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media only screen and (max-width: 767px) {
  .container {
    width: min(100% - 32px, 1220px);
  }

  .hero {
    min-height: auto;

    &__content {
      gap: 42px;
      padding-top: 56px;
      padding-bottom: 48px;
    }

    h1 {
      font-size: 44px;
    }

    &__headline {
      font-size: 25px;
    }

    &__summary {
      font-size: 15px;
    }

    &__actions {
      .el-button {
        flex: 1 1 150px;
        margin-left: 0;
      }
    }

    &__stats {
      grid-template-columns: 1fr 1fr;
      row-gap: 18px;

      div:last-child {
        grid-column: 1 / -1;
      }
    }

    &__screens {
      min-height: 390px;
      padding-bottom: 20px;
    }

    &__desktop {
      width: 92%;
    }

    &__mobile {
      right: 0;
      bottom: 8px;
      width: 29%;
    }

    &__note {
      display: none;
    }
  }

  .section {
    padding: 76px 0;
  }

  .section-heading {
    margin-bottom: 42px;

    h2 {
      font-size: 32px;
    }

    p {
      font-size: 15px;
    }
  }

  .platform-story {
    padding: 36px 24px;

    &__copy {
      .story-number {
        margin-bottom: 20px;
        font-size: 34px;
      }

      h3 {
        font-size: 28px;
      }
    }
  }

  .screen-pair,
  .screen-pair--large {
    padding: 8px 0 14px;

    &__mobile {
      width: 30%;
    }

    &.screen-pair--with-phone {
      padding-right: 9%;
      padding-bottom: 10%;
    }
  }

  .creation-grid {
    grid-template-columns: 1fr;
  }

  .creation-item {
    .screen-pair {
      padding: 12px;

      &.screen-pair--with-phone {
        padding-right: 12%;
        padding-bottom: 14%;
      }
    }

    &__copy > p {
      min-height: 0;
    }
  }

  .capability-directory {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .capability-row {
    padding: 14px 12px;

    img {
      width: 28px;
      height: 28px;
    }

    span {
      font-size: 13px;
    }
  }

  .final-cta {
    padding: 68px 0;

    &__content {
      align-items: flex-start;
      flex-direction: column;
      gap: 28px;
    }

    h2 {
      font-size: 32px;
    }

    &__actions {
      width: 100%;
      flex-wrap: wrap;

      .el-button {
        flex: 1 1 150px;
        margin-left: 0;
      }
    }
  }
}
</style>
