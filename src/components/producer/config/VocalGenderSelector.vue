<template>
  <div class="mb-2">
    <div class="flex items-center mb-1">
      <span class="text-sm font-bold">{{ $t('producer.name.vocalGender') }}</span>
      <info-icon :content="$t('producer.description.vocalGender')" />
    </div>
    <el-radio-group v-model="vocalGender" size="small">
      <el-radio-button value="">{{ $t('producer.gender.auto') }}</el-radio-button>
      <el-radio-button value="f">{{ $t('producer.gender.female') }}</el-radio-button>
      <el-radio-button value="m">{{ $t('producer.gender.male') }}</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRadioGroup, ElRadioButton } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

export default defineComponent({
  name: 'VocalGenderSelector',
  components: {
    ElRadioGroup,
    ElRadioButton,
    InfoIcon
  },
  computed: {
    vocalGender: {
      get() {
        return this.$store.state.producer?.config?.vocal_gender || '';
      },
      set(val: string) {
        this.$store.commit('producer/setConfig', {
          ...this.$store.state.producer?.config,
          vocal_gender: val || undefined
        });
      }
    }
  }
});
</script>
