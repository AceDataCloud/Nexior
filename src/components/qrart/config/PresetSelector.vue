<template>
  <div class="field">
    <span class="text-sm font-bold block mb-2">{{ $t('qrart.name.preset') }}</span>
    <el-select v-model="value" clearable class="value" :placeholder="$t('qrart.placeholder.preset')">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </div>
</template>

<script lang="ts">
import { QRART_DEFAULT_PRESET } from '@/constants';
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'PresetSelector',
  components: {
    ElSelect,
    ElOption
  },
  data() {
    return {
      options: [
        {
          value: 'sunset',
          label: this.$t('qrart.preset.sunset')
        },
        {
          value: 'floral',
          label: this.$t('qrart.preset.floral')
        },
        {
          value: 'snowflakes',
          label: this.$t('qrart.preset.snowflakes')
        },
        {
          value: 'feathers',
          label: this.$t('qrart.preset.feathers')
        },
        {
          value: 'raindrops',
          label: this.$t('qrart.preset.raindrops')
        },
        {
          value: 'ultra-realism',
          label: this.$t('qrart.preset.ultraRealism')
        },
        {
          value: 'epic-realms',
          label: this.$t('qrart.preset.epicRealms')
        },
        {
          value: 'intricate-studio',
          label: this.$t('qrart.preset.intricateStudio')
        },
        {
          value: 'symmetric-masterpiece',
          label: this.$t('qrart.preset.symmetricMasterpiece')
        },
        {
          value: 'luminous-highway',
          label: this.$t('qrart.preset.luminousHighway')
        },
        {
          value: 'celestial-journey',
          label: this.$t('qrart.preset.celestialJourney')
        },
        {
          value: 'neon-mech',
          label: this.$t('qrart.preset.neonMech')
        },
        {
          value: 'ethereal-low-poly',
          label: this.$t('qrart.preset.etherealLowPoly')
        },
        {
          value: 'golden-vista',
          label: this.$t('qrart.preset.goldenVista')
        },
        {
          value: 'cinematic-expanse',
          label: this.$t('qrart.preset.cinematicExpanse')
        },
        {
          value: 'cinematic-warm',
          label: this.$t('qrart.preset.cinematicWarm')
        },
        {
          value: 'desolate-wilderness',
          label: this.$t('qrart.preset.desolateWilderness')
        },
        {
          value: 'vibrant-palette',
          label: this.$t('qrart.preset.vibrantPalette')
        },
        {
          value: 'enigmatic-journey',
          label: this.$t('qrart.preset.enigmaticJourney')
        },
        {
          value: 'timeless-cinematic',
          label: this.$t('qrart.preset.timelessCinematic')
        },
        {
          value: 'regal-galaxy',
          label: this.$t('qrart.preset.regalGalaxy')
        },
        {
          value: 'illustrious-canvas',
          label: this.$t('qrart.preset.illustriousCanvas')
        },
        {
          value: 'expressive-mural',
          label: this.$t('qrart.preset.expressiveMural')
        },
        {
          value: 'serene-haze',
          label: this.$t('qrart.preset.sereneHaze')
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.preset;
      },
      set(val: string) {
        console.debug('set qrart preset', val);
        this.$store.commit('qrart/setConfig', {
          ...this.$store.state.qrart?.config,
          preset: val
        });
      }
    }
  },
  mounted() {
    if (!this.value) {
      this.value = QRART_DEFAULT_PRESET;
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
