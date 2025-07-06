<template>
  <div class="image">
    <img class="size-10" :src="url" :alt="name" />
    <el-progress
      v-show="percentage && percentage < 100"
      type="circle"
      :stroke-width="3"
      :percentage="percentage"
      :width="30"
    />
    <div v-if="closable" class="close">
      <font-awesome-icon icon="fa-solid fa-xmark" class="icon icon-close" @click.stop="$emit('remove')" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElProgress } from 'element-plus';

export default defineComponent({
  name: 'ImagePreview',
  components: {
    FontAwesomeIcon,
    ElProgress
  },
  props: {
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    },
    closable: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  emits: ['remove']
});
</script>

<style lang="scss" scoped>
.image {
  width: 50px;
  height: 50px;
  position: relative;
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
  .el-progress {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 30px;
    z-index: 10;
    margin: auto;
  }
  img {
    object-fit: cover;
  }
}
</style>
