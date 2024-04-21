<template>
  <div>
    <el-tooltip effect="dark" :content="$t('common.message.joinDiscord')" placement="top-start">
      <el-button type="primary" circle size="large" @click="onJoin">
        <font-awesome-icon icon="fa-brands fa-discord" />
      </el-button>
    </el-tooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElTooltip, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'HelpEntry',
  components: {
    ElTooltip,
    ElButton,
    FontAwesomeIcon
  },
  methods: {
    onJoin() {
      window.open('https://discord.gg/73F3MYj3vp', '_blank');
    }
  }
});
</script>
