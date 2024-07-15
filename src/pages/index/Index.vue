<template>
  <div class="wrapper">
    <div id="banner">
      <div class="container">
        <el-row>
          <el-col :md="12" :xs="24" class="left">
            <div class="info">
              <h1 class="title">
                {{ $t('index.title.banner') }}
              </h1>
              <h3 class="subtitle">
                {{ $t('index.subtitle.banner') }}
              </h3>
              <div class="operations">
                <el-button type="primary" round class="btn-apply">
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
    <div id="chat" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img src="https://cdn.acedata.cloud/6qnk2o.png" class="image desktop" />
            <img src="https://cdn.acedata.cloud/rgyads.png" class="image mobile" />
          </el-col>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.chat') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.chat') }}</p>
            <el-button type="primary" round class="btn-try">
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="midjourney" class="block">
      <div class="container">
        <el-row>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.midjourney') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.midjourney') }}</p>
            <el-button type="primary" round class="btn-try">
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://camo.githubusercontent.com/923bcdf733181c64cff8b3fc1da7ef2798be8584e1885a627fad632ac7654a48/68747470733a2f2f63646e2e616365646174612e636c6f75642f3879386b666f2e706e67"
              class="image desktop"
            />
            <img
              src="https://camo.githubusercontent.com/c553461cc48e163b5fcf22ac2205e9dc2ed486b31eca4e2b1ab30939e41349e1/68747470733a2f2f63646e2e616365646174612e636c6f75642f6277313171392e706e67"
              class="image mobile"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="qrart" class="block">
      <div class="container">
        <el-row>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://camo.githubusercontent.com/d1f1f752ffb9a7baa195db4403ad889ed77bc3c9d846da1eb796493dab2bd661/68747470733a2f2f63646e2e616365646174612e636c6f75642f71336976616e2e706e67"
              class="image desktop"
            />
            <img
              src="https://camo.githubusercontent.com/cbe8abf65cbf75179a83e8a2e37657af5844c2e61887c5d497fb164fe88a7a31/68747470733a2f2f63646e2e616365646174612e636c6f75642f6c31316562762e706e67"
              class="image mobile"
            />
          </el-col>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.qrart') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.qrart') }}</p>
            <el-button type="primary" round class="btn-try">
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="suno" class="block">
      <div class="container">
        <el-row>
          <el-col :md="8" :xs="24" class="info">
            <h2 class="title">{{ $t('index.title.suno') }}</h2>
            <p class="subtitle">{{ $t('index.subtitle.suno') }}</p>
            <el-button type="primary" round class="btn-try">
              {{ $t('index.button.try') }}
            </el-button>
          </el-col>
          <el-col :md="16" :xs="24" class="preview">
            <img
              src="https://camo.githubusercontent.com/923bcdf733181c64cff8b3fc1da7ef2798be8584e1885a627fad632ac7654a48/68747470733a2f2f63646e2e616365646174612e636c6f75642f3879386b666f2e706e67"
              class="image desktop"
            />
            <img
              src="https://camo.githubusercontent.com/c553461cc48e163b5fcf22ac2205e9dc2ed486b31eca4e2b1ab30939e41349e1/68747470733a2f2f63646e2e616365646174612e636c6f75642f6277313171392e706e67"
              class="image mobile"
            />
          </el-col>
        </el-row>
      </div>
    </div>
    <div id="comments">
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
    ElImage
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
  mounted() {},
  methods: {}
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
    font-size: 14px;
    line-height: 40px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }
}
.container {
  margin: auto;
  max-width: 1200px;
  padding: 100px 0;
}

.block {
  .preview {
    position: relative;
    .image {
      border-radius: 10px;
      padding: 5px;
      background-color: var(--el-bg-color);
      box-shadow: var(--el-box-shadow-light);
      &.desktop {
        max-width: 100%;
        max-height: 100%;
      }
      &.mobile {
        width: 30%;
        position: absolute;
        right: -5%;
        top: 30%;
      }
    }
  }
  .info {
    padding: 20px 80px;
    text-align: center;
    .title {
      font-size: 40px;
      color: var(--el-text-color-primary);
    }
    .subtitle {
      font-size: 24px;
      color: var(--el-text-color-secondary);
    }
    .btn-try {
      padding: 25px 62px;
      font-size: 20px;
      line-height: 20px;
      font-weight: 700;
    }
  }
}

#banner {
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
        color: var(--el-text-color-primary);
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

#chat,
#qrart {
  background: linear-gradient(90deg, #ebe7ff, #f2faff 53%, #e0f5fe);
  // background-image: url(https://cdn.acedata.cloud/kbyc78.png);
  // background-size: cover;
  // background-repeat: no-repeat;
}

#chat {
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://cdn.acedata.cloud/weu38f.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  }
}

#comments {
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
        margin-right: 10px;
        display: block;
      }
      .name {
        font-size: 18px;
        font-weight: bold;
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
