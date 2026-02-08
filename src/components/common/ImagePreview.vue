<template>
  <div
    class="image w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden border border-[var(--el-border-color)] bg-[var(--el-fill-color-lighter)]"
  >
    <img class="w-full h-full object-cover" :src="url" :alt="name" />
    <div v-show="percentage && percentage < 100" class="overlay absolute inset-0 bg-[var(--el-mask-color)] backdrop-blur-[1px]"></div>
    <el-progress
      v-show="percentage && percentage < 100"
      type="circle"
      :stroke-width="4"
      :percentage="percentage"
      :width="34"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34px] h-[34px] z-[10] m-auto text-[12px]"
    />
    <div
      v-if="closable"
      class="close absolute cursor-pointer top-[4px] right-[4px] bg-[rgba(0,0,0,0.65)] text-white w-[16px] h-[16px] rounded-full flex text-[10px] text-center items-center justify-center hover:bg-[rgba(0,0,0,0.8)]"
    >
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
      required: false,
      default: undefined
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
