<template>
  <div class="message">
    <el-image :src="author.avatar" class="icon" />
    <message-content :content="content" class="content" :error="error" :state="state" />
  </div>
  <div class="operations">
    <el-button v-if="author.type === 'bot' && content.value" class="operation" size="small" @click="onCopy">
      <font-awesome-icon icon="fa-regular fa-copy" class="icon-copy" />
      {{ $t('common.button.copy') }}
    </el-button>
    <el-button
      v-if="author.type === 'bot' && (state === messageState.ANSWERING || state === messageState.PENDING)"
      class="operation"
      size="small"
      @click="onStop"
    >
      <font-awesome-icon icon="fa-solid fa-stop" class="icon-stop" />
      {{ $t('common.button.stop') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { IBot, IUser } from '@/operators';
import { IContent, IError, IMessageState } from '@/operators/message/models';
import { defineComponent } from 'vue';
import MessageContent from './MessageContent.vue';
import { ElImage, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import copy from 'copy-to-clipboard';

interface IData {
  copied: boolean;
  messageState: typeof IMessageState;
}

export default defineComponent({
  name: 'Message',
  components: {
    MessageContent,
    ElImage,
    ElButton,
    FontAwesomeIcon
  },
  props: {
    content: {
      type: Object as () => IContent,
      required: true
    },
    author: {
      type: Object as () => IUser | IBot,
      required: true
    },
    error: {
      type: Object as () => IError | undefined,
      required: false,
      default() {
        return undefined;
      }
    },
    state: {
      type: Object as () => IMessageState,
      required: false,
      default() {
        return IMessageState.FINISHED;
      }
    }
  },
  emits: ['stop'],
  data(): IData {
    return {
      copied: false,
      messageState: IMessageState
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  },
  methods: {
    onCopy() {
      copy(this.content.value, {
        debug: true
      });
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
    onStop() {
      this.$emit('stop');
    }
  }
});
</script>

<style lang="scss" scoped>
.message {
  display: flex;
  flex-direction: row;
  .icon {
    width: 30px;
    height: 30px;
    margin-right: 20px;
    border-radius: 3px;
    min-width: 30px;
  }
  .content {
    flex: 1;
  }
}

.operations {
  width: fit-content;
  margin: auto;
  .operation {
    margin-top: 15px;
  }
  .fa-copy,
  .fa-stop {
    margin-right: 5px;
  }
}
</style>
