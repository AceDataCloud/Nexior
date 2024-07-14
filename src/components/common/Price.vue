<template>
  <div class="price-text">
    <span v-if="price > 0" class="unfree"
      >{{ getPriceString({ value: price }) }} {{ unit ? ` / ${unit}` : ''
      }}{{ start ? $t('common.message.startPrice') : '' }}
    </span>
    <span v-else class="free">
      {{ $t('common.message.free') }}
    </span>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { getPriceString } from '@/utils';

export default defineComponent({
  name: 'ApiPrice',
  props: {
    price: {
      type: Number,
      required: false,
      default: 0
    },
    unit: {
      type: String,
      required: false,
      default: undefined
    },
    start: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    getPriceString
  }
});
</script>

<style lang="scss" scoped>
.price-text {
  display: inline-block;
  margin: 0;
}
</style>
