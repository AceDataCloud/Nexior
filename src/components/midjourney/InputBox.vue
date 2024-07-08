<template>
  <div class="input-box">
    <el-tooltip class="box-item" effect="dark" :content="$t('midjourney.message.operation')" placement="top">
      <span class="btn btn-upload" @click="$emit('toggle-panel')" @mouseenter="$emit('open-panel')">
        <font-awesome-icon icon="fa-solid fa-plus" class="icon icon-operation" />
      </span>
    </el-tooltip>
    <span
      :class="{
        btn: true,
        'btn-send': true,
        disabled: !promptValue
      }"
      @click="onSubmit"
    >
      <font-awesome-icon icon="fa-solid fa-location-arrow" class="icon icon-send" />
    </span>
    <!-- add this textarea -->
    <textarea
      ref="textarea"
      v-model="promptValue"
      class="input"
      :placeholder="$t('midjourney.message.promptPlaceholder')"
      :style="{ height: inputHeight }"
      @keydown.enter.exact.prevent="onSubmit"
      @focus="$emit('close-panel')"
      @input="adjustTextareaHeight"
    ></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'InputBox',
  components: {
    ElTooltip,
    FontAwesomeIcon
  },
  props: {
    prompt: {
      type: String,
      required: true
    }
  },
  emits: ['update:prompt', 'submit', 'open-panel', 'toggle-panel', 'close-panel'],
  data() {
    return {
      inputHeight: '35px', //add inputHeight
      promptValue: this.prompt
    };
  },
  watch: {
    promptValue(val: string) {
      this.$emit('update:prompt', val);
    },
    prompt(val: string) {
      if (val !== this.promptValue) {
        this.promptValue = val;
      }
    }
  },
  methods: {
    // add textarea method
    adjustTextareaHeight() {
      this.$nextTick(() => {
        const textarea = this.$refs.textarea;
        if (textarea) {
          // @ts-ignore
          textarea.style.height = '35px';
          // @ts-ignore
          if (this.prompt) {
            textarea.style.height = textarea.scrollHeight + 'px';
          }
        }
      });
    },
    onSubmit() {
      if (!this.prompt) {
        return;
      }
      this.$emit('submit');
    }
  }
});
</script>

<style lang="scss">
textarea.input {
  font-size: 14px;
  min-height: 35px;
  max-height: 350px;
  border: none;
  background: none;
  box-shadow: none;
  resize: none;
  line-height: 25px;
  width: calc(100% - 80px);
  margin-left: 30px;
  font-family: var(--el-font-family);
  padding-top: 6px;
}
textarea.input:focus {
  outline: none;
}
.input-box {
  position: relative;
  .input {
    textarea {
      max-height: 100px;
      border: none;
      background: none;
      box-shadow: none;
      resize: none;
      line-height: 35px;
    }
  }

  .el-textarea.is-disabled .el-textarea__inner {
    background-color: initial;
  }
}
</style>

<style lang="scss" scoped>
.input-box {
  width: 100%;
  max-width: 100%;
  margin: auto;
  position: relative;
  border-radius: 10px;
  background: var(--el-color-info-light-9);
  padding: 5px;
  .upload {
    display: inline-block;
    &.disabled {
      .btn-upload {
        cursor: not-allowed;
        .icon-attachment {
          color: var(--el-text-color-disabled);
        }
      }
    }
  }
  .input {
    border: none;
    width: calc(100% - 80px);
    margin-left: 35px;
    line-height: 28px;
  }
  .btn {
    display: block;
    z-index: 100;
    cursor: pointer;
    bottom: 15px;
    position: absolute;
    &.btn-upload {
      left: 15px;
      background: var(--el-color-info-light-5);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      text-align: center;
      padding-top: 1px;
      .icon-attachment {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
    &.btn-send {
      right: 15px;
      &.disabled {
        .icon-send {
          color: var(--el-text-color-disabled);
        }
        cursor: not-allowed;
      }
      .icon-send {
        font-size: 16px;
        color: var(--el-text-color-primary);
      }
    }
  }
}
</style>
