<template>
  <el-row class="mb-10">
    <el-col :span="24">
      <img src="@/assets/images/logo2.svg" class="logo" @click="onHome" />
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="24">
      <div class="links">
        <a
          v-for="link in links"
          :key="link.key"
          :class="{ link: true, active: $route.path == link.href }"
          @click="onClick(link.href)"
        >
          <span class="icon">
            <el-icon class="icon">
              <clock v-if="link.icon === 'clock'" />
              <user v-if="link.icon === 'user'" />
              <postcard v-if="link.icon === 'postcard'" />
            </el-icon>
          </span>
          <span class="text">{{ link.text }}</span>
          <span class="suffix"></span>
        </a>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Clock, MagicStick, Collection, VideoPlay, Goods, Loading, User, Postcard } from '@element-plus/icons-vue';

interface ILink {
  key: string;
  text: string;
  href: string;
  icon: string;
}

interface IData {
  links: ILink[];
}

export default defineComponent({
  name: 'Navigator',
  components: {
    Clock,
    Collection,
    MagicStick,
    VideoPlay,
    Goods,
    Loading,
    Postcard,
    User
  },
  data(): IData {
    return {
      links: [
        {
          key: 'profile',
          text: this.$t('console.menu.orderList'),
          href: '/console/orders',
          icon: 'user'
        },
        {
          key: 'verify',
          text: this.$t('console.menu.applicationList'),
          href: '/console/applications',
          icon: 'postcard'
        }
      ]
    };
  },
  computed: {
    active() {
      return this.$route.matched[0].path;
    }
  },
  mounted() {},
  methods: {
    onClick(link: string) {
      window.location.href = link;
    },
    onHome() {
      this.$router.push({
        name: 'home'
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.logo {
  width: 300px;
  height: 60px;
  cursor: pointer;
}

.avatar {
  display: block;
  margin: 30px auto 20px auto;
}

.nickname {
  display: block;
  margin: auto;
  margin-bottom: 20px;
  text-align: center;
}

.links {
  width: 100%;
  .link {
    $height: 40px;
    height: $height;
    display: block;
    // padding: 5px 8px;
    width: 100%;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 5px;
    position: relative;
    color: #444;
    line-height: $height;
    padding-left: 10px;
    .suffix {
      width: 3px;
      height: $height;
      // position: relative;
      // top: 2px;
      position: absolute;
      right: -20px;
      margin-right: 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .icon {
      width: 16px;
      height: 16px;
      display: inline-block;
      position: relative;
      margin-right: 10px;
      // top: -1px;
      transform: translateY(-2%);
    }
    .text {
      font-size: 14px;
    }
    &.active {
      .suffix {
        background-color: var(--el-color-primary);
      }
    }
    &:hover {
      background-color: #ebedf1;
    }
  }
}
</style>
