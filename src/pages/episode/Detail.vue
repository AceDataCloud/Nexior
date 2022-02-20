<template>
  <el-row>
    <el-col :span="6">
      <el-row class="side">
        <el-col :span="24">
          <episode-side-list :episodes="episodes"></episode-side-list>
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="18"> </el-col>
  </el-row>
</template>

<script lang="ts">
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeDetailResponse, IEpisodeListResponse } from '@/services/episode/types';
import { defineComponent } from 'vue';
import EpisodeSideList from '@/components/episode/SideList.vue';

interface IData {
  episode: IEpisode | undefined;
  episodes: IEpisode[];
  loading: boolean;
  id: number;
  courseId: number;
}

export default defineComponent({
  name: 'EpisodeDetail',
  components: {
    EpisodeSideList
  },
  data(): IData {
    return {
      id: parseInt(this.$route.params.id.toString()),
      courseId: parseInt(this.$route.params.courseId.toString()),
      episode: undefined,
      loading: false,
      episodes: []
    };
  },
  async mounted() {
    this.loading = true;
    episodeService.get(this.id).then(({ data: data }: { data: IEpisodeDetailResponse }) => {
      this.loading = false;
      this.episode = data;
    });
    episodeService.getAllForCourse(this.courseId).then(({ data: data }: { data: IEpisodeListResponse }) => {
      this.episodes = data.items;
    });
  }
});
</script>

<style lang="scss" scoped>
.side {
  background-color: #0d131d;
  height: 100vh;
  overflow-y: scroll;
  width: 300px;
}
</style>
