<template>
  <div class="wrapper">
    <router-view class="main" />
    <navigator class="navigator" :direction="mobile ? 'row' : 'column'" />
    <application-status
      v-if="application"
      class="status-floating fixed right-2 z-[200]"
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
import { computed, defineComponent } from 'vue';
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
  provide() {
    return {
      initialized: computed(() => this.initialized)
    };
  },
  data() {
    return {
      initialized: false,
      applying: false,
      mobile: window.innerWidth < 768,
      initializeRunId: 0
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
    },
    userId() {
      return this.$store.state.user?.id;
    }
  },
  watch: {
    appName() {
      this.initialize();
    },
    userId(newValue: string | undefined, oldValue: string | undefined) {
      if (newValue && newValue !== oldValue) {
        this.initialize();
      }
    }
  },
  mounted() {
    // Fetch applications when the component is mounted
    this.initialize();
    // Update mobile state on resize
    window.addEventListener('resize', () => {
      this.mobile = window.innerWidth < 768;
    });
  },
  methods: {
    async initialize() {
      const runId = ++this.initializeRunId;
      this.initialized = false;
      console.debug('Fetching all individual and global applications for', this.appName);
      await Promise.allSettled([
        this.$store.dispatch('getApplications'),
        this.$store.dispatch(`${this.appName}/getApplications`)
      ]);
      if (runId !== this.initializeRunId) {
        return;
      }
      console.debug('Fetched all applications', this.applications);
      // First-time users: silently create the global application. The welcome
      // toast only fires inside onAutoApply(), so users who already had a
      // global application (returning visitors, top-ups, multi-device logins)
      // never see the credit-grant message.
      if (this.$store.state.applications?.length === 0) {
        await this.onAutoApply();
      }
      // set the application if it exists
      const currentApplication = this.$store.state[this.appName]?.application;
      console.debug('current application', currentApplication);
      const finalApplication = getFinalApplication(this.applications, currentApplication);
      console.debug('final application', finalApplication);
      if (finalApplication) {
        console.debug('set final application', finalApplication, finalApplication?.type);
        await this.$store.dispatch(`${this.appName}/setApplication`, finalApplication);
      }
      console.debug('finished initialization');
      this.initialized = true;
    },
    onApply() {
      // Legacy entry kept for the <application-confirm> dialog (no longer
      // auto-opened, but still emits 'apply' if some other path triggers it).
      this.onAutoApply();
    },
    async onAutoApply() {
      try {
        await applicationOperator.create({
          type: IApplicationType.USAGE,
          scope: IApplicationScope.GLOBAL,
          user_id: this.$store.getters.user.id
        });
        this.applying = false;
        await this.$store.dispatch('getApplications');
        this.showWelcomeToast();
      } catch (error: any) {
        if (error?.response?.data?.code === ERROR_CODE_DUPLICATION) {
          // Backend already had the global app — refresh and continue silently.
          await this.$store.dispatch('getApplications');
        } else {
          ElMessage.error(this.$t('application.message.applyFailed'));
        }
      }
    },
    showWelcomeToast() {
      // Called only after a successful applicationOperator.create() for a
      // GLOBAL application — i.e. the user genuinely just got their first
      // free-credit grant. No localStorage gate needed.
      const globalApp = this.$store.state.applications?.[0];
      const credits = Math.floor(globalApp?.remaining_amount ?? 0);
      const message =
        credits > 0
          ? this.$t('application.message.welcomeWithCredits', { credits })
          : this.$t('application.message.welcomeNoCredits');
      ElMessage({ message: message as string, type: 'success', duration: 6000, showClose: true });
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
  }

  .main {
    height: 100%;
    flex: 1;
    min-width: 0;
    background-color: var(--app-content-bg);
  }
}

// Wallet / balance pill in the top-right corner. On iOS with a notch /
// Dynamic Island the default `top: 0.5rem` (Tailwind `top-2`) would draw
// under the inset; nudge it down by `safe-area-inset-top` instead so it
// stays clear on every device while keeping a sensible web fallback.
.status-floating {
  top: max(0.5rem, env(safe-area-inset-top));
}

@media (max-width: 767px) {
  .wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .main {
      // Bottom navigator is 60px tall + iOS home-indicator inset.
      height: calc(100% - 60px - env(safe-area-inset-bottom));
      width: 100%;
      flex: 1;
    }
    .navigator {
      width: 100%;
      height: calc(60px + env(safe-area-inset-bottom));
      // Push the actual links above the home indicator on iPhone.
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}
</style>
