<template>
  <div v-if="tasks === undefined" class="tasks">
    <bot-placeholder />
  </div>
  <div v-else-if="tasks && tasks?.length === 0">
    <no-tasks />
  </div>
  <div v-else-if="tasks.length > 0" ref="panel" class="tasks" @scroll="onHandleScroll">
    <div v-for="(task, taskKey) in tasks" :key="taskKey" class="task">
      <task-item :full="false" :model-value="task" @custom="$emit('custom', $event)" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import TaskItem from './TaskItem.vue';
import BotPlaceholder from '@/components/common/BotPlaceholder.vue';
import NoTasks from '@/components/common/NoTasks.vue';

export default defineComponent({
  name: 'TaskList',
  components: {
    TaskItem,
    BotPlaceholder,
    NoTasks
  },
  emits: ['update:modelValue', 'custom', 'refresh', 'reach-top'],
  data() {
    return {
      job: 0
    };
  },
  computed: {
    tasks() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      return this.$store.state.midjourney.tasks?.items;
    },
    application() {
      return this.$store.state.midjourney.application;
    }
  },
  methods: {
    onHandleScroll() {
      const el = this.$refs.panel as HTMLElement;
      console.log('onHandleScroll  ', el.scrollTop);
      if (el.scrollTop === 0) {
        console.log('reach-top reach-top');
        this.$emit('reach-top');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.description {
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tasks {
  padding: 10px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;

  .task {
    margin-bottom: 15px;
    width: 100%;
    height: fit-content;
    text-align: left;

    &.placeholder {
      display: flex;
      flex-direction: row;
      .left {
        width: 70px;
        padding: 10px;

        .avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }
      }

      .main {
        width: calc(100% - 70px);
        flex: 1;
        padding: 10px;

        .icon {
          display: flex;
          height: 300px;
          width: 300px;
        }

        .title {
          display: block;
          width: 200px;
          height: 20px;
          margin-bottom: 20px;
        }
      }
    }

    .operations {
      height: fit-content !important;
    }
  }
}

.btn {
  border-radius: 20px;
}
</style>
