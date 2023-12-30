<template>
  <div class="page">
    <div class="card">
      <h2 class="title">{{ $t('chat.title.chat') }}</h2>
      <p class="description">{{ $t('chat.message.startNewChat') }}</p>
      <el-button type="primary" @click="onStart">{{ $t('common.button.new') }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { v4 as uuid } from 'uuid';
import { ROUTE_CHAT_CONVERSATION } from '@/router/constants';

interface IData {
  model: string;
  question: string;
}

export default defineComponent({
  name: 'ChatIndex',
  components: {
    ElButton
  },
  data(): IData {
    return {
      model: 'chatgpt',
      question: ''
    };
  },
  methods: {
    onStart() {
      this.$router.push({
        name: ROUTE_CHAT_CONVERSATION,
        params: {
          id: uuid()
        }
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.page {
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

    .el-button {
      border-radius: 20px;
    }
  }
}
</style>
