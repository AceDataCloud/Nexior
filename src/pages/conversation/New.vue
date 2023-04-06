<template>
  <div class="conversation">
    <div class="introduction"></div>
    <div class="footer">
      <el-row>
        <el-col :span="18" :offset="3">
          <new-message-box v-model="input" class="new-message" @send="onSend" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRow, ElCol } from 'element-plus';
import NewMessageBox from '@/components/conversation/NewMessageBox.vue';
import { chatgptOperator } from '@/operators/api/chatgpt/operator';
import { IResponse } from '@/operators/api/chatgpt/models';

export default defineComponent({
  name: 'ChatMain',
  components: {
    NewMessageBox,
    ElRow,
    ElCol
  },
  data() {
    return {
      input: ''
    };
  },
  computed: {},
  methods: {
    onSend() {
      console.log('send', this.input);
      chatgptOperator
        .post(
          {
            question: this.input
          },
          {
            token: 'ec5cc681720b4923b05f669a853c5629'
          }
        )
        .then(({ data: data }: { data: IResponse }) => {
          console.log('data', data);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.conversation {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  .introduction {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0%;
  }

  .footer {
    height: 50px;
  }
}
</style>
