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
          v-for="(link, linkIndex) in links"
          :key="linkIndex"
          :class="{ link: true, active: $route.name === link.name }"
          @click="onNavigate(link)"
        >
          <span class="icon">
            <font-awesome-icon :icon="link.icon" class="text-sm" />
          </span>
          <span class="text">{{ link.text }}</span>
          <span class="outer">
            <font-awesome-icon
              v-if="!link.name && link.href"
              icon="fa-solid fa-up-right-from-square"
              class="text-sm ml-2"
            />
          </span>
          <span class="suffix"> </span>
        </a>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  ROUTE_CONSOLE_ADMIN_APPLICATION,
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_ORDER_LIST,
  ROUTE_INDEX
} from '@/router';
import { ElRow, ElCol } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getAuthBaseUrl } from '@/utils';

interface ILink {
  key: string;
  text: string;
  name?: string;
  href?: string;
  icon: string;
  admin?: boolean;
}

export default defineComponent({
  name: 'Navigator',
  components: {
    ElRow,
    ElCol,
    FontAwesomeIcon
  },
  computed: {
    active() {
      return this.$route.matched[0].path;
    },
    user() {
      return this.$store.getters.user;
    },
    links(): ILink[] {
      let commonLinks: ILink[] = [
        {
          key: 'profile',
          text: this.$t('console.menu.userProfile'),
          href: `${getAuthBaseUrl()}/user/profile`,
          icon: 'fa-regular fa-user'
        },
        {
          key: 'verify',
          text: this.$t('console.menu.idVerify'),
          href: `${getAuthBaseUrl()}/user/verify`,
          icon: 'fa-regular fa-id-card'
        },
        {
          key: 'application-list',
          text: this.$t('console.menu.applicationList'),
          name: ROUTE_CONSOLE_APPLICATION_LIST,
          icon: 'fa-solid fa-cube'
        },
        {
          key: 'order-list',
          text: this.$t('console.menu.orderList'),
          name: ROUTE_CONSOLE_ORDER_LIST,
          icon: 'fa-solid fa-store'
        }
      ];
      let adminLinks: ILink[] = [
        {
          key: 'admin-application',
          text: this.$t('console.menu.manageApplication'),
          name: ROUTE_CONSOLE_ADMIN_APPLICATION,
          icon: 'fa-solid fa-cubes'
        }
      ];
      if (this.user.is_superuser) {
        return [...commonLinks, ...adminLinks];
      }
      return commonLinks;
    }
  },
  mounted() {},
  methods: {
    onHome() {
      this.$router.push({
        name: ROUTE_INDEX
      });
    },
    onNavigate(link: ILink) {
      if (link.name) {
        this.$router.push({
          name: link.name
        });
      } else if (link.href) {
        window.open(link.href, '_blank');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.logo {
  width: 100%;
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
