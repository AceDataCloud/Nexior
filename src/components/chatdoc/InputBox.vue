<template>
  <div class="input-box">
    <span
      :class="{
        btn: true,
        'btn-send': true,
        disabled: !question
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" class="icon icon-send" />
    </span>
    <el-input
      v-model="questionValue"
      :rows="1"
      :disabled="disabled"
      class="input"
      type="textarea"
      :placeholder="$t('chat.message.newMessagePlaceholder')"
      @keydown.enter.exact.prevent="onSubmit"
    >
    </el-input>
    <p class="info">{{ $t('chat.message.howToUse') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IChatModel } from '@/models';

export default defineComponent({
  name: 'InputBox',
  components: {
    ElInput,
    FontAwesomeIcon
  },
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false
    },
    question: {
      type: String,
      required: true
    }
  },
  emits: ['update:question', 'submit'],
  data() {
    return {
      questionValue: this.question,
      fileList: []
    };
  },
  computed: {
    model(): IChatModel {
      return this.$store.state.chat.model;
    }
  },
  watch: {
    questionValue(val: string) {
      this.$emit('update:question', val);
    },
    question(val: string) {
      if (val !== this.questionValue) {
        this.questionValue = val;
      }
    },
    references(val: string[]) {
      if (val.length === 0) {
        this.fileList = [];
      }
    }
  },
  methods: {
    onSubmit() {
      if (!this.question) {
        return;
      }
      this.$emit('submit');
    }
  }
});
</script>

<style lang="scss">
.input-box {
  .input {
    textarea {
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 30px;
      height: 40px;
    }
  }
  .el-upload-list {
    position: absolute;
    width: 400px;
    bottom: 45px;
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
</style>

<style lang="scss" scoped>
.input-box {
  position: relative;
  width: 100%;
  border: 1px solid #eee;
  border-radius: 10px;
  background: none;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  top: 30px;
  .input {
    border: none;
    width: calc(100% - 80px);
    margin-left: 5px;
  }
  .info {
    display: block;
    position: absolute;
    font-size: 12px;
    color: #666;
    margin-top: 5px;
    margin-left: 3px;
  }
  .btn {
    display: block;
    z-index: 100;
    cursor: pointer;
    position: absolute;
    top: 7px;
    &.btn-send {
      right: 15px;
      &.disabled {
        .icon-send {
          color: #eee;
        }
        cursor: not-allowed;
      }
      .icon-send {
        font-size: 16px;
        color: #666;
      }
    }
  }
}
</style>