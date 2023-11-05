<template>
  <el-tooltip effect="dark" :content="content" placement="top">
    <font-awesome-icon icon="fa-solid fa-info" class="icon icon-rotate" />
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

<style lang="scss" scoped>
.icon {
  display: block;
  width: 20px;
  border: 3px solid #aaa;
  border-radius: 50%;
  height: 20px;
  font-size: 10px;
  padding: 5px;
  transform: scale(0.4);
  cursor: pointer;
  color: #aaa;
  margin-right: -5px;
}
</style>
