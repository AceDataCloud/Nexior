<template>
  <el-tooltip effect="dark" :content="content" placement="top">
    <font-awesome-icon
      icon="fa-solid fa-info"
      class="icon icon-rotate inline-block w-[20px] h-[20px] border-[3px] border-solid border-[#aaa] rounded-full text-[10px] p-[5px] scale-[0.4] cursor-pointer text-[#aaa] -mr-[5px]"
    />
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'InfoIcon',
  components: {
    FontAwesomeIcon,
    ElTooltip
  },
  props: {
    content: {
      type: String,
      required: true
    }
  }
});
</script>
