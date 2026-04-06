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
        <font-awesome-icon icon="fa-solid fa-search" class="mr-2" />
        {{ $t('serp.button.search') }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElButton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
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
    ElButton,
    FontAwesomeIcon,
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
