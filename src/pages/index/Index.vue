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
              <dt>Web · iOS · Android</dt>
              <dd>{{ $t('index.stat.platforms') }}</dd>
            </div>
          </dl>
        </div>
        <div class="hero__screens" aria-hidden="true">
          <img :src="chatDesktop" class="hero__desktop" alt="" />
          <img :src="chatMobile" class="hero__mobile" alt="" />
          <div class="hero__note hero__note--top">
            <font-awesome-icon icon="fa-solid fa-wand-magic-sparkles" />
            <span>{{ $t('index.note.allInOne') }}</span>
          </div>
          <div class="hero__note hero__note--bottom">
            <font-awesome-icon icon="fa-solid fa-globe" />
            <span>{{ $t('index.note.customDomain') }}</span>
          </div>
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
          :key="item.key"
          class="platform-story"
          :class="{ 'platform-story--reverse': itemIndex % 2 === 1 }"
        >
          <div class="platform-story__copy">
            <span class="story-number">0{{ itemIndex + 1 }}</span>
            <p class="story-kicker">{{ $t(item.eyebrowKey) }}</p>
            <h3>{{ $t(item.titleKey) }}</h3>
            <p>{{ $t(item.subtitleKey) }}</p>
            <el-button type="primary" plain @click="openShowcase(item)">
              {{ $t(item.buttonKey) }}
              <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </el-button>
          </div>
          <div class="screen-pair screen-pair--large">
            <img :src="item.desktop" class="screen-pair__desktop" :alt="$t(item.titleKey)" loading="lazy" />
            <img :src="item.mobile" class="screen-pair__mobile" alt="" loading="lazy" />
          </div>
        </article>
      </div>
    </section>

    <section class="section creation-section">
      <div class="container">
        <div class="section-heading">
          <span class="eyebrow eyebrow--light">{{ $t('index.eyebrow.creation') }}</span>
          <h2>{{ $t('index.title.creation') }}</h2>
          <p>{{ $t('index.subtitle.creation') }}</p>
        </div>

        <div class="creation-grid">
          <article v-for="item in creationShowcases" :key="item.key" class="creation-item">
            <div class="screen-pair">
              <img :src="item.desktop" class="screen-pair__desktop" :alt="$t(item.titleKey)" loading="lazy" />
              <img :src="item.mobile" class="screen-pair__mobile" alt="" loading="lazy" />
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
import { isMainOfficial } from '@/utils';

import capabilitiesDesktop from '@/assets/home/capabilities-desktop.png';
import capabilitiesMobile from '@/assets/home/capabilities-mobile.png';
import chatDesktop from '@/assets/home/chat-desktop.png';
import chatMobile from '@/assets/home/chat-mobile.png';
import codingDesktop from '@/assets/home/coding-desktop.png';
import codingMobile from '@/assets/home/coding-mobile.png';
import distributionDesktop from '@/assets/home/distribution-desktop.png';
import distributionMobile from '@/assets/home/distribution-mobile.png';
import imageDesktop from '@/assets/home/image-desktop.png';
import imageMobile from '@/assets/home/image-mobile.png';
import musicDesktop from '@/assets/home/music-desktop.png';
import musicMobile from '@/assets/home/music-mobile.png';
import subsitesDesktop from '@/assets/home/subsites-desktop.png';
import subsitesMobile from '@/assets/home/subsites-mobile.png';
import videoDesktop from '@/assets/home/video-desktop.png';
import videoMobile from '@/assets/home/video-mobile.png';
import workflowDesktop from '@/assets/home/workflow-desktop.png';
import workflowMobile from '@/assets/home/workflow-mobile.png';

interface IShowcase {
  key: string;
  featureKeys?: string[];
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  buttonKey: string;
  path: string;
  desktop: string;
  mobile: string;
}

const BUSINESS_SHOWCASES: IShowcase[] = [
  {
    key: 'subsites',
    eyebrowKey: 'index.eyebrow.subsites',
    titleKey: 'index.title.subsites',
    subtitleKey: 'index.subtitle.subsites',
    buttonKey: 'index.button.createSubsite',
    path: '/chatgpt?dialog=settings&tab=subsites',
    desktop: subsitesDesktop,
    mobile: subsitesMobile
  },
  {
    key: 'capabilities',
    eyebrowKey: 'index.eyebrow.capabilities',
    titleKey: 'index.title.capabilities',
    subtitleKey: 'index.subtitle.capabilities',
    buttonKey: 'index.button.configure',
    path: '/chatgpt?dialog=settings&tab=function',
    desktop: capabilitiesDesktop,
    mobile: capabilitiesMobile
  },
  {
    key: 'distribution',
    eyebrowKey: 'index.eyebrow.distribution',
    titleKey: 'index.title.distribution',
    subtitleKey: 'index.subtitle.distribution',
    buttonKey: 'index.button.viewDistribution',
    path: '/distribution',
    desktop: distributionDesktop,
    mobile: distributionMobile
  }
];

