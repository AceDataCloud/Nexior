<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-button round>
      <font-awesome-icon
        v-if="activeOption?.icon"
        :icon="activeOption.icon"
        :style="{
          color: activeOption?.color
        }"
      />
      <span class="ml-2">
        {{ activeOption?.label }}
      </span>
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="(option, index) in options"
          :key="index"
          class="flex items-center justify-between"
          :command="option.value"
        >
          <font-awesome-icon
            v-if="option.icon"
            :icon="option.icon"
            :style="{
              color: option.color
            }"
          />
          <span class="ml-1 text-sm">
            {{ option.label }}
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownItem, ElButton, ElIcon } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ArrowDown } from '@element-plus/icons-vue';

export const DEFAULT_MODE = 'fast';

export default defineComponent({
  name: 'ModeSelector',
  components: {
    ElButton,
    ElDropdown,
    ArrowDown,
    ElIcon,
    FontAwesomeIcon,
    ElDropdownItem
  },
  data() {
    return {
      options: [
        {
          label: this.$t('midjourney.button.fast'),
          value: 'fast',
          icon: 'fa-solid fa-wind',
          color: '#2dc49c'
        },
        {
          label: this.$t('midjourney.button.relax'),
          value: 'relax',
          icon: 'fa-solid fa-mug-saucer',
          color: '#ce65e6'
        },
        {
          label: this.$t('midjourney.button.turbo'),
          value: 'turbo',
          icon: 'fa-solid fa-bolt',
          color: '#ff9900'
        }
      ]
    };
  },
  computed: {
    activeOption() {
      return this.options.find((option) => option.value === this.value);
    },
    value: {
      get() {
        return this.$store.state.midjourney.config.mode;
      },
      set(val) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          mode: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = DEFAULT_MODE;
    }
  },
  methods: {
    onCommand(command) {
      console.log('command', command);
      this.value = command;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>

<style lang="scss">
.mode {
  .el-radio-button--small .el-radio-button__inner {
    padding: 8px 11px;
  }
}
</style>
