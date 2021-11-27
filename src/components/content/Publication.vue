<template>
  <el-card shadow="hover">
    <el-table :data="platforms" v-loading="loading">
      <el-table-column prop="icon" :label="$t('common.entity.icon')">
        <template #default="scope">
          <img :src="scope.row.icon" class="w-10" />
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t('common.entity.platform')"> </el-table-column>
      <el-table-column :label="$t('common.entity.operation')">
        <template #default="scope">
          <el-button type="primary" size="small" round @click="onPublish(scope.row)">
            {{ $t('common.button.publish') }}</el-button
          >
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.entity.status')">
        <template #default="scope">
          <el-button
            type="info"
            size="small"
            round
            v-if="isEqual(getPublicationState(scope.row.id, articleId), PUBLICATION_STATE_PENDING)"
          >
            {{ $t('publication.state.' + getPublicationState(scope.row.id, articleId)) }}</el-button
          >
          <el-button
            type="primary"
            size="small"
            round
            v-if="isEqual(getPublicationState(scope.row.id, articleId), PUBLICATION_STATE_RUNNING)"
          >
            {{ $t('publication.state.' + getPublicationState(scope.row.id, articleId)) }}</el-button
          >
          <el-button
            type="success"
            size="small"
            round
            v-if="isEqual(getPublicationState(scope.row.id, articleId), PUBLICATION_STATE_FINISHED)"
          >
            {{ $t('publication.state.' + getPublicationState(scope.row.id, articleId)) }}</el-button
          >
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IPlatform, IPlatformListResponse } from '@/services/content/platform/types';
import {
  CREDENTIAL_TYPE_COOKIES,
  IPublication,
  IPublicationCreateRequest,
  IPublicationDetailResponse,
  IPublicationListResponse
} from '@/services/content/Publication/types';
import { PUBLICATION_STATE_MAP } from '@/services/content/publication/constants';
import PlatformService from '@/services/content/platform/service';
import PublicationService from '@/services/content/publication/service';
import { Constants, Methods } from '@/mixins/index';

interface IData {
  platforms: IPlatform[];
  publications: IPublication[];
  loading: boolean;
}

export default defineComponent({
  mixins: [Constants, Methods],
  components: {},
  data(): IData {
    return {
      platforms: [],
      publications: [],
      loading: false
    };
  },
  props: {
    articleId: {
      type: String,
      required: true
    }
  },
  async mounted() {
    this.loading = true;
    Promise.all([PlatformService.getAll(), PublicationService.getAll()]).then(([data1, data2]) => {
      const platforms = data1.data.results;
      const publications = data2.data.results;
      this.platforms = platforms;
      this.publications = publications;
      this.loading = false;
    });
  },
  methods: {
    onPublish(platform: IPlatform) {
      const articleId = this.articleId;
      const data: IPublicationCreateRequest = {
        platform: platform.id,
        article: articleId,
        credential: JSON.stringify(this.$store.getters.cookies(platform.alias)),
        credentialType: CREDENTIAL_TYPE_COOKIES
      };
      PublicationService.create(data).then(({ data: data }: { data: IPublicationDetailResponse }) => {
        console.log('data', data);
        this.onRefreshPublications();
      });
    },
    onRefreshPublications() {
      PublicationService.getAll().then(({ data: data }: { data: IPublicationListResponse }) => {
        this.publications = data.results;
      });
    },
    getPublicationState(platformId: number, articleId: string) {
      const publications: IPublication[] = this.publications;
      const filteredPublications: IPublication[] = publications.filter((item: IPublication) => {
        return item.article.id === articleId && item.platform.id === platformId;
      });
      if (filteredPublications && filteredPublications.length > 0) {
        return PUBLICATION_STATE_MAP[filteredPublications[0].state];
      }
    }
  }
});
</script>

<style lang="scss"></style>
