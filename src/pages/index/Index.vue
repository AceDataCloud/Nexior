<template>
  <div class="wrapper">
    <div id="banner">
      <div class="container">
        <el-row>
          <el-col :md="12" :xs="24" class="left">
            <div class="info">
              <span class="badge-new">{{ $t('index.badge.hero') }}</span>
              <h1 class="title">
                {{ site?.title }}
              </h1>
              <h3 class="subtitle">
                {{ $t('index.subtitle.banner') }}
              </h3>
              <p class="tagline">{{ $t('index.subtitle.hero') }}</p>
              <div class="operations">
                <el-button type="primary" round class="btn-apply" @click="onStart">
                  {{ $t('common.button.startForFree') }}
                </el-button>
                <el-button round class="btn-explore" @click="scrollToServices">
                  {{ $t('index.button.explore') }}
                </el-button>
              </div>
            </div>
          </el-col>
          <el-col :md="12" :xs="24" class="right">
            <el-image
              src="https://cdn.acedata.cloud/illustration1.png"
              class="brand"
              :alt="site?.title"
              fit="contain"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="introduction">
      <div class="container">
        <el-row class="mb-6">
          <el-col :span="24">
            <h2 class="title">
              {{ $t('index.title.introduction') }}
            </h2>
            <h5 class="subtitle">
              {{ $t('index.subtitle.introduction') }}
            </h5>
          </el-col>
        </el-row>
        <el-row :gutter="15">
          <el-col
            v-for="(capability, capabilityIndex) in capabilities"
            :key="capabilityIndex"
            :md="6"
            :xs="24"
            class="mb-4"
          >
            <el-card class="info text-center" shadow="hover" @click="onClickCapability(capability)">
              <div class="icon-wrapper">
                <font-awesome-icon :icon="capability.icon" class="icon" />
              </div>
              <h2 class="title">{{ capability.title }}</h2>
              <p class="subtitle">{{ capability.subtitle }}</p>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.chatgpt?.enabled" id="chat" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://cdn.acedata.cloud/axynds.png"
              class="image desktop"
              :alt="$t('index.title.chat')"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://cdn.acedata.cloud/vds4i3.png"
              class="image mobile"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </el-col>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.chat') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.chat') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/chatgpt'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.midjourney?.enabled" id="midjourney" class="block">
      <div class="container">
        <el-row>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.midjourney') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.midjourney') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/midjourney'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://cdn.acedata.cloud/uk86mz.png"
              class="image desktop"
              :alt="$t('index.title.midjourney')"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://cdn.acedata.cloud/rvelwm.png"
              class="image mobile"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.qrart?.enabled" id="qrart" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://cdn.acedata.cloud/gyogar.png"
              class="image desktop"
              :alt="$t('index.title.qrart')"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://cdn.acedata.cloud/5kunm0.png"
              class="image mobile"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </el-col>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.qrart') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.qrart') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/qrart'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.suno?.enabled" id="suno" class="block">
      <div class="container">
        <el-row>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.suno') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.suno') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/suno'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://cdn.acedata.cloud/2m8fn.png"
              class="image desktop"
              :alt="$t('index.title.suno')"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://cdn.acedata.cloud/23knvs.png"
              class="image mobile"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.luma?.enabled" id="luma" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://cdn.acedata.cloud/6kop1g.png"
              class="image desktop"
              :alt="$t('index.title.luma')"
              loading="lazy"
              decoding="async"
            />
            <img
              src="https://cdn.acedata.cloud/3kcjny.png"
              class="image mobile"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </el-col>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.luma') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.luma') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/luma'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="false" id="comments">
      <div class="container">
        <el-row class="mb-6">
          <el-col :span="24">
            <h2 class="title">
              {{ $t('index.title.comments') }}
            </h2>
            <h5 class="subtitle">
              {{ $t('index.subtitle.comments') }}
            </h5>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="main">
          <el-col v-for="(comment, commentIndex) in comments" :key="commentIndex" :md="8" :xs="24">
            <el-card shadow="hover" class="service" :body-style="{ padding: 0 }">
              <p class="content">
                {{ comment.content }}
              </p>
              <div class="info">
                <div class="left">
                  <el-image class="avatar" :src="comment.avatar" />
                </div>
                <div class="right">
                  <div class="name">{{ comment.name }}</div>
                  <div class="job">
                    {{ comment.job }}
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="models" class="models">
      <div class="container">
        <h2 class="section-title">{{ $t('index.title.models') }}</h2>
        <h5 class="section-subtitle">{{ $t('index.subtitle.models') }}</h5>
        <div class="model-wall">
          <span v-for="(model, modelIndex) in models" :key="modelIndex" class="model-chip">{{ model }}</span>
        </div>
      </div>
    </div>
    <div id="cta" class="cta">
      <div class="container">
        <h2 class="cta__title">{{ $t('index.title.cta') }}</h2>
        <p class="cta__subtitle">{{ $t('index.subtitle.cta') }}</p>
        <el-button type="primary" round class="cta__btn" @click="onStart">
          {{ $t('common.button.startForFree') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElImage, ElRow, ElCol, ElCard } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface ICategory {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  path: string;
}

interface IData {
  comments: any[];
  models: string[];
}

// Each capability card represents a whole category (chat / image / music /
// video). `features` is an ordered list of [feature flag, route path]: the
// first flag enabled on the site becomes the card's target, and a category
// with nothing enabled is hidden. This keeps the grid aligned with whatever
// services the (white-label) site actually exposes.
const CATEGORY_FEATURES: Array<{
  key: string;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  features: Array<[string, string]>;
}> = [
  {
    key: 'chat',
    titleKey: 'index.title.chat',
    subtitleKey: 'index.subtitle.chat',
    icon: 'fa-regular fa-comment',
    features: [['chatgpt', '/chatgpt']]
  },
  {
    key: 'image',
    titleKey: 'index.title.midjourney',
    subtitleKey: 'index.subtitle.midjourney',
    icon: 'fa-solid fa-palette',
    features: [
      ['midjourney', '/midjourney'],
      ['nanobanana', '/nanobanana'],
      ['seedream', '/seedream'],
      ['flux', '/flux'],
      ['openaiimage', '/openai-image'],
      ['qrart', '/qrart']
    ]
  },
  {
    key: 'music',
    titleKey: 'index.title.suno',
    subtitleKey: 'index.subtitle.suno',
    icon: 'fa-solid fa-music',
    features: [
      ['suno', '/suno'],
      ['producer', '/producer']
    ]
  },
  {
    key: 'video',
    titleKey: 'index.title.luma',
    subtitleKey: 'index.subtitle.luma',
    icon: 'fa-solid fa-film',
    features: [
      ['luma', '/luma'],
      ['veo', '/veo'],
      ['sora', '/sora'],
      ['kling', '/kling'],
      ['hailuo', '/hailuo'],
      ['seedance', '/seedance']
    ]
  }
];

export default defineComponent({
  name: 'Index',
  components: {
    ElButton,
    ElRow,
    ElCol,
    ElCard,
    ElImage,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      comments: [
        {
          avatar: 'https://cdn.acedata.cloud/avatar1.png',
          name: this.$t('index.customers.name1'),
          job: this.$t('index.customers.job1'),
          content: this.$t('index.customers.comment1')
        },
        {
          avatar: 'https://cdn.acedata.cloud/avatar2.png',
          name: this.$t('index.customers.name2'),
          job: this.$t('index.customers.job2'),
          content: this.$t('index.customers.comment2')
        },
        {
          avatar: 'https://cdn.acedata.cloud/avatar3.png',
          name: this.$t('index.customers.name3'),
          job: this.$t('index.customers.job3'),
          content: this.$t('index.customers.comment3')
        }
      ],
      models: [
        'ChatGPT',
        'Claude',
        'Gemini',
        'Grok',
        'DeepSeek',
        'Kimi',
        'Midjourney',
        'Flux',
        'Nano Banana',
        'Seedream',
        'GPT Image',
        'Suno',
        'Veo',
        'Sora',
        'Kling',
        'Luma',
        'Hailuo',
        'Seedance'
      ]
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    capabilities(): ICategory[] {
      const features = (this.site?.features ?? {}) as Record<string, { enabled?: boolean } | undefined>;
      const cards: ICategory[] = [];
      for (const category of CATEGORY_FEATURES) {
        const match = category.features.find(([flag]) => features[flag]?.enabled);
        if (!match) {
          continue;
        }
        cards.push({
          key: category.key,
          title: this.$t(category.titleKey),
          subtitle: this.$t(category.subtitleKey),
          icon: category.icon,
          path: match[1]
        });
      }
      return cards;
    },
    // Landing CTAs send guests to the first enabled service so the button
    // never dead-ends on a disabled feature.
    primaryPath(): string {
      return this.capabilities[0]?.path ?? '/chatgpt';
    }
  },
  methods: {
    onClickCapability(capability: ICategory) {
      this.$router.push(capability.path);
    },
    onStart() {
      this.$router.push({ path: this.primaryPath });
    },
    scrollToServices() {
      document.getElementById('introduction')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  background-color: var(--el-bg-color);

  .title {
    font-size: 40px;
    text-align: center;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--el-text-color-primary);
  }

  .subtitle {
    font-size: 18px;
    line-height: 32px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }
}

.container {
  margin: auto;
  max-width: 1200px;
  padding: 0 24px;
}

.block {
  padding: 100px 0;

  .preview {
    position: relative;

    .image {
      border-radius: 16px;
      padding: 4px;
      background-color: var(--app-bg-surface);
      box-shadow: var(--app-shadow-md);
      transition:
        box-shadow 0.3s ease,
        transform 0.3s ease;

      &:hover {
        box-shadow: var(--app-shadow-lg);
        transform: translateY(-2px);
      }

      &.desktop {
        max-width: 100%;
        max-height: 100%;
      }

      &.mobile {
        width: 30%;
        position: absolute;
        right: -5%;
        top: 10%;
      }
    }
  }

  .info {
    padding: 20px 40px;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .title {
      font-size: 36px;
      color: var(--el-text-color-primary);
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 17px;
      padding: 0 16px;
      color: var(--el-text-color-secondary);
      margin-bottom: 24px;
      line-height: 28px;
    }

    .btn-try {
      padding: 20px 48px;
      font-size: 16px;
      line-height: 20px;
      font-weight: 600;
      border-radius: 9999px;
    }
  }
}

#banner {
  padding: 80px 0 60px;
  background: var(--app-gradient-hero);
  position: relative;
  overflow: hidden;

  /* Subtle grid pattern */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(var(--app-brand-rgb), 0.15) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.5;
    pointer-events: none;
  }

  .left {
    position: relative;
    z-index: 1;

    .info {
      @media (max-width: 767px) {
        padding: 0 24px;
      }

      h1.title {
        font-size: 56px;
        font-weight: 800;
        margin-bottom: 24px;
        text-align: left;
        letter-spacing: -0.03em;
        color: #ffffff;
        background: linear-gradient(135deg, #ffffff 0%, #93b8c3 50%, #689caa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      h3.subtitle {
        font-size: 22px;
        line-height: 36px;
        margin-bottom: 48px;
        text-align: left;
        color: rgba(255, 255, 255, 0.8);
      }

      .operations {
        .btn-apply {
          padding: 20px 48px;
          font-size: 17px;
          line-height: 20px;
          font-weight: 600;
          border-radius: 9999px;
          box-shadow: var(--app-glow-primary-lg);
          transition:
            box-shadow 0.3s ease,
            transform 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 50px rgba(var(--app-brand-rgb), 0.4);
          }
        }
      }
    }
  }

  .right {
    position: relative;
    z-index: 1;

    @media (max-width: 767px) {
      padding: 40px 20px 0 20px;
    }

    .brand {
      max-width: 100%;
      height: auto;
      filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
    }
  }
}

#introduction {
  padding: 80px 0;
  background: var(--app-bg-section);

  @media (max-width: 767px) {
    padding: 60px 0;
  }

  .container {
    cursor: pointer;
  }

  .info {
    padding: 24px;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-4px);
    }

    .title {
      font-size: 18px;
      font-weight: 600;
    }

    .subtitle {
      font-size: 14px;
      line-height: 24px;
      color: var(--el-text-color-secondary);
    }

    .icon-wrapper {
      background: var(--el-color-primary-light-9);
      width: 52px;
      height: 52px;
      border-radius: 14px;
      padding: 10px;
      text-align: center;
      line-height: 42px;
      margin: 10px auto 16px auto;
      box-shadow: var(--app-glow-primary);
      transition: box-shadow 0.25s ease;

      .icon {
        font-size: 24px;
        color: var(--el-color-primary);
      }
    }
  }
}