const CREATION_SHOWCASES: IShowcase[] = [
  {
    key: 'chat',
    featureKeys: ['chatgpt', 'grok', 'gemini', 'claude', 'deepseek', 'kimi', 'serp'],
    eyebrowKey: 'index.eyebrow.chat',
    titleKey: 'index.title.chat',
    subtitleKey: 'index.subtitle.chat',
    buttonKey: 'index.button.try',
    path: '/chatgpt',
    desktop: chatDesktop,
    mobile: chatMobile
  },
  {
    key: 'image',
    featureKeys: ['midjourney', 'qrart', 'flux', 'headshots', 'nanobanana', 'openaiimage', 'seedream'],
    eyebrowKey: 'index.eyebrow.image',
    titleKey: 'index.title.image',
    subtitleKey: 'index.subtitle.image',
    buttonKey: 'index.button.try',
    path: '/nanobanana',
    desktop: imageDesktop,
    mobile: imageMobile
  },
  {
    key: 'video',
    featureKeys: ['luma', 'pika', 'kling', 'veo', 'sora', 'pixverse', 'hailuo', 'seedance', 'grokvideo', 'wan'],
    eyebrowKey: 'index.eyebrow.video',
    titleKey: 'index.title.video',
    subtitleKey: 'index.subtitle.video',
    buttonKey: 'index.button.try',
    path: '/kling',
    desktop: videoDesktop,
    mobile: videoMobile
  },
  {
    key: 'music',
    featureKeys: ['suno', 'producer', 'fish'],
    eyebrowKey: 'index.eyebrow.music',
    titleKey: 'index.title.music',
    subtitleKey: 'index.subtitle.music',
    buttonKey: 'index.button.try',
    path: '/suno',
    desktop: musicDesktop,
    mobile: musicMobile
  },
  {
    key: 'workflow',
    featureKeys: ['maestro', 'digitalhuman'],
    eyebrowKey: 'index.eyebrow.workflow',
    titleKey: 'index.title.workflow',
    subtitleKey: 'index.subtitle.workflow',
    buttonKey: 'index.button.try',
    path: '/maestro',
    desktop: workflowDesktop,
    mobile: workflowMobile
  },
  {
    key: 'coding',
    featureKeys: ['codingBridge'],
    eyebrowKey: 'index.eyebrow.coding',
    titleKey: 'index.title.coding',
    subtitleKey: 'index.subtitle.coding',
    buttonKey: 'index.button.try',
    path: '/coding-bridge',
    desktop: codingDesktop,
    mobile: codingMobile
  }
];

export default defineComponent({
  name: 'Index',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      chatDesktop,
      chatMobile
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    enabledFeatures(): Record<string, { enabled?: boolean } | undefined> {
      return (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
    },
    isMainSite(): boolean {
      return this.site?.origin === 'studio.acedata.cloud' || isMainOfficial();
    },
    capabilityCount(): number {
      return this.site?.id ? this.capabilityCards.length : CAPABILITY_KEYS.length;
    },
    businessShowcases(): IShowcase[] {
      return BUSINESS_SHOWCASES.filter((item) => item.key !== 'subsites' || this.isMainSite);
    },
    creationShowcases(): IShowcase[] {
      return CREATION_SHOWCASES.filter((item) => item.featureKeys?.some((key) => this.enabledFeatures[key]?.enabled));
    },
    capabilityCards(): Array<{ key: CapabilityKey; label: string; icon: string }> {
      return CAPABILITY_KEYS.filter((key) => this.enabledFeatures[key]?.enabled).map((key) => ({
        key,
        label: this.$t(`site.field.features${key.charAt(0).toUpperCase()}${key.slice(1)}`),
        icon: CAPABILITY_ICONS[key]
      }));
    }
  },
  methods: {
    onStart() {
      this.$router.push(this.creationShowcases[0]?.path ?? '/');
    },
    openShowcase(item: IShowcase) {
      this.$router.push(item.path);
    },
    openSubsites() {
      this.$router.push('/chatgpt?dialog=settings&tab=subsites');
    },
    scrollToPlatform() {
      const app = document.getElementById('app');
      const platform = document.getElementById('platform');
      if (!app || !platform) return;
      const headerHeight = document.querySelector<HTMLElement>('.header')?.offsetHeight ?? 0;
      app.scrollTop = platform.offsetTop - headerHeight;
    }
  }
});
</script>

<style lang="scss" scoped>
.landing {
  --landing-ink: #172033;
  --landing-muted: #5d687a;
  --landing-teal: #19778a;
  --landing-coral: #e66a4e;
  --landing-lime: #8aa344;
  color: var(--landing-ink);
  background: #f7f8fa;
}

.container {
  width: min(1220px, calc(100% - 48px));
  margin: 0 auto;
}

