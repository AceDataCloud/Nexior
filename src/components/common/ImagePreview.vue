<template>
  <div class="image w-[50px] h-[50px] relative rounded-[var(--el-border-radius-base)] overflow-hidden">
    <img class="w-full h-full object-cover" :src="url" :alt="name" />
    <el-progress
      v-show="percentage && percentage < 100"
      type="circle"
      :stroke-width="3"
      :percentage="percentage"
      :width="30"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] z-[10] m-auto"
    />
    <div
      v-if="closable"
      class="close absolute cursor-pointer top-[5px] right-[5px] bg-[rgba(0,0,0,0.7)] text-white w-[15px] h-[15px] rounded-full flex text-[10px] text-center items-center justify-center"
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
