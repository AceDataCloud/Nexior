<template>
  <div class="page">
    <sidebar class="left" :application="application" />
    <div class="main">
      <div class="card">
        <h2 class="title">Chat</h2>
        <p class="description">Click to start a new chat</p>
        <el-button type="primary" @click="onStart">New</el-button>
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
import InputBox from '@/components/chat/InputBox.vue';
import ModelSelector from '@/components/chat/ModelSelector.vue';
import Sidebar from '@/components/chat/Sidebar.vue';
import { ROUTE_CHAT_CONVERSATION_NEW } from '@/router/constants';
import application from '@/i18n/zh/application';

export default defineComponent({
  name: 'ChatIndex',
  components: {
    Sidebar,
    ElButton
  },
  data() {
    return {
      model: 'chatgpt',
      drawer: false,
      question: ''
    };
  },
  methods: {
    onStart() {
      console.log('onStart');
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION_NEW
      });
    }
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
    display: block;
    width: 300px;
    height: 100%;
    border-right: 1px solid #eee;
  }
  .main {
    flex: 1;
    overflow: hidden;
    position: relative;
    align-items: center;
    display: flex;
    justify-content: center;

    .card {
      width: 200px;
      height: 150px;
      text-align: center;

      .title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .description {
        font-size: 14px;
        margin-bottom: 15px;
      }
    }
  }
}
</style>