.hero {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  background: linear-gradient(125deg, #f8fbfb 0%, #edf5f3 56%, #fff4ef 100%);
  border-bottom: 1px solid #dce5e4;

  &__grid {
    position: absolute;
    inset: 0;
    opacity: 0.45;
    background-image:
      linear-gradient(rgba(23, 119, 138, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23, 119, 138, 0.1) 1px, transparent 1px);
    background-size: 42px 42px;
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
  }

  &__headline {
    max-width: 620px;
    margin: 0;
    font-size: 30px;
    line-height: 1.35;
    font-weight: 700;
  }

  &__summary {
    max-width: 590px;
    margin: 20px 0 32px;
    color: var(--landing-muted);
    font-size: 17px;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .el-button:not(.el-button--primary) {
      color: var(--landing-ink);
      border-color: #70808c;
      background: rgba(255, 255, 255, 0.72);
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: 0.72fr 0.72fr 1.56fr;
    gap: 0;
    margin: 44px 0 0;
    padding: 22px 0 0;
    border-top: 1px solid #cbd8d6;

    div {
      padding-right: 18px;
    }

    dt {
      margin-bottom: 6px;
      color: var(--landing-ink);
      font-size: 20px;
      font-weight: 750;
    }

    dd {
      margin: 0;
      color: var(--landing-muted);
      font-size: 13px;
      line-height: 1.5;
    }
  }

  &__screens {
    position: relative;
    min-height: 520px;
  }

  &__desktop,
  &__mobile {
    display: block;
    object-fit: cover;
    object-position: top left;
    border: 1px solid #c8d5d4;
    background: #fff;
    box-shadow: 0 28px 70px rgba(30, 57, 68, 0.18);
  }

  &__desktop {
    width: 92%;
    aspect-ratio: 16 / 10;
  }

  &__mobile {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 29%;
    aspect-ratio: 390 / 844;
  }

  &__note {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 1px solid #cddcda;
    border-radius: 8px;
    color: var(--landing-ink);
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 12px 30px rgba(30, 57, 68, 0.14);
    font-size: 13px;
    font-weight: 650;

    svg {
      color: var(--landing-coral);
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
  color: var(--landing-teal);
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
  border-radius: 4px;
  background: #e8f3f3;

  &--light {
    border: 0;
    padding: 0;
    background: transparent;
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
  background: #fff;
}

.platform-story {
  display: grid;
  grid-template-columns: minmax(320px, 0.76fr) minmax(0, 1.24fr);
  align-items: center;
  gap: 72px;
  padding: 76px 0;
  border-top: 1px solid #e0e6e8;

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
      color: var(--landing-teal);
      border-color: #8eb8c0;
      background: #fff;
    }
  }
}

.screen-pair {
  position: relative;
  min-height: 360px;
  padding: 18px 58px 58px 0;

  &--large {
    min-height: 440px;
  }

  &__desktop,
  &__mobile {
    display: block;
    object-fit: cover;
    object-position: top left;
    border: 1px solid #d8dfe3;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 24px 55px rgba(38, 51, 68, 0.15);
  }

  &__desktop {
    width: 100%;
    aspect-ratio: 16 / 10;
  }

  &__mobile {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 25%;
    aspect-ratio: 390 / 844;
  }
}

.creation-section {
  background: #f0f3f4;
}

.creation-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.creation-item {
  overflow: hidden;
  border: 1px solid #dbe2e5;
  border-radius: 8px;
  background: #fff;

  .screen-pair {
    min-height: 300px;
    padding: 0 50px 44px 0;
    background: #e8edef;

    &__desktop {
      border-width: 0 1px 1px 0;
      border-radius: 0 0 6px;
      box-shadow: none;
    }

    &__mobile {
      right: 12px;
      bottom: 12px;
      box-shadow: 0 16px 36px rgba(38, 51, 68, 0.2);
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
      color: var(--landing-coral);
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
    color: var(--landing-teal);
    background: transparent;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
}

.capability-section {
  background: #fffaf6;
  border-top: 1px solid #efe3dc;
}

.capability-directory {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid #ddded8;
  border-left: 1px solid #ddded8;
}

.capability-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding: 18px;
  border-right: 1px solid #ddded8;
  border-bottom: 1px solid #ddded8;
  background: rgba(255, 255, 255, 0.6);

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
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px), #172033;
  background-size: 42px 42px;

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
      min-height: 330px;
      padding-bottom: 20px;
    }

    &__desktop {
      width: 100%;
    }

    &__mobile {
      right: 8px;
      width: 31%;
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
    padding: 54px 0;

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
    min-height: 260px;
    padding: 0 40px 40px 0;

    &__mobile {
      width: 28%;
    }
  }

  .creation-grid {
    grid-template-columns: 1fr;
  }

  .creation-item {
    .screen-pair {
      min-height: 245px;
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
