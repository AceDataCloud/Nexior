<template>
  <el-row>
    <el-col :span="6" class="side">
      <el-row>
        <el-col :span="24">
          <episode-side-list :episodes="episodes"></episode-side-list>
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="18" class="main">
      <episode-player :resource="episode?.resourceUrl" v-if="episode?.resourceUrl" :preview="episode?.thumbnail" />
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeDetailResponse, IEpisodeListResponse } from '@/services/episode/types';
import { defineComponent } from 'vue';
import EpisodeSideList from '@/components/episode/SideList.vue';
import EpisodePlayer from '@/components/episode/Player.vue';

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
    EpisodeSideList,
    EpisodePlayer
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
$width: 300px;

.side {
  background-color: #0d131d;
  height: 100vh;
  overflow-y: scroll;
  width: $width;
}
.main {
  width: calc(100% - $width);
}
</style>
