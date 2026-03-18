<template>
  <div class="field">
    <span class="text-sm font-bold">
      {{ $t('midjourney.name.hd') }}
      <el-tooltip :content="$t('midjourney.description.hd')" placement="top">
        <font-awesome-icon icon="fa-solid fa-circle-info" class="info-icon" />
      </el-tooltip>
    </span>
    <el-switch v-model="value" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSwitch, ElTooltip } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'HdSelector',
  components: {
    ElSwitch,
    ElTooltip,
    FontAwesomeIcon
  },
  computed: {
    value: {
      get() {
        return this.$store.state.midjourney.config.hd || false;
      },
      set(val: boolean) {
        this.$store.commit('midjourney/setConfig', {
          ...this.$store.state.midjourney.config,
          hd: val
        });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .info-icon {
    margin-left: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
  }
}
</style>
