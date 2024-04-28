<template>
  <div class="main">
    <div class="config">
      <slot name="config" />
    </div>
    <div class="result">
      <slot name="result" />
    </div>
    <el-button round class="menu" @click="drawer = true">
      <font-awesome-icon icon="fa-solid fa-bars" class="icon-menu" />
    </el-button>
    <el-drawer v-model="drawer" :with-header="false" size="340px" class="drawer">
      <slot name="config" />
    </el-drawer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDrawer, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'LayoutQrart',
  components: {
    ElDrawer,
    ElButton,
    FontAwesomeIcon
  },
  data() {
    return {
      drawer: false
    };
  },
  async mounted() {
    await this.onGetService();
    await this.onGetApplication();
  },
  methods: {
    async onGetService() {
      await this.$store.dispatch('qrart/getService');
    },
    async onGetApplication() {
      await this.$store.dispatch('qrart/getApplication');
    }
  }
});
</script>

<style lang="scss" scoped>
.main {
  flex: 1;
  display: flex;
  flex-direction: row;
  .config {
    width: 350px;
    height: 100%;
    overflow-y: scroll;
    border-right: 1px solid var(--el-border-color);
  }

  .result {
    height: 100%;
    padding: 15px;
    flex: 1;
    width: calc(100% - 350px);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.menu {
  display: none;
}

@media (max-width: 767px) {
  .preset {
    display: none;
  }
  .result {
    width: 100%;
  }
  .menu {
    display: block;
    position: fixed;
    right: 20px;
    top: 20px;
    z-index: 2000;
  }
}
</style>
