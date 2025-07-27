<template>
  <div class="status">
    <el-dialog v-model="visible" class="mt-12" width="600px">
      <div v-if="application">
        <p class="text-center mb-4">
          {{ $t('application.message.applicationSelection') }}
        </p>
        <div class="flex flex-col gap-4 mb-6 justify-center items-center overflow-y-auto">
          <application-info
            v-for="(app, index) in applications"
            :key="index"
            :class="{
              item: true,
              active: application?.id === app.id
            }"
            :application="app"
            @click="onSelectApplication(app)"
            @usage="onGoUsage(app)"
            @buy="onBuyMore(app)"
          />
        </div>
      </div>
    </el-dialog>
    <el-button circle @click="visible = true">
      <font-awesome-icon icon="fa-solid fa-wallet" class="icon" />
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton, ElDialog } from 'element-plus';
import { IApplicationType, IApplication, IService } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_USAGE_LIST } from '@/router';
import ApplicationInfo from './Info.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export interface IData {
  visible: boolean;
  applicationType: typeof IApplicationType;
}

export default defineComponent({
  name: 'ApplicationStatus',
  components: {
    ElButton,
    ElDialog,
    FontAwesomeIcon,
    ApplicationInfo
  },
  props: {
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    },
    applications: {
      type: Array as () => IApplication[] | undefined,
      default: undefined
    },
    service: {
      type: Object as () => IService | undefined,
      required: true
    }
  },
  emits: ['select'],
  data(): IData {
    return {
      visible: false,
      applicationType: IApplicationType
    };
  },
  computed: {
    authenticated() {
      return !!this.$store.state.token.access;
    },
    user() {
      return this.$store.state.user;
    }
  },
  methods: {
    onGoUsage(application: IApplication) {
      const url = this.$router.resolve({
        name: ROUTE_CONSOLE_USAGE_LIST,
        query: {
          application_id: application.id
        }
      });
      window.open(url.href, '_blank');
    },
    onBuyMore(application: IApplication) {
      // open in new tab for this url
      const url = this.$router.resolve({
        name: ROUTE_CONSOLE_APPLICATION_EXTRA,
        params: {
          id: application.id
        }
      }).href;
      window.open(url, '_blank');
    },
    onSelectApplication(application: IApplication) {
      this.$emit('select', application);
    }
  }
});
</script>
