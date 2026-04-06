<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="searching" class="flex flex-col items-center justify-center py-20">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="noResults" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <font-awesome-icon icon="fa-solid fa-search" class="text-4xl mb-4" />
      <p>{{ $t('serp.message.noResults') }}</p>
    </div>
    <div v-else-if="results" class="max-w-3xl mx-auto">
      <knowledge-graph v-if="results.knowledge_graph?.title" :data="results.knowledge_graph" class="mb-6" />
      <div v-if="results.organic?.length" class="mb-6">
        <organic-result v-for="(item, index) in results.organic" :key="index" :data="item" class="mb-5" />
      </div>
      <image-results v-if="results.images?.length" :data="results.images" class="mb-6" />
      <people-also-ask v-if="results.people_also_ask?.length" :data="results.people_also_ask" class="mb-6" />
      <related-searches
        v-if="results.related_searches?.length"
        :data="results.related_searches"
        class="mb-6"
        @search="onRelatedSearch"
      />
    </div>
    <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
      <font-awesome-icon icon="fa-solid fa-search" class="text-4xl mb-4" />
      <p>{{ $t('serp.description.query') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElSkeleton } from 'element-plus';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Status } from '@/models';
import KnowledgeGraph from './result/KnowledgeGraph.vue';
import OrganicResult from './result/OrganicResult.vue';
import ImageResults from './result/ImageResults.vue';
import PeopleAlsoAsk from './result/PeopleAlsoAsk.vue';
import RelatedSearches from './result/RelatedSearches.vue';

export default defineComponent({
  name: 'ResultPanel',
  components: {
    ElSkeleton,
    FontAwesomeIcon,
    KnowledgeGraph,
    OrganicResult,
    ImageResults,
    PeopleAlsoAsk,
    RelatedSearches
  },
  emits: ['related-search'],
  computed: {
    results() {
      return this.$store.state.serp?.results;
    },
    searching() {
      return this.$store.state.serp?.status?.search === Status.Request;
    },
    noResults() {
      return (
        this.$store.state.serp?.status?.search === Status.Success &&
        this.results &&
        !this.results.organic?.length &&
        !this.results.knowledge_graph?.title
      );
    }
  },
  methods: {
    onRelatedSearch(query: string) {
      this.$emit('related-search', query);
    }
  }
});
</script>
