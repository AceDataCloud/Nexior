<template>
  <div class="field">
    <div class="label">
      <div class="box">
        <h2 class="title font-bold">{{ $t('nanobanana.name.task') }}</h2>
        <info-icon :content="actionDescription" class="info" />
      </div>
    </div>
    <el-select v-model="value" class="value" :placeholder="$t('nanobanana.placeholder.select')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { NANOBANANA_DEFAULT_ACTION } from '@/constants';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'ActionSelector',
  components: {
    ElSelect,
    ElOption,
    InfoIcon
  },
  props: {
    modelValue: {
      type: String,
      default: undefined
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      options: [
        {
          value: 'generate',
          label: this.$t('nanobanana.name.generate')
        },
        {
          value: 'edit',
          label: this.$t('nanobanana.name.edits')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.nanobanana?.config?.action;
      },
      set(val: string) {
        this.$store.commit('nanobanana/setConfig', {
          ...this.$store.state.nanobanana.config,
          action: val
        });
      }
    },
    actionDescription(): string {
      const fallback =
        'The action to generate the images. If generate, images are generated from the prompt; if edit, they are edited based on the prompt and uploaded images.';
      return (this as any).$te('nanobanana.description.action')
        ? (this.$t('nanobanana.description.action') as string)
        : fallback;
    }
  },
  mounted() {
    if (!this.value) {
      this.value = NANOBANANA_DEFAULT_ACTION;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  .label {
    width: 30%;
    display: flex;
    align-items: center;

    .box {
      display: flex;
      flex-direction: row;
      align-items: center;

      .title {
        font-size: 14px;
        margin: 0;
      }

      .info {
        margin-left: 6px;
      }
    }
  }

  .value {
    width: 160px;
  }
}
</style>
