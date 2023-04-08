<template>
  <font-awesome-icon icon="fa-solid fa-microphone" class="icon-edit" @click="onToggleRecognition" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'VoiceRecognition',
  components: {
    FontAwesomeIcon
  },
  emits: ['finished'],
  data() {
    return {
      supported: false,
      recognition: undefined,
      started: false,
      result: ''
    };
  },
  mounted() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      this.supported = true;
      // @ts-ignore
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      if (this.recognition) {
        // @ts-ignore
        this.recognition.lang = 'zh-CN';
      }
    }
    // @ts-ignore
    this.recognition?.addEventListener('result', (event) => {
      const transcript = event.results[0][0].transcript;
      this.result = transcript;
      console.log('result', this.result);
    });

    // @ts-ignore
    this.recognition?.addEventListener('error', (event) => {
      console.log('Recognition error:', event.error);
    });

    // @ts-ignore
    this.recognition?.addEventListener('end', () => {
      console.log('Recognition ended');
      console.log('result', this.result);
      this.$emit('finished', this.result);
    });
  },
  methods: {
    startRecognition() {
      // @ts-ignore
      this.recognition?.start();
      this.started = true;
    },
    stopRecognition() {
      // @ts-ignore
      this.recognition?.stop();
      this.started = true;
    },
    onToggleRecognition() {
      if (!this.started) {
        this.startRecognition();
      } else {
        this.stopRecognition();
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.introduction-item {
  font-size: 14px;
  background-color: #eee;
  color: #333;
  padding: 10px 20px;
}
</style>
