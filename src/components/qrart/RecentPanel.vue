<template>
  <div class="panel recent tasks">
    <task-preview v-for="(task, taskIndex) in tasks?.items" :key="taskIndex" :model-value="task" class="preview" />
    <p v-if="tasks?.items?.length === 0" class="description">
      {{ $t('qrart.message.noTasks') }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskPreview from './task/Preview.vue';
import { Status } from '@/models';

export default defineComponent({
  name: 'RecentPanel',
  components: {
    TaskPreview
  },
  data() {
    return {
      job: 0
    };
  },
  computed: {
    loading() {
      return this.$store.state.qrart?.status?.getApplication === Status.Request;
    },
    tasks() {
      // reverse the order of the tasks.items
      return {
        ...this.$store.state.qrart?.tasks,
        items: this.$store.state.qrart?.tasks?.items?.slice().reverse()
      };
    }
  },
  async mounted() {
    await this.$store.dispatch('qrart/setTasks', undefined);
    await this.getTasks();
    await this.onScrollDown();
    // @ts-ignore
    this.job = setInterval(() => {
      this.getTasks();
    }, 5000);
  },
  async unmounted() {
    clearInterval(this.job);
  },
  methods: {
    async onScrollDown() {
      setTimeout(() => {
        // scroll to bottom for `.tasks`
        const el = document.querySelector('.tasks');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      }, 500);
    },
    async getTasks() {
      // ensure that the previous request has been completed
      if (this.loading) {
        return;
      }
      await this.$store.dispatch('qrart/getTasks', {
        limit: 50,
        offset: 0
      });
    }
  }
});
</script>

<style lang="scss" scoped>
.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  &.recent {
    width: 100%;
    height: 100%;
    display: flex;
    overflow-y: auto;
    flex-direction: column;
    .preview {
      margin-right: 15px;
    }
    .description {
      text-align: left;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
