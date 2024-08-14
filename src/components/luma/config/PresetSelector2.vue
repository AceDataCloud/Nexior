<template>
  <div class="field">
    <h2 class="title">{{ $t('qrart.name.preset') }}</h2>
    <div class="pane">
      <div
        v-for="(option, optionKey) in options"
        :key="optionKey"
        :class="{
          item: true,
          active: value === option.value
        }"
        @click="value === option.value ? (value = undefined) : (value = option.value)"
      >
        <el-image :src="option.url" fit="fill" class="preview" />
        <span class="name">{{ option.label }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { QRART_DEFAULT_PRESET } from '@/constants';
import { defineComponent } from 'vue';
import { ElImage } from 'element-plus';

export default defineComponent({
  name: 'PresetSelector',
  components: {
    ElImage
  },
  data() {
    return {
      options: [
        {
          value: 'sunset',
          label: this.$t('qrart.preset.sunset'),
          url: 'https://cdn.acedata.cloud/rp1h1s.png'
        },
        {
          value: 'floral',
          label: this.$t('qrart.preset.floral'),
          url: 'https://cdn.acedata.cloud/upyikx.png'
        },
        {
          value: 'snowflakes',
          label: this.$t('qrart.preset.snowflakes'),
          url: 'https://cdn.acedata.cloud/j447da.png'
        },
        {
          value: 'feathers',
          label: this.$t('qrart.preset.feathers'),
          url: 'https://cdn.acedata.cloud/d2ctz9.png'
        },
        {
          value: 'raindrops',
          label: this.$t('qrart.preset.raindrops'),
          url: 'https://cdn.acedata.cloud/xv2t3s.png'
        },
        {
          value: 'ultra-realism',
          label: this.$t('qrart.preset.ultraRealism'),
          url: 'https://cdn.acedata.cloud/nlor4y.png'
        },
        {
          value: 'epic-realms',
          label: this.$t('qrart.preset.epicRealms'),
          url: 'https://cdn.acedata.cloud/wwzkvy.png'
        },
        {
          value: 'intricate-studio',
          label: this.$t('qrart.preset.intricateStudio'),
          url: 'https://cdn.acedata.cloud/4kzf5y.png'
        },
        {
          value: 'symmetric-masterpiece',
          label: this.$t('qrart.preset.symmetricMasterpiece'),
          url: 'https://cdn.acedata.cloud/ff4ii2.png'
        },
        {
          value: 'luminous-highway',
          label: this.$t('qrart.preset.luminousHighway'),
          url: 'https://cdn.acedata.cloud/cliodt.png'
        },
        {
          value: 'celestial-journey',
          label: this.$t('qrart.preset.celestialJourney'),
          url: 'https://cdn.acedata.cloud/ejellf.png'
        },
        {
          value: 'neon-mech',
          label: this.$t('qrart.preset.neonMech'),
          url: 'https://cdn.acedata.cloud/3z0y6z.png'
        },
        {
          value: 'ethereal-low-poly',
          label: this.$t('qrart.preset.etherealLowPoly'),
          url: 'https://cdn.acedata.cloud/36o0mm.png'
        },
        {
          value: 'golden-vista',
          label: this.$t('qrart.preset.goldenVista'),
          url: 'https://cdn.acedata.cloud/xa0267.png'
        },
        {
          value: 'cinematic-expanse',
          label: this.$t('qrart.preset.cinematicExpanse'),
          url: 'https://cdn.acedata.cloud/krl5qp.png'
        },
        {
          value: 'cinematic-warm',
          label: this.$t('qrart.preset.cinematicWarm'),
          url: 'https://cdn.acedata.cloud/e1aahg.png'
        },
        {
          value: 'desolate-wilderness',
          label: this.$t('qrart.preset.desolateWilderness'),
          url: 'https://cdn.acedata.cloud/9evqqu.png'
        },
        {
          value: 'vibrant-palette',
          label: this.$t('qrart.preset.vibrantPalette'),
          url: 'https://cdn.acedata.cloud/3fvsmz.png'
        },
        {
          value: 'enigmatic-journey',
          label: this.$t('qrart.preset.enigmaticJourney'),
          url: 'https://cdn.acedata.cloud/l6kku0.png'
        },
        {
          value: 'timeless-cinematic',
          label: this.$t('qrart.preset.timelessCinematic'),
          url: 'https://cdn.acedata.cloud/h5mzyn.png'
        },
        {
          value: 'regal-galaxy',
          label: this.$t('qrart.preset.regalGalaxy'),
          url: 'https://cdn.acedata.cloud/czkegd.png'
        },
        {
          value: 'illustrious-canvas',
          label: this.$t('qrart.preset.illustriousCanvas'),
          url: 'https://cdn.acedata.cloud/m8hwzh.png'
        },
        {
          value: 'expressive-mural',
          label: this.$t('qrart.preset.expressiveMural'),
          url: 'https://cdn.acedata.cloud/g4v1rb.png'
        },
        {
          value: 'serene-haze',
          label: this.$t('qrart.preset.sereneHaze'),
          url: 'https://cdn.acedata.cloud/3w3ixr.png'
        }
      ]
    };
  },
  computed: {
    value: {
      get() {
        return this.$store.state.qrart?.config?.preset;
      },
      set(val) {
        console.debug('set qrw', val);
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
  flex-direction: column;
  align-items: left;

  .title {
    font-size: 14px;
    margin: 0;
    width: 30%;
    margin-bottom: 10px;
  }

  .pane {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
    flex-wrap: wrap;
    height: auto;
    max-height: 210px;
    overflow-y: scroll;

    @media (max-width: 767px) {
      justify-content: center;
    }
    .item {
      $height: 100px;
      $width: 100px;
      position: relative;
      width: $width;
      height: $height;
      margin-right: 8px;
      margin-bottom: 8px;
      border-width: 3px;
      border-style: solid;
      border-color: var(--el-border-color);
      border-radius: 5px;
      overflow: hidden;
      cursor: pointer;

      &.hidden {
        display: none;
      }

      &.active {
        border-color: var(--el-color-primary);
      }

      .preview {
        width: $height;
        height: $width;
      }
      .name {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        width: $width;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 10px;
        text-align: center;
        padding: 0 5px;
      }
    }
  }
}
</style>
