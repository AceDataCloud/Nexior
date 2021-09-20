<template>
  <p>
    {{ chatValue }}
  </p>
  <el-input v-model="inputValue"> </el-input>
  <el-button @click="onSend"> Send </el-button>
  <el-button @click="onLaunch()"> Launch </el-button>
  <el-button @click="onOpen('https://www.baidu.com')"> Open </el-button>
  <el-button @click="onClose"> Close </el-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
interface IData {
  socket: WebSocket | undefined;
  inputValue: string;
  chatValue: string;
  id: string;
}
export default defineComponent({
  data(): IData {
    return {
      id: this.$route.params.id.toString(),
      socket: undefined,
      inputValue: '',
      chatValue: ''
    };
  },
  mounted() {
    this.socket = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}/${window.location.host}/ws/publish/${
        this.id
      }?access_token=${this.$store.getters.accessToken}`
    );
    this.socket.onmessage = this.onMessage;
  },
  methods: {
    onMessage(e) {
      console.log('e');
      const data = JSON.parse(e.data);
      this.chatValue += data.message;
    },
    onLaunch() {
      if (!this.socket) {
        return;
      }
      this.socket.send(
        JSON.stringify({
          command: 'launch'
        })
      );
    },
    onOpen(url: string) {
      if (!this.socket) {
        return;
      }
      this.socket.send(
        JSON.stringify({
          command: 'open',
          payload: {
            url: url
          }
        })
      );
    },
    onClose() {
      if (!this.socket) {
        return;
      }
      this.socket.send(
        JSON.stringify({
          command: 'close'
        })
      );
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