#introduction,
#midjourney,
#suno {
  background: var(--app-bg-section);
}

#comments {
  padding: 80px 0;
  background: var(--el-bg-color-page);

  .main {
    @media (max-width: 767px) {
      padding: 0 24px;
    }
  }

  .el-card {
    padding: 40px 32px;
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;

    &:hover {
      transform: translateY(-4px);
    }

    @media (max-width: 767px) {
      margin-bottom: 16px;
    }

    .content {
      font-size: 15px;
      line-height: 26px;
      color: var(--el-text-color-secondary);
      margin-bottom: 20px;
    }

    .info {
      overflow: hidden;

      .left,
      .right {
        float: left;
      }

      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        margin-right: 12px;
        display: block;
      }

      .name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--el-text-color-regular);
      }

      .job {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

/* Hero additions (badge / tagline / secondary CTA) */
#banner .left .info {
  .badge-new {
    display: inline-block;
    margin-bottom: 20px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(6px);
  }

  .tagline {
    font-size: 16px;
    line-height: 26px;
    margin: -28px 0 40px;
    text-align: left;
    color: rgba(255, 255, 255, 0.65);
  }

  .operations {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    .btn-explore {
      padding: 20px 40px;
      font-size: 16px;
      line-height: 20px;
      font-weight: 600;
      border-radius: 9999px;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.28);
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.45);
        color: #ffffff;
        transform: translateY(-2px);
      }
    }
  }

  @media (max-width: 767px) {
    .badge-new {
      display: block;
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
    }

    .tagline {
      text-align: center;
    }

    .operations {
      justify-content: center;
    }
  }
}

