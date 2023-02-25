<template>
  <div class="price-text">
    <span v-if="price > 0" class="unfree">￥{{ price }} {{ unit ? `/${unit}` : '' }}</span>
    <span v-else class="free">
      {{ $t('api.message.free') }}
    </span>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
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
    }
  }
});
</script>

<style lang="scss" scoped>
.price-text {
  display: inline-block;
  margin: 0;
  .unfree {
    color: #ff5441;

    .value {
      font-weight: bold;
      color: #ff5441;
      font-size: 30px;
    }

    .unit {
      color: #666;
    }
  }
  .free {
    color: #29c287;
  }
}
</style>
