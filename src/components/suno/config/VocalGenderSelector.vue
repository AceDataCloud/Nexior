<template>
  <div>
    <div class="flex items-center mb-1">
      <span class="text-sm font-bold">{{ $t('suno.name.vocalGender') }}</span>
      <info-icon :content="$t('suno.description.vocalGender')" />
    </div>
    <el-radio-group v-model="vocalGender" size="small">
      <el-radio-button value="">{{ $t('suno.gender.auto') }}</el-radio-button>
      <el-radio-button value="f">{{ $t('suno.gender.female') }}</el-radio-button>
      <el-radio-button value="m">{{ $t('suno.gender.male') }}</el-radio-button>
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
        return this.$store.state.suno?.config?.vocal_gender || '';
      },
      set(val: string) {
        this.$store.commit('suno/setConfig', {
          ...this.$store.state.suno?.config,
          vocal_gender: val || undefined
        });
      }
    }
  }
});
</script>
