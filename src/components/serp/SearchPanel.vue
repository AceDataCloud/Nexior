<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-5">
      <query-input class="mb-4" />
      <type-selector class="mb-4" />
      <country-input class="mb-4" />
      <language-input class="mb-4" />
    </div>
    <div class="flex flex-col items-center justify-center px-5 pb-5">
      <consumption :value="consumption" :service="service" />
      <el-button type="primary" class="btn w-full" round :loading="searching" @click="onSearch">
        <search-icon class="mr-2" :size="'1em' as any" aria-hidden="true" focusable="false" />
        {{ $t('serp.button.search') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { SearchIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import QueryInput from './config/QueryInput.vue';
import TypeSelector from './config/TypeSelector.vue';
import CountryInput from './config/CountryInput.vue';
import LanguageInput from './config/LanguageInput.vue';
import Consumption from '../common/Consumption.vue';
import { getConsumption } from '@/utils';
import { Status } from '@/models';

export default defineComponent({
  name: 'SearchPanel',
  components: {
    SearchIcon,
    ElButton,
    QueryInput,
    TypeSelector,
    CountryInput,
    LanguageInput,
    Consumption
  },
  emits: ['search'],
  computed: {
    config() {
      return this.$store.state.serp?.config;
    },
    consumption() {
      return getConsumption(this.config, this.service?.cost);
    },
    service() {
      return this.$store.state.serp?.service;
    },
    searching() {
      return this.$store.state.serp?.status?.search === Status.Request;
    }
  },
  methods: {
    onSearch() {
      this.$emit('search');
    }
  }
});
</script>