/* Model wall */
.models {
  padding: 90px 0;
  background: var(--el-bg-color);
  text-align: center;

  @media (max-width: 767px) {
    padding: 64px 0;
  }

  .section-title {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--el-text-color-primary);
  }

  .section-subtitle {
    font-size: 17px;
    line-height: 28px;
    margin: 12px 0 40px;
    color: var(--el-text-color-secondary);
  }

  .model-wall {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    max-width: 900px;
    margin: 0 auto;
  }

  .model-chip {
    padding: 10px 20px;
    border-radius: 9999px;
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    background: var(--app-bg-surface);
    border: 1px solid var(--app-border-subtle);
    box-shadow: var(--app-shadow-xs);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: var(--el-color-primary);
      box-shadow: var(--app-glow-primary);
    }
  }
}

/* Final call-to-action */
.cta {
  padding: 100px 0;
  background: var(--app-gradient-hero);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(var(--app-brand-rgb), 0.18) 1px, transparent 1px);
    background-size: 32px 32px;
    opacity: 0.4;
    pointer-events: none;
  }

  .container {
    position: relative;
    z-index: 1;
  }

  .cta__title {
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .cta__subtitle {
    font-size: 18px;
    line-height: 30px;
    margin: 16px 0 36px;
    color: rgba(255, 255, 255, 0.75);
  }

  .cta__btn {
    padding: 22px 56px;
    font-size: 17px;
    line-height: 20px;
    font-weight: 600;
    border-radius: 9999px;
    box-shadow: var(--app-glow-primary-lg);
    transition:
      transform 0.2s ease,
      box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 50px rgba(var(--app-brand-rgb), 0.4);
    }
  }

  @media (max-width: 767px) {
    padding: 72px 24px;

    .cta__title {
      font-size: 30px;
    }
  }
}
</style>
