<template>
  <div class="main">
    <el-menu v-if="repositoryId" :default-active="activeMenu" mode="horizontal" :ellipsis="false" class="menu">
      <div class="repository">
        <font-awesome-icon class="mr-2" :icon="['fas', 'book']" />
        <span>{{ repository?.name }}</span>
      </div>
      <el-menu-item
        v-for="(menuItem, menuItemIndex) in menuItems"
        :key="menuItemIndex"
        :index="menuItem.index"
        @click="onClickMenu(menuItem)"
      >
        {{ menuItem.title }}
      </el-menu-item>
    </el-menu>
    <div class="chatdoc">
      <slot name="chatdoc" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMenu, ElMenuItem } from 'element-plus';
import { ROUTE_CHATDOC_CONVERSATION_NEW, ROUTE_CHATDOC_MANAGE } from '@/router';
import { RouteLocationRaw } from 'vue-router';
import { IChatdocRepository } from '@/models';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface IMenuItem {
  index: string;
  title: string;
  route?: RouteLocationRaw;
}

interface IData {
  repositoryId: string;
  drawer: boolean;
  menuItems: IMenuItem[];
}

export default defineComponent({
  name: 'LayoutChatdoc',
  components: {
    ElMenu,
    ElMenuItem,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      repositoryId: this.$route.params?.repositoryId?.toString(),
      drawer: false,
      menuItems: [
        {
          index: 'chat',
          title: this.$t('chatdoc.nav.chat'),
          route: {
            name: ROUTE_CHATDOC_CONVERSATION_NEW
          }
        },
        /*
        {
          index: 'setting',
          title: this.$t('chatdoc.nav.setting'),
          route: {
            name: ROUTE_CHATDOC_SETTING
          }
        },
        */
        {
          index: 'manage',
          title: this.$t('chatdoc.nav.manage'),
          route: {
            name: ROUTE_CHATDOC_MANAGE
          }
        }
      ]
    };
  },
  computed: {
    activeMenu() {
      // @ts-ignore
      const filterResult = this.menuItems.filter((menuItem) => menuItem.route?.name === this.$route.name);
      if (filterResult) {
        return filterResult[0]?.index;
      }
      return undefined;
    },
    repository(): IChatdocRepository | undefined {
      return this.$store.state?.chatdoc?.repositories?.find((repository) => repository.id === this.repositoryId);
    }
  },
  async mounted() {
    await this.getService();
    await this.onGetApplications();
    await this.onGetRepositories();
  },
  methods: {
    async getService() {
      await this.$store.dispatch('chatdoc/getService');
    },
    async onGetApplications() {
      await this.$store.dispatch('chatdoc/getApplications');
    },
    async onGetRepositories() {
      await this.$store.dispatch('chatdoc/getRepositories');
    },
    async onClickMenu(menuItem: IMenuItem) {
      this.activeMenu = menuItem.index;
      if (menuItem.route) {
        await this.$router.push({
          // @ts-ignore
          ...menuItem.route,
          params: {
            id: this.repositoryId
          }
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;

  .repository {
    position: absolute;
    left: 50px;
    top: 20px;
    font-weight: bold;
  }

  .menu {
    width: 100%;
    justify-content: center;
  }

  .chatdoc {
    height: 100%;
    width: 100%;
  }
}
</style>
