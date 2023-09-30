<template>
  <div class="page">
    <div class="left">3</div>
    <div class="main">
      <model-selector v-model="model" class="model-selector" />
      <introduction />
      <input-box v-model="question" class="input-box" />
    </div>
  </div>
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
  components: {
    Introduction,
    InputBox,
    ModelSelector
  },
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
    .input-box {
      display: block;
      position: absolute;
      bottom: 10px;
      right: 10px;
      left: 10px;
    }
    .model-selector {
      position: absolute;
      top: 30px;
      left: 50%;
      transform: translate(-50%, 0);
      z-index: 100;
    }
  }
}
</style>
