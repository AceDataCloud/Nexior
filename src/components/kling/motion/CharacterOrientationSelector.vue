<template>
  <div class="field">
    <div class="header">
      <span class="text-sm font-bold">{{ $t('kling.name.characterOrientation') }}</span>
      <info-icon :content="$t('kling.description.characterOrientation')" />
    </div>
    <el-radio-group v-model="value" size="small" class="value">
      <el-radio-button label="image">{{ $t('kling.name.orientationImage') }}</el-radio-button>
      <el-radio-button label="video">{{ $t('kling.name.orientationVideo') }}</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElRadioGroup, ElRadioButton } from 'element-plus';
import InfoIcon from '@/components/common/InfoIcon.vue';

const DEFAULT: 'image' | 'video' = 'video';

export default defineComponent({
  name: 'CharacterOrientationSelector',
  components: {
    ElRadioGroup,
    ElRadioButton,
    InfoIcon
  },
  computed: {
    value: {
      get(): 'image' | 'video' {
        return this.$store.state.kling?.motionConfig?.character_orientation || DEFAULT;
      },
      set(val: 'image' | 'video') {
        this.$store.commit('kling/setMotionConfig', {
          ...this.$store.state.kling?.motionConfig,
          character_orientation: val
        });
      }
    }
  },
  mounted() {
    if (!this.$store.state.kling?.motionConfig?.character_orientation) {
      this.value = DEFAULT;
    }
  }
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
}
</style>
