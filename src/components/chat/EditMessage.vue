<template>
  <span>
    <el-tooltip effect="dark" :content="$t('common.button.restart')" placement="bottom">
      <font-awesome-icon icon="fa-solid fa-edit" class="icon icon-edit" @click="onEdit" />
    </el-tooltip>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElTooltip } from 'element-plus';

export default defineComponent({
  name: 'EditMessage',
  components: {
    FontAwesomeIcon,
    ElTooltip
  },
  props: {
    messages: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  emits: ['click'],
  data() {
    return {
      copied: false
    };
  },
  methods: {
    onEdit() {
      this.$emit('click');
    }
  }
});
</script>

<style lang="scss" scoped>
.icon-edit {
  cursor: pointer;
  color: inherit;
}
</style>
