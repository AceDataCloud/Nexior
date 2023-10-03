<template>
  <div class="page"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMain, ElAside, ElButton, ElDrawer } from 'element-plus';
import LeftNavigator from '@/components/common/LeftNavigator.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Introduction from '@/components/conversation/Introduction.vue';
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
export default defineComponent({
  name: 'ChatIndex',
  components: {},
  data() {
    return {
      model: 'chatgpt',
      drawer: false,
      question: ''
    };
  }
});
</script>

<style lang="scss" scoped>
.page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  .left {
    display: none;
    width: 300px;
    height: 100%;
  }
  .main {
    flex: 1;
    overflow: hidden;
    position: relative;
  }
}
</style>
