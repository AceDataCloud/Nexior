<template>
  <div class="sidebar">
    <div class="top">
      <div v-for="(link, linkIndex) in links" :key="linkIndex" class="link">
        <el-button class="button" @click="$router.push(link.route)">
          <font-awesome-icon :icon="link.icon" />
        </el-button>
      </div>
    </div>
    <div class="bottom"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_INDEX, ROUTE_PAINT_INDEX } from '@/router/constants';

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
          icon: 'fa-regular fa-comment'
        },
        {
          route: {
            name: ROUTE_PAINT_INDEX
          },
          icon: 'fa-solid fa-palette'
        }
      ]
    };
  }
});
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  .top {
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
        &:hover,
        &:focus {
          background-color: var(--el-button-hover-bg-color);
        }
      }
    }
  }
  .bottom {
    display: flex;
    flex-direction: column;
  }
}
</style>
