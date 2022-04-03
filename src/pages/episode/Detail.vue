<template>
  <el-row>
    <el-col :span="6" class="side">
      <el-row>
        <el-col :span="24">
          <course-preview-card :course="course" v-if="course" />
          <episode-side-list :episodes="episodes" :active="id" @choose="onChoose($event)" />
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="18" class="main">
      <!-- <episode-player :resource="episode?.resourceUrl" v-if="episode?.resourceUrl" :preview="episode?.thumbnail" /> -->
      <episode-player
        resource="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        v-if="episode?.resourceUrl"
        :preview="episode?.thumbnail"
      />
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeDetailResponse, IEpisodeListResponse } from '@/services/episode/types';
import { defineComponent } from 'vue';
import EpisodeSideList from '@/components/episode/SideList.vue';
import EpisodePlayer from '@/components/episode/Player.vue';
import CoursePreviewCard from '@/components/course/PreviewCard.vue';
import { courseService } from '@/services/course/service';
import { ICourse, ICourseDetailResponse } from '@/services/course/types';

interface IData {
  course: ICourse | undefined;
  episode: IEpisode | undefined;
  episodes: IEpisode[];
  loading: boolean;
  // id: number;
  // courseId: number;
}

export default defineComponent({
  name: 'EpisodeDetail',
  components: {
    EpisodeSideList,
    EpisodePlayer,
    CoursePreviewCard
  },
  data(): IData {
    return {
      course: undefined,
      episode: undefined,
      loading: false,
      episodes: []
    };
  },
  computed: {
    id() {
      return parseInt(this.$route.params.id.toString());
    },
    courseId() {
      return parseInt(this.$route.params.courseId.toString());
    }
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
    courseService.get(this.courseId).then(({ data: data }: { data: ICourseDetailResponse }) => {
      this.course = data;
    });
  },
  methods: {
    onChoose(episode: IEpisode) {
      console.log('e', episode);
      this.$router.push({
        ...this.$route,
        params: {
          id: episode.id,
          courseId: this.courseId
        }
      });
      episodeService.get(this.id).then(({ data: data }: { data: IEpisodeDetailResponse }) => {
        this.episode = data;
      });
    }
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
