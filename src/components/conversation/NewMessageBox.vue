<template>
  <div class="new-message-box">
    <el-input
      v-model="value"
      :disabled="!application || answering"
      class="new-message-input"
      :placeholder="$t('conversation.message.newMessagePlaceholder')"
      @keyup.enter="$emit('send')"
    >
      <template #suffix>
        <font-awesome-icon icon="fa-regular fa-paper-plane" class="icon-send" @click="$emit('send')" />
      </template>
    </el-input>
    <div v-if="!application" class="new-message-apply">
      <div v-if="initializing">
        <span class="mr-2">{{ $t('conversation.message.apiInfo') }}</span>
        <span>
          <el-button type="primary" size="small" @click="confirming = true">
            {{ $t('common.button.apply') }}
          </el-button>
        </span>
        <span class="ml-1">{{ $t('conversation.message.tryForFree') }}</span>
      </div>
      <div v-else>
        <span class="ml-1">{{ $t('conversation.message.initializing') }}</span>
      </div>
    </div>
  </div>
  <application-confirm
    v-if="api"
    v-model.visible="confirming"
    :object="api"
    :type="applicationType.API"
    @apply="$emit('apply')"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElInput, ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { IApi, IApplication } from '@/operators';
import { IApplicationType } from '@/operators';
import ApplicationConfirm from '@/components/application/Confirm.vue';

interface IData {
  applicationType: typeof IApplicationType;
  value: string;
  confirming: boolean;
}

export default defineComponent({
  name: 'NewMessageBox',
  components: {
    ElInput,
    ElButton,
    FontAwesomeIcon,
    ApplicationConfirm
  },
  props: {
    initializing: {
      type: Boolean,
      required: false,
      default: false
    },
    answering: {
      type: Boolean,
      required: false,
      default: false
    },
    modelValue: {
      type: String,
      required: true
    },
    api: {
      type: Object as () => IApi | undefined,
      required: true
    },
    application: {
      type: Object as () => IApplication | undefined,
      required: true
    }
  },
  emits: ['send', 'update:modelValue', 'apply'],
  data(): IData {
    return {
      applicationType: IApplicationType,
      value: this.modelValue,
      confirming: false
    };
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  },
  watch: {
    value(val) {
      this.$emit('update:modelValue', val);
    },
    modelValue(val) {
      if (val !== this.value) {
        this.value = val;
      }
    }
  },
  methods: {}
});
</script>

<style lang="scss" scoped>
.new-message-box {
  position: relative;
  margin-bottom: 30px;
  .new-message-input {
    height: 50px;
  }
  .icon-send {
    cursor: pointer;
  }

  .new-message-apply {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    text-align: center;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: #666;
  }
}
</style>
