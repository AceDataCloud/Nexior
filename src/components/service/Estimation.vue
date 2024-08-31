<template>
  <div class="estimation">
    <div v-for="(api, apiIndex) in service?.apis" :key="apiIndex">
      <div v-for="(item, itemIndex) in api?.estimation" :key="itemIndex" class="items">
        <p v-if="package?.amount && item?.cost" class="item">
          ≈ {{ item.name }} {{ Math.round(package.amount / item.cost) }} {{ $t('api.unit.count') }}
          <span v-if="package.price > 0">
            -
            {{
              getPriceString({ value: package.price / (package.amount / item.cost), fractionDigits: 3 }) +
              ' / ' +
              $t(`api.unit.count`)
            }}
          </span>
          <span v-if="item.remark"> ({{ item.remark }}) </span>
          <span v-if="item?.comparisons?.length > 0"> - </span>
          <span v-for="(comparison, comparisonIndex) in item?.comparisons" :key="comparisonIndex" class="comparison">
            <i v-if="comparison?.value < 0">
              {{ $t('api.message.cheaperThan').replace('$[[value]]', comparison?.target?.toString()) }}
              {{ Math.abs(comparison?.value) * 100 }}%
            </i>
            <i v-if="comparison?.value > 0">
              {{ $t('api.message.moreExpensiveThan').replace('$[[value]]', comparison?.target?.toString()) }}
              {{ Math.abs(comparison?.value) * 100 }}%
            </i>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IService, IPackage } from '@/operators';
import { defineComponent } from 'vue';
import { getPriceString } from '@/utils';

export default defineComponent({
  name: 'ServiceEstimation',
  components: {},
  props: {
    service: {
      type: Object as () => IService | undefined,
      required: true
    },
    package: {
      type: Object as () => IPackage | undefined,
      required: true
    }
  },
  methods: {
    getPriceString
  }
});
</script>

<style lang="scss" scoped>
.estimation {
  .items {
    line-height: initial;
    border: none;
    padding: initial;
    border-radius: initial;
    .item {
      font-size: 12px;
      color: var(--text-color-secondary);
      margin-bottom: 5px;
      .comparison {
        i {
          font-style: normal;
        }
      }
    }
  }
}
</style>
