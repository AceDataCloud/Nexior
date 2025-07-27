<template>
  <div class="file">
    <div class="left">
      <div class="wrapper">
        <font-awesome-icon icon="fa-regular fa-file-alt" />
        <el-progress
          v-show="percentage && percentage < 100"
          type="circle"
          :stroke-width="3"
          :percentage="percentage"
          :width="25"
        />
      </div>
    </div>
    <div class="right">
      <span class="text-xs font-bold truncate">{{ name }}</span>
    </div>
    <div v-if="closable" class="close">
      <font-awesome-icon icon="fa-solid fa-xmark" class="icon icon-close" @click="$emit('remove')" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElProgress } from 'element-plus';
import { isImageUrl } from '@/utils/is';

export default defineComponent({
  name: 'FilePreview',
  components: {
    FontAwesomeIcon,
    ElProgress
  },
  props: {
    name: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: false,
      default: undefined
    },
    closable: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  emits: ['remove'],
  methods: {
    isImageUrl
  }
});
</script>

<style lang="scss" scoped>
.file {
  cursor: pointer;
  position: relative;
  border-radius: 10px;
  height: 50px;
  width: 250px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  background-color: var(--el-bg-color);
  .el-progress {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 25px;
    height: 25px;
    z-index: 10;
    margin: auto;
  }
  .left {
    height: 50px;
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    .wrapper {
      position: relative;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: white;
      background-color: #10a37f;
      margin: auto;
    }
  }
  .right {
    width: calc(100% - 60px);
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 2px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
  }
  .close {
    position: absolute;
    cursor: pointer;
    top: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    width: 15px;
    border-radius: 50%;
    height: 15px;
    display: flex;
    font-size: 10px;
    text-align: center;
    align-items: center;
    justify-content: center;
  }
}
</style>
