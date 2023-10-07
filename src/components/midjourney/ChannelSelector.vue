<template>
  <div class="channel-selector">
    <el-button
      v-for="(option, optionKey) in options"
      :key="optionKey"
      :class="{ button: true, active: option.name === value.name }"
      @click="onSelect(option)"
    >
      <font-awesome-icon :class="{ icon: true, [option.name]: true }" :icon="option.icon" />
      <span>
        {{ option.displayName }}
      </span>
    </el-button>
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
    ElButton,
    FontAwesomeIcon
  },
  props: {
    modelValue: {
      type: Object as () => IMidjourneyChannel,
      required: true
    }
  },
  emits: ['update:modelValue', 'select'],
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
  mounted() {
    this.$emit('update:modelValue', this.value);
    this.$emit('select', this.value);
  },
  methods: {
    onSelect(option: IMidjourneyChannel) {
      this.value = option;
      this.$emit('update:modelValue', option);
      this.$emit('select', option);
    }
  }
});
</script>

<style lang="scss" scoped>
.channel-selector {
  background-color: #ececf1;
  padding: 7px 6px;
  border-radius: 15px;
  margin-bottom: 5px;
  width: 372px;
  margin-left: auto;
  margin-right: auto;
  .button {
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
      &.turbo {
        color: #ff9900;
      }
      &.fast {
        color: #2dc49c;
      }
      &.relax {
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
