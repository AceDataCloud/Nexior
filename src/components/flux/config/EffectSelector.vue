<template>
  <div class="field">
    <h2 class="title font-bold">{{ $t('pika.name.effect') }}</h2>
    <el-select v-model="value" class="value" :placeholder="$t('pika.placeholder.select')" clearable>
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
        <span class="float-left">{{ item.label }}</span>
        <!-- <span class="float-right">{{ item.value }}</span> -->
      </el-option>
    </el-select>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

export default defineComponent({
  name: 'EffectSelector',
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
          value: 'Levitate',
          label: this.$t('pika.style.effect1')
        },
        {
          value: 'Decapitate',
          label: this.$t('pika.style.effect2')
        },
        {
          value: 'Eye-pop',
          label: this.$t('pika.style.effect3')
        },
        {
          value: 'Ta-da',
          label: this.$t('pika.style.effect4')
        },
        {
          value: 'Deflate',
          label: this.$t('pika.style.effect5')
        },
        {
          value: 'Crumble',
          label: this.$t('pika.style.effect6')
        },
        {
          value: 'Dissolve',
          label: this.$t('pika.style.effect7')
        },
        {
          value: 'Squish',
          label: this.$t('pika.style.effect8')
        },
        {
          value: 'Inflate',
          label: this.$t('pika.style.effect9')
        },
        {
          value: 'Melt',
          label: this.$t('pika.style.effect10')
        },
        {
          value: 'Cake-ify',
          label: this.$t('pika.style.effect11')
        },
        {
          value: 'Crush',
          label: this.$t('pika.style.effect12')
        },
        {
          value: 'Explode',
          label: this.$t('pika.style.effect13')
        }
      ];
    },
    value: {
      get() {
        return this.$store.state.pika?.config?.effect;
      },
      set(val) {
        this.$store.commit('pika/setConfig', {
          ...this.$store.state.pika?.config,
          effect: val
        });
      }
    }
  },
  watch: {},
  mounted() {}
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
