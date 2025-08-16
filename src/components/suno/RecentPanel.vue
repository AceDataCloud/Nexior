<template>
  <div v-if="tasks?.items === undefined" class="tasks">
    <bot-placeholder />
  </div>
  <div
    v-else-if="tasks?.items?.length && tasks?.items?.length > 0"
    class="flex-1 w-full overflow-y-auto tasks p-2"
    @scroll="onHandleScroll"
  >
    <task-preview v-for="(task, taskId) in tasks?.items" :key="taskId" :model-value="task" class="preview" />
  </div>
  <div v-if="tasks?.items?.length === 0" class="w-full flex-1 flex items-center justify-center">
    <no-tasks />
  </div>
  <div v-show="!!$store?.state?.suno?.audio?.object" class="h-20">
    <player />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import Player from '@/components/suno/player/Player.vue';
import NoTasks from '@/components/common/NoTasks.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    BotPlaceholder,
    TaskPreview,
    Player,
    NoTasks
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
        ...this.$store.state.suno?.tasks,
        items: this.$store.state.suno?.tasks?.items?.slice()
      };
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('reach-top');
      if (el.scrollTop === 0) {
        this.$emit('reach-top');
      }
    }
  }
});
</script>
