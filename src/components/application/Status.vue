<template>
  <div class="status">
    <el-dialog v-model="visible" class="mt-12" width="450px">
      <div v-if="application">
        <p class="text-center mb-4">
          {{ $t('application.message.applicationSelection') }}
        </p>
        <div class="flex flex-col gap-4 mb-6 overflow-y-auto">
          <application-info
            v-for="(app, index) in applications"
            :key="index"
            :class="{
              item: true,
              active: application?.id === app.id
            }"
            :application="app"
            show-id
            @click="onSelectApplication(app)"
            @usage="onGoUsage(app)"
            @buy="onBuyMore(app)"
          />
        </div>
      </div>
    </el-dialog>
    <button type="button" class="entry" :title="balanceTitle" @click="visible = true">
      <font-awesome-icon icon="fa-solid fa-wallet" class="entry-icon" />
      <span class="entry-amount">{{ balanceText }}</span>
      <span class="entry-unit">{{ balanceUnit }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDialog } from 'element-plus';
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
    },
    balanceAmount(): number {
      return Number(this.application?.remaining_amount ?? 0);
    },
    balanceUnit(): string {
      const unit = this.application?.service?.unit || 'credit';
      const key = `service.unit.${unit}` + (this.balanceAmount === 1 ? '' : 's');
      return this.$t(key);
    },
    balanceText(): string {
      const value = this.balanceAmount;
      if (!Number.isFinite(value)) return '0';
      if (value >= 1000) return Math.round(value).toLocaleString();
      if (value >= 100) return value.toFixed(1);
      return value.toFixed(2);
    },
    balanceTitle(): string {
      return `${this.balanceText} ${this.balanceUnit}`;
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

<style lang="scss" scoped>
.entry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--app-border-subtle, var(--el-border-color));
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
  appearance: none;
  outline: none;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--app-shadow-md, 0 2px 8px rgba(0, 0, 0, 0.08));
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-7, rgba(64, 158, 255, 0.2));
  }
}

.entry-icon {
  font-size: 13px;
  color: var(--el-color-primary);
}

.entry-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.entry-unit {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .entry {
    padding: 0 10px;
    height: 30px;
  }

  .entry-unit {
    display: none;
  }
}
</style>
