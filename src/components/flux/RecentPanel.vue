<template>
  <div v-if="tasks?.items === undefined" class="tasks">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks?.items?.length && tasks?.items?.length > 0" class="tasks">
    <task-preview v-for="(task, taskIndex) in tasks?.items" :key="taskIndex" :model-value="task" />
  </div>
  <p v-if="tasks?.items?.length === 0" class="description">
    {{ $t('flux.message.noTasks') }}
  </p>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import BotPlaceholder from '../common/BotPlaceholder.vue';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview,
    BotPlaceholder
  },
  emits: ['reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.flux?.tasks,
        items: this.$store.state.flux?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('reach-top reach-top reach-top');
      if (el.scrollTop === 0) {
        this.$emit('reach-top');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.description {
  text-align: left;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tasks {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  .task {
    margin-bottom: 15px;
    width: 100%;
    height: fit-content;
    text-align: left;
  }
}
</style>
