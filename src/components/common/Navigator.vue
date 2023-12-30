<template>
  <div class="sidebar">
    <div class="top">
      <div v-for="(link, linkIndex) in links" :key="linkIndex" class="link">
        <el-button
          :class="{
            button: true,
            active: link.routes.includes($route.name as string)
          }"
          @click="$router.push(link.route)"
        >
          <font-awesome-icon :icon="link.icon" />
        </el-button>
      </div>
    </div>
    <div class="middle"></div>
    <div class="bottom">
      <div class="link">
        <el-button class="button" @click="onLogout">
          <font-awesome-icon icon="fa-solid fa-arrow-right-from-bracket" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  ROUTE_AUTH_LOGIN,
  ROUTE_CHAT_CONVERSATION,
  ROUTE_CHAT_CONVERSATION_NEW,
  ROUTE_CHAT_INDEX,
  ROUTE_MIDJOURNEY_HISTORY,
  ROUTE_MIDJOURNEY_INDEX
} from '@/router/constants';

export default defineComponent({
  name: 'Navigator',
  components: {
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      links: [
        {
          route: {
            name: ROUTE_CHAT_INDEX
          },
          icon: 'fa-regular fa-comment',
          routes: [ROUTE_CHAT_INDEX, ROUTE_CHAT_CONVERSATION, ROUTE_CHAT_CONVERSATION_NEW]
        },
        {
          route: {
            name: ROUTE_MIDJOURNEY_INDEX
          },
          icon: 'fa-solid fa-palette',
          routes: [ROUTE_MIDJOURNEY_INDEX, ROUTE_MIDJOURNEY_HISTORY]
        }
      ]
    };
  },
  methods: {
    onLogout() {
      console.debug('logout');
      this.$store.dispatch('common/resetToken');
      this.$router.push({ name: ROUTE_AUTH_LOGIN });
    }
  }
});
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;

  .top,
  .bottom {
    display: flex;
    flex-direction: column;
    padding-top: 10px;
    .link {
      width: 40px;
      height: 40px;
      margin-bottom: 10px;
      .button {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: none;
        background-color: var(--el-bg-color-page);
        &.active,
        &:hover,
        &:focus {
          background-color: var(--el-button-hover-bg-color);
          color: var(--el-button-active-text-color);
        }
      }
    }
  }
  .bottom {
    display: block;
    position: absolute;
    bottom: 0;
  }
}
</style>
