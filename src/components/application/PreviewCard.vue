<template>
  <el-card v-if="application && service" shadow="hover">
    <div class="item">
      <div class="icon">
        <font-awesome-icon :icon="'fa-regular fa-' + service.icon" />
      </div>
      <div class="main">
        <div class="title">
          {{ service.title }}
        </div>
        <div class="key">
          <span class="label">{{ $t('application.field.apiKey') }}</span>
          <span class="value">{{ application.apiKey }}</span>
          <span class="copy">
            <font-awesome-icon icon="fa-regular fa-copy" />
          </span>
        </div>
        <div class="remaining-count">
          <span class="label">{{ $t('application.field.remainingCount') }}</span>
          <span class="value">{{ application.remainingCount }}</span>
        </div>
        <div class="operations">
          <div class="operation">
            <font-awesome-icon icon="fa-regular fa-file-lines" class="label" />
            <span class="link">{{ $t('application.button.document') }}</span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  applicationOperator,
  IApplication,
  IApplicationDetailResponse,
  IService,
  IServiceDetailResponse,
  serviceOperator
} from '@/operators';
import { defineComponent } from 'vue';

interface IData {
  loading: boolean;
  service: IService | undefined;
}

export default defineComponent({
  name: 'ApplicationPreviewCard',
  components: {
    FontAwesomeIcon
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    }
  },
  data(): IData {
    return {
      loading: false,
      service: undefined
    };
  },
  mounted() {
    serviceOperator.get(this.application.service).then(({ data: data }: { data: IServiceDetailResponse }) => {
      this.service = data;
      this.loading = false;
    });
  }
});
</script>

<style lang="scss" scoped>
.item {
  height: 200px;
  display: flex;
  $icon-size: 150px;
  $icon-font-size: 50px;
  .icon {
    width: $icon-size;
    height: $icon-size;
    line-height: $icon-size;
    font-size: $icon-font-size;
    text-align: center;
    margin: auto 0;
    color: var(--el-color-primary);
  }
  .main {
    padding: 0 15px;
    position: relative;
    .title {
      font-size: 20px;
      font-weight: 500;
      margin-bottom: 10px;
    }
    .key {
      font-size: 14px;
      margin-bottom: 5px;
      .label {
        font-weight: 600;
      }
      .value {
        display: inline-block;
        margin-left: 5px;
      }
      .copy {
        display: inline-block;
        margin-left: 5px;
        color: #666;
        cursor: pointer;
      }
    }
    .remaining-count {
      font-size: 14px;
      margin-bottom: 5px;
      .label {
        font-weight: 600;
      }
      .value {
        display: inline-block;
        margin-left: 5px;
      }
    }
    .operations {
      position: absolute;
      bottom: 5px;
      left: 20px;
      .operation {
        color: #666;
        .label {
          color: var(--el-color-primary);
        }
        .link {
          cursor: pointer;
          display: inline-block;
          margin-left: 5px;
        }
      }
    }
  }
}
</style>
