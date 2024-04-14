<template>
  <div class="history">
    <mode-selector class="mb-4" />
    <application-status
      :initializing="initializing"
      :application="application"
      :need-apply="needApply"
      class="mb-4"
      :service="service"
      @refresh="onGetApplication"
    />
    <task-full-list @custom="onCustom" @refresh="onGetApplication" />
    <el-button type="primary" round class="btn btn-generate" @click="onGenerateNew">
      <font-awesome-icon icon="fa-solid fa-chevron-left" class="icon icon-rotate mr-1" />
      {{ $t('midjourney.button.generateNew') }}
    </el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElMessage, ElButton } from 'element-plus';
import ModeSelector from '@/components/midjourney/ModeSelector.vue';
import ApplicationStatus from '@/components/application/Status.vue';
import { midjourneyOperator } from '@/operators';
import TaskFullList from '@/components/midjourney/tasks/TaskFullList.vue';
import { ROUTE_MIDJOURNEY_INDEX } from '@/router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Status } from '@/models';
import { MidjourneyImagineAction, IMidjourneyImagineRequest, IApplication } from '@/models';

interface IData {
  prompt: string;
  elements: string[];
  ignore: string;
}

const CALLBACK_URL = 'https://webhook.acedata.cloud/midjourney';

export default defineComponent({
  name: 'MidjourneyIndex',
  components: {
    TaskFullList,
    ModeSelector,
    ApplicationStatus,
    ElButton,
    FontAwesomeIcon
  },
  data(): IData {
    return {
      prompt: '',
      elements: [],
      ignore: ''
    };
  },
  computed: {
    mode() {
      return this.$store.state.midjourney.mode;
    },
    service() {
      return this.$store.state.midjourney.service;
    },
    application() {
      return this.$store.state.midjourney.application;
    },
    credential() {
      return this.$store.state.midjourney.credential;
    },
    initializing() {
      return this.$store.state.midjourney.status.getApplication === Status.Request;
    },
    needApply() {
      return this.$store.state.midjourney.status.getApplication === Status.Success && !this.application;
    }
  },
  async mounted() {
    await this.onGetApplication();
  },
  methods: {
    async onGenerateNew() {
      this.$router.push({
        name: ROUTE_MIDJOURNEY_INDEX
      });
    },
    async onGetApplication() {
      await this.$store.dispatch('midjourney/getApplication');
    },
    async onStartTask(request: IMidjourneyImagineRequest) {
      const token = this.credential?.token;
      if (!token) {
        console.error('no token found');
        return;
      }
      midjourneyOperator
        .imagine(request, {
          token
        })
        .then(() => {
          ElMessage.success(this.$t('midjourney.message.startTaskSuccess'));
        })
        .catch(() => {
          ElMessage.error(this.$t('midjourney.message.startTaskFailed'));
        });
    },
    async onCustom(payload: { image_id: string; action: MidjourneyImagineAction }) {
      const request = {
        image_id: payload.image_id,
        action: payload.action,
        callback_url: CALLBACK_URL
      };
      this.onStartTask(request);
    }
  }
});
</script>

<style lang="scss" scoped>
.history {
  flex: 1;
  padding: 15px;
  width: calc(100% - 260px);
  display: flex;
  flex-direction: column;
  position: relative;

  .title {
    font-size: 14px;
    margin-bottom: 10px;
  }

  .btn.btn-generate {
    position: absolute;
    left: 30px;
    top: 30px;
    border-radius: 20px;
  }
}
</style>
