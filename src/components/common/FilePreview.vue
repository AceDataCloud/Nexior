<template>
  <div
    class="file cursor-pointer relative rounded-[10px] h-[50px] w-[250px] flex flex-row items-center justify-start bg-[var(--el-bg-color)]"
  >
    <div class="left h-[50px] w-[50px] flex items-center justify-center">
      <div
        class="wrapper relative w-[35px] h-[35px] flex items-center justify-center rounded-[10px] text-white bg-[#10a37f] m-auto"
      >
        <font-awesome-icon icon="fa-regular fa-file-alt" />
        <el-progress
          v-show="percentage && percentage < 100"
          type="circle"
          :stroke-width="3"
          :percentage="percentage"
          :width="25"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[25px] h-[25px] z-[10] m-auto"
        />
      </div>
    </div>
    <div
      class="right flex-1 h-[50px] flex items-center justify-start pl-[2px] text-[14px] text-[var(--el-text-color-primary)] truncate"
    >
      <span class="text-xs font-bold truncate">{{ name }}</span>
    </div>
    <div
      v-if="closable"
      class="close absolute cursor-pointer top-[5px] right-[5px] bg-[rgba(0,0,0,0.7)] text-white w-[15px] rounded-full h-[15px] flex text-[10px] text-center items-center justify-center"
    >
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
