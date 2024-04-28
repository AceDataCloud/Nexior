<template>
  <div class="panel detail">
    <task-detail />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskDetail from './task/Detail.vue';

export default defineComponent({
  name: 'DetailPanel',
  components: {
    TaskDetail
  },
  data() {
    return {
      job: 0
    };
  },
  computed: {}
});
</script>
