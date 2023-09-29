<template>
  <div class="sidebar">
    
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CHAT_INDEX } from '@/router/constants';

export default defineComponent({
  name: 'Sidebar',
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
          icon: 'fa-question'
        },
        {
          route: {
            name: 'midjourney-index'
          },
          icon: 'fa-question'
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
  align-items: flex-end;
  .top {
    display: flex;
    flex-direction: column;
  }
  .bottom {
    display: flex;
    flex-direction: column;
  }
}
</style>
