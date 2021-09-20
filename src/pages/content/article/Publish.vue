<template>
  <p>
    {{ chatValue }}
  </p>
  <el-input v-model="inputValue"> </el-input>
  <el-button @click="onSend"> Send </el-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
interface IData {
  socket: WebSocket | undefined;
  inputValue: string;
  chatValue: string;
}
export default defineComponent({
  data(): IData {
    return {
      socket: undefined,
      inputValue: '',
      chatValue: ''
    };
  },
  mounted() {
    this.socket = new WebSocket('ws://localhost:8000/ws/chat/1');
    this.socket.onmessage = this.onMessage;
  },
  methods: {
    onMessage(e) {
      console.log('e');
      const data = JSON.parse(e.data);
      this.chatValue += data.message;
    },
    onSend() {
      if (!this.socket) {
        return;
      }
      this.socket.send(
        JSON.stringify({
          message: this.inputValue
        })
      );
    }
  }
});
</script>
