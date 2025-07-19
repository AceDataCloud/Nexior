<template>
  <div class="wrapper">
    <router-view class="main" />
    <navigator class="navigator" :direction="mobile ? 'row' : 'column'" />
    <application-status
      v-if="application"
      class="fixed right-2 top-2"
      :application="application"
      :applications="applications"
      :initializing="initializing"
      :show-price="false"
      :authenticated="!!$store.state.token.access"
      :service="service"
      :need-apply="needApply"
      @select="$store.dispatch(`${appName}/setApplication`, $event)"
      @refresh="$store.dispatch(`${appName}/getApplications`)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import ApplicationStatus from '@/components/application/Status.vue';
import { Status } from '@/models';
import { IAppState } from '@/store/common/models';

export default defineComponent({
  name: 'LayoutMain',
  components: {
    Navigator,
    ApplicationStatus
  },
  data() {
    return {
      mobile: window.innerWidth < 768
    };
  },
  computed: {
    appName(): keyof IAppState {
      return this.$route.meta.appName as keyof IAppState;
    },
    initializing() {
      return this.$store.state[this.appName]?.status.getApplications === Status.Request;
    },
    needApply() {
      return this.$store.state[this.appName]?.status.getApplications === Status.Success && !this.application;
    },
    application() {
      return this.$store.state[this.appName]?.application;
    },
    applications() {
      return this.$store.state[this.appName]?.applications;
    },
    loading() {
      return this.$store.state[this.appName]?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state[this.appName]?.service;
    }
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.mobile = window.innerWidth < 768;
    });
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row-reverse;
  overflow: hidden;
  .navigator {
    height: 100%;
    border-right: 1px solid var(--el-border-color);
  }
  .main {
    height: 100%;
    width: calc(100% - 60px);
    flex: 1;
  }
}

@media (max-width: 767px) {
  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .main {
      height: calc(100% - 60px);
      width: 100%;
      flex: 1;
    }
    .navigator {
      width: 100%;
      height: 60px;
    }
  }
}
</style>
