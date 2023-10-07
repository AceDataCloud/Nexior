<template>
  <div class="model-selector">
    <el-dropdown trigger="click" @command="onCommandChange">
      <el-button>
        <font-awesome-icon class="icon" icon="fa-regular fa-" />
        <span>
          {{ value.displayName }}
        </span>
        <font-awesome-icon icon="fa-solid fa-chevron-down" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="menu">
          <el-dropdown-item
            v-for="(channel, channelIndex) in options"
            :key="channelIndex"
            :command="channel"
            class="option"
          >
            <font-awesome-icon :icon="channel.icon" />
            {{ channel.displayName }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElButton, ElDropdownItem } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  IMidjourneyChannel,
  MIDJOURNEY_CHANNEL_FAST,
  MIDJOURNEY_CHANNEL_RELAX,
  MIDJOURNEY_CHANNEL_TURBO
} from '@/operators';

export default defineComponent({
  name: 'ModelSelector',
  components: {
    ElDropdown,
    ElButton,
    ElDropdownItem,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyChannel,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      value: this.modelValue,
      options: [MIDJOURNEY_CHANNEL_FAST, MIDJOURNEY_CHANNEL_RELAX, MIDJOURNEY_CHANNEL_TURBO]
    };
  },
  watch: {
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {
    onCommandChange(command: IMidjourneyChannel) {
      this.value = command;
      this.$emit('update:modelValue', command);
    }
  }
});
</script>

<style lang="scss" scoped>
.model-selector {
  background-color: #ececf1;
  padding: 7px 6px;
  border-radius: 15px;
  margin-bottom: 5px;
  .group {
    padding: 20px 30px;
    color: black;
    border: none;
    border-radius: 10px;
    margin: 0 3px;
    background-color: inherit;
    &:hover,
    &:focus {
      background-color: inherit;
    }
    &.active {
      background-color: white;
    }
    .icon {
      display: inline-block;
      margin-right: 5px;
      &.base {
        color: #ff9900;
      }
      &.plus {
        color: #ce65e6;
      }
    }
    .fa-chevron-down {
      margin-left: 5px;
      font-weight: 100;
      color: #999;
      transform: scale(0.8);
    }
  }
}
.menu {
  .option {
    .icon {
      display: inline-block;
      margin-right: 5px;
      &.base {
        color: #ff9900;
      }
      &.plus {
        color: #ce65e6;
      }
    }
  }
}
</style>
