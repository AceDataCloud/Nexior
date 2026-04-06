<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="searching" class="max-w-3xl mx-auto py-8">
      <div v-for="i in 4" :key="i" class="mb-6 animate-pulse">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-4 h-4 rounded-sm bg-[var(--el-fill-color-darker)]" />
          <div class="h-3 w-32 rounded bg-[var(--el-fill-color-darker)]" />
        </div>
        <div class="h-4 w-3/4 rounded bg-[var(--el-fill-color-dark)] mb-2" />
        <div class="h-3 w-full rounded bg-[var(--el-fill-color)] mb-1" />
        <div class="h-3 w-5/6 rounded bg-[var(--el-fill-color)]" />
      </div>
    </div>
    <div
      v-else-if="noResults"
      class="flex flex-col items-center justify-center py-24 text-[var(--el-text-color-disabled)]"
    >
      <font-awesome-icon icon="fa-solid fa-face-meh" class="text-5xl mb-4 opacity-40" />
      <p class="text-base">{{ $t('serp.message.noResults') }}</p>
    </div>
    <div v-else-if="results" class="max-w-3xl mx-auto">
      <knowledge-graph v-if="results.knowledge_graph?.title" :data="results.knowledge_graph" class="mb-6" />
      <div v-if="results.organic?.length" class="mb-6">
        <organic-result v-for="(item, index) in results.organic" :key="index" :data="item" class="mb-1" />
      </div>
      <image-results v-if="results.images?.length" :data="results.images" class="mb-6" />
      <video-results v-if="results.videos?.length" :data="results.videos" class="mb-6" />
      <news-results v-if="results.news?.length" :data="results.news" class="mb-6" />
      <people-also-ask v-if="results.people_also_ask?.length" :data="results.people_also_ask" class="mb-6" />
      <related-searches
        v-if="results.related_searches?.length"
        :data="results.related_searches"
        class="mb-6"
        @search="onRelatedSearch"
      />
    </div>
    <div v-else class="flex flex-col items-center justify-center py-24 text-[var(--el-text-color-disabled)]">
      <font-awesome-icon icon="fa-solid fa-globe" class="text-5xl mb-4 opacity-30" />
      <p class="text-base">{{ $t('serp.description.query') }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { Status } from '@/models';
import KnowledgeGraph from './result/KnowledgeGraph.vue';
import OrganicResult from './result/OrganicResult.vue';
import ImageResults from './result/ImageResults.vue';
import VideoResults from './result/VideoResults.vue';
import NewsResults from './result/NewsResults.vue';
import PeopleAlsoAsk from './result/PeopleAlsoAsk.vue';
import RelatedSearches from './result/RelatedSearches.vue';

export default defineComponent({
  name: 'ResultPanel',
  components: {
    FontAwesomeIcon,
    KnowledgeGraph,
    OrganicResult,
    ImageResults,
    VideoResults,
    NewsResults,
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
        !this.results.images?.length &&
        !this.results.videos?.length &&
        !this.results.news?.length &&
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
