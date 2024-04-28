<template>
  <div class="panel detail">
    <task-detail />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { Status } from '@/models';
import TaskDetail from './task/Detail.vue';

export default defineComponent({
  name: 'DetailPanel',
  components: {
    TaskDetail
  },
  props: {},
  data() {
    return {
      job: 0
    };
  },
  computed: {}
});
</script>

<style lang="scss" scoped></style>
