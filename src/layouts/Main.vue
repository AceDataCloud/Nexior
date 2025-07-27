<template>
  <div class="wrapper">
    <router-view class="main" />
    <navigator class="navigator" :direction="mobile ? 'row' : 'column'" />
    <application-status
      v-if="application"
      class="fixed right-2 top-2"
      :application="application"
      :applications="applications"
      :show-price="false"
      :authenticated="!!$store.state.token.access"
      :service="service"
      @select="$store.dispatch(`${appName}/setApplication`, $event)"
    />
    <application-confirm v-model.visible="applying" @apply="onApply" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Navigator from '@/components/common/Navigator.vue';
import ApplicationStatus from '@/components/application/Status.vue';
import { IApplicationScope, IApplicationType, Status } from '@/models';
import { IAppState } from '@/store/common/models';
import { ElMessage } from 'element-plus';
import { applicationOperator } from '@/operators';
import { ERROR_CODE_DUPLICATION } from '@/constants';
import ApplicationConfirm from '@/components/application/Confirm.vue';
import { getFinalApplication } from '@/utils';

export default defineComponent({
  name: 'LayoutMain',
  components: {
    Navigator,
    ApplicationStatus,
    ApplicationConfirm
  },
  data() {
    return {
      applying: false,
      mobile: window.innerWidth < 768
    };
  },
  computed: {
    appName(): keyof IAppState {
      return this.$route.meta.appName as keyof IAppState;
    },
    application() {
      // Global application and individual application can be used here
      return this.$store.state[this.appName]?.application;
    },
    applications() {
      // Combine individual and global applications
      const individualApplications = this.$store.state[this.appName]?.applications ?? [];
      console.debug('individualApplications', individualApplications);
      const globalApplications = this.$store.state.applications ?? [];
      console.debug('globalApplications', globalApplications);
      return globalApplications.concat(individualApplications);
    },
    loading() {
      return this.$store.state[this.appName]?.status?.getApplications === Status.Request;
    },
    service() {
      return this.$store.state[this.appName]?.service;
    }
  },
  watch: {
    appName() {
      this.onInitialize();
    }
  },
  mounted() {
    // Fetch applications when the component is mounted
    this.onInitialize();
    // Update mobile state on resize
    window.addEventListener('resize', () => {
      this.mobile = window.innerWidth < 768;
    });
  },
  methods: {
    async onInitialize() {
      console.debug('Fetching all individual and global applications for', this.appName);
      Promise.all([
        this.$store.dispatch('getApplications'),
        this.$store.dispatch(`${this.appName}/getApplications`)
      ]).finally(() => {
        console.debug('Fetched all applications', this.applications);
        // Check if we need to apply for a global application
        if (this.$store.state.applications?.length === 0) {
          // If no global applications exist, we need to apply
          this.applying = true;
        }
        // set the application if it exists
        const currentApplication = this.$store.state[this.appName]?.application;
        console.debug('current application', currentApplication);
        const finalApplication = getFinalApplication(this.applications, currentApplication);
        console.debug('final application', finalApplication);
        if (finalApplication) {
          console.debug('set final application', finalApplication, finalApplication?.type);
          this.$store.dispatch(`${this.appName}/setApplication`, finalApplication);
        }
      });
    },
    onApply() {
      // Only can apply for global application, not individual application
      applicationOperator
        .create({
          type: IApplicationType.USAGE,
          scope: IApplicationScope.GLOBAL,
          user_id: this.$store.getters.user.id
        })
        .then(() => {
          ElMessage.success(this.$t('application.message.applySuccessfully'));
          this.onInitialize();
        })
        .catch((error) => {
          if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
            ElMessage.error(this.$t('application.message.alreadyApplied'));
          }
        });
    }
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
    width: 60px;
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
