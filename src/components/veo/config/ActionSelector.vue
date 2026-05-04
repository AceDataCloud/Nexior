<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('veo.name.action') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('veo.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
      </el-option>
    </el-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { VEO_DEFAULT_ACTION } from '@/constants';

export default defineComponent({
  name: 'ActionSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {};
  },
  computed: {
    options() {
      return [
        {
          value: 'text2video',
          label: this.$t('veo.button.action1')
        },
        {
          value: 'image2video',
          label: this.$t('veo.button.action2')
        },
        {
          value: 'ingredients2video',
          label: this.$t('veo.button.actionIngredients')
        },
        {
          value: 'upsample',
          label: this.$t('veo.button.actionUpsample')
        },
        {
          value: 'extend',
          label: this.$t('veo.button.actionExtend')
        },
        {
          value: 'reshoot',
          label: this.$t('veo.button.actionReshoot')
        },
        {
          value: 'object_insert',
          label: this.$t('veo.button.actionObjectInsert')
        },
        {
          value: 'object_remove',
          label: this.$t('veo.button.actionObjectRemove')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.veo?.config?.action;
      },
      set(val: string) {
        this.$store.commit('veo/setConfig', {
          ...this.$store.state.veo?.config,
          action: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = VEO_DEFAULT_ACTION;
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
    margin: 0;
    width: 30%;
  }
  .value {
    flex: 1;
  }
}
</style>
