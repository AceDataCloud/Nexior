<template>
  <div class="page">
    <div class="left">3</div>
    <div class="right">
      <introduction />
      <div class="input-wrapper">

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMain, ElAside, ElButton, ElDrawer } from 'element-plus';
import LeftNavigator from '@/components/common/LeftNavigator.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Introduction from '@/components/conversation/Introduction.vue';
export default defineComponent({
  name: 'ChatIndex',
  components: {
    Introduction
  },
  data() {
    return {
      drawer: false
    };
  }
});
</script>

<style lang="scss">
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    width: 300px;
    height: 100%;
  }
  .main {
    flex: 1;
  }
}
</style>
