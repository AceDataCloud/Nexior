<template>
  <div class="wrapper">
    <div id="banner">
      <div class="container">
        <el-row>
          <el-col :md="12" :xs="24" class="left">
            <div class="info">
              <h1 class="title">
                {{ site?.title }}
              </h1>
              <h3 class="subtitle">
                {{ $t('index.subtitle.banner') }}
              </h3>
              <div class="operations">
                <el-button
                  type="primary"
                  round
                  class="btn-apply"
                  @click="
                    $router.push({
                      path: '/chat'
                    })
                  "
                >
                  {{ $t('common.button.startForFree') }}
                </el-button>
              </div>
            </div>
          </el-col>
          <el-col :md="12" :xs="24" class="right">
            <el-image src="https://cdn.acedata.cloud/illustration1.png" class="brand" />
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
            <img src="https://cdn.acedata.cloud/axynds.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/vds4i3.png" class="image mobile" />
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
                  path: '/chat'
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
            <img src="https://cdn.acedata.cloud/uk86mz.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/rvelwm.png" class="image mobile" />
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.qrart?.enabled" id="qrart" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img src="https://cdn.acedata.cloud/gyogar.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/5kunm0.png" class="image mobile" />
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
            <img src="https://cdn.acedata.cloud/2m8fn.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/23knvs.png" class="image mobile" />
          </el-col>
        </el-row>
      </div>
    </div>
    <div v-if="site?.features?.luma?.enabled" id="luma" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img src="https://cdn.acedata.cloud/6kop1g.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/3kcjny.png" class="image mobile" />
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
    <div v-if="site?.features?.headshots?.enabled" id="headshots" class="block">
      <div class="container">
        <el-row>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.headshots') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.headshots') }}</p>
            <el-button
              type="primary"
              round
              class="btn-try"
              @click="
                $router.push({
                  path: '/headshots'
                })
              "
            >
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
          <el-col :md="16" :xs="24" class="preview">
            <img src="https://cdn.acedata.cloud/zlyshj.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/8as0cx.png" class="image mobile" />
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElImage, ElRow, ElCol, ElCard } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IData {
  comments: any[];
}

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
      ]
    };
  },
  computed: {
    site() {
      return this.$store.state.site;
    },
    capabilities() {
      return [
        ...(this.site?.features?.chatgpt?.enabled
          ? [
              {
                title: this.$t('index.title.chat'),
                subtitle: this.$t('index.subtitle.chat'),
                icon: 'fa-regular fa-comment',
                path: '/chat'
              }
            ]
          : []),
        ...(this.site?.features?.midjourney?.enabled
          ? [
              {
                title: this.$t('index.title.midjourney'),
                subtitle: this.$t('index.subtitle.midjourney'),
                icon: 'fa-solid fa-palette',
                path: '/midjourney'
              }
            ]
          : []),
        ...(this.site?.features?.qrart?.enabled
          ? [
              {
                title: this.$t('index.title.qrart'),
                subtitle: this.$t('index.subtitle.qrart'),
                icon: 'fa-solid fa-qrcode',
                path: '/qrart'
              }
            ]
          : []),
        ...(this.site?.features?.suno?.enabled
          ? [
              {
                title: this.$t('index.title.suno'),
                subtitle: this.$t('index.subtitle.suno'),
                icon: 'fa-solid fa-music',
                path: '/suno'
              }
            ]
          : []),
        ...(this.site?.features?.luma?.enabled
          ? [
              {
                title: this.$t('index.title.luma'),
                subtitle: this.$t('index.subtitle.luma'),
                icon: 'fa-solid fa-film',
                path: '/luma'
              }
            ]
          : []),
        ...(this.site?.features?.headshots?.enabled
          ? [
              {
                title: this.$t('index.title.headshots'),
                subtitle: this.$t('index.subtitle.headshots'),
                icon: 'fa-solid fa-id-card',
                path: '/headshots'
              }
            ]
          : [])
      ];
    }
  },
  mounted() {},
  methods: {
    onClickCapability(capability: any) {
      this.$router.push(capability.path);
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
    background-image: radial-gradient(rgba(39, 113, 134, 0.15) 1px, transparent 1px);
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
            box-shadow: 0 0 50px rgba(39, 113, 134, 0.4);
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
</style>
