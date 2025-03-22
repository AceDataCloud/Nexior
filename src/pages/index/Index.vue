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
    <div v-if="site?.features?.chat?.enabled" id="chat" class="block">
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
        ...(this.site?.features?.chat?.enabled
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
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
  .subtitle {
    font-size: 20px;
    line-height: 40px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }
}
.container {
  margin: auto;
  max-width: 1200px;
}

.block {
  padding: 150px 0;
  .preview {
    position: relative;
    .image {
      border-radius: 10px;
      padding: 5px;
      background-color: white;
      box-shadow: var(--el-box-shadow-light);
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
    padding: 20px 60px;
    text-align: center;
    .title {
      font-size: 40px;
      color: var(--el-text-color-primary);
    }
    .subtitle {
      font-size: 20px;
      padding: 0 20px;
      color: var(--el-text-color-secondary);
      margin-bottom: 20px;
    }
    .btn-try {
      padding: 25px 62px;
      font-size: 20px;
      line-height: 20px;
      font-weight: 700;
      border-radius: 50px;
    }
  }
}

#banner {
  padding: 50px 0;
  .left {
    .info {
      @media (max-width: 767px) {
        padding: 0 50px 0 50px;
      }
      h1.title {
        font-size: 60px;
        font-weight: bold;
        margin-bottom: 50px;
        text-align: left;
        // -webkit-text-fill-color: transparent;
        // background-clip: text;
        // background-image: linear-gradient(90deg, #277186, #7752ff 40%, #5f98fa 60%, #44beff);
      }
      h3.subtitle {
        font-size: 30px;
        line-height: 40px;
        margin-bottom: 70px;
        text-align: left;
        color: var(--el-text-color-primary);
      }
      .operations {
        .btn-apply {
          padding: 25px 62px;
          font-size: 20px;
          line-height: 20px;
          font-weight: 700;
          border-radius: 50px;
        }
      }
    }
  }

  .right {
    @media (max-width: 767px) {
      padding: 50px 20px 0 20px;
    }
    .brand {
      max-width: 100%;
      height: auto;
    }
  }
}

#introduction {
  padding: 100px 0;
  @media (max-width: 767px) {
    padding: 100px 20px;
  }
  .container {
    cursor: pointer;
  }
  .info {
    .title {
      font-size: 20px;
    }
    .subtitle {
      font-size: 16px;
      line-height: 30px;
      color: var(--el-text-color-secondary);
    }
    .icon-wrapper {
      background: var(--el-bg-color-page);
      width: 50px;
      height: 50px;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
      line-height: 40px;
      margin: 10px auto 20px auto;
      .icon {
        font-size: 25px;
        color: var(--el-color-primary);
      }
    }
  }
}

#introduction,
#midjourney,
#suno {
  background: #f5f7fa;
}

.dark {
  #introduction,
  #midjourney,
  #suno {
    background: #1e1e1e;
  }
}

#comments {
  padding: 100px 0;
  background: var(--el-bg-color-page);

  .main {
    @media (max-width: 767px) {
      padding: 0 50px 0 50px;
    }
  }
  .el-card {
    padding: 50px 40px;
    @media (max-width: 767px) {
      margin-bottom: 15px;
    }
    .content {
      font-size: 16px;
      line-height: 28px;
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
        width: 60px;
        height: 60px;
        border-radius: 50%;
        margin-right: 15px;
        display: block;
      }
      .name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
        color: var(--el-text-color-regular);
      }
      .job {
        font-size: 16px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
