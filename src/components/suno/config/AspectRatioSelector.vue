<template>
  <div class="field">
    <h2 class="title">{{ $t('suno.name.description') }}</h2>
    <info-icon :content="$t('suno.description.qrw')" class="info" />
    <!-- <div class="items">
      <div class="item">
        <el-input
          v-model="description"
          type="textarea"
          :rows="3"
          placeholder="Enter your song description here"
          resize="none"
        />
        <div class="character-count">0/200</div>
      </div>
    </div> -->
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { SUNO_DEFAULT_ASPECT_RATIO } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';
export default defineComponent({
  name: 'AspectRatioSelector',
  components: {
    InfoIcon
  },
  data() {
    return {
      options: [
        {
          value: '1:1',
          label: '1:1',
          width: 30,
          height: 30
        },
        {
          value: '4:3',
          label: '4:3',
          width: 32,
          height: 24
        },
        {
          value: '3:4',
          label: '3:4',
          width: 24,
          height: 32
        },
        {
          value: '16:9',
          label: '16:9',
          width: 32,
          height: 18
        },
        {
          value: '9:16',
          label: '9:16',
          width: 18,
          height: 32
        }
      ]
    };
  },
  computed: {
    active() {
      return this.options.findIndex((option) => option.value === this.value) || 0;
    },
    value: {
      get() {
        return this.$store.state.suno?.config?.aspect_ratio;
      },
      set(val) {
        console.debug('set aspect ratio', val);
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          aspect_ratio: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = SUNO_DEFAULT_ASPECT_RATIO;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  .title {
    font-size: 14px;
    margin-bottom: 10px;
  }
  .items {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    .item {
      width: 100%;
      padding: 8px;
      font-size: 16px;

      resize: vertical; /* 允许垂直调整大小 */

      .preview {
        margin-top: 8px;
        width: 30px;
        height: 30px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;

        .rect {
          border: 2px solid var(--el-border-color);
          width: 20px;
          height: 20px;
          border-radius: 2px;
        }
      }

      .name {
        display: block;
        font-size: 12px;
        color: var(--el-text-color-primary);
      }

      &.active {
        border-color: var(--el-color-primary);
        .rect {
          border-color: var(--el-color-primary);
        }
      }
    }
  }
}
</style>
