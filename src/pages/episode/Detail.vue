<template>
  <el-row>
    <el-col :span="5" class="side">
      <el-row>
        <el-col :span="24">
          <course-preview-card v-if="course" :course="course" />
          <episode-side-list :episodes="episodes" :active="id" @choose="onChoose($event)" />
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="19" class="main">
      <div v-if="paid === true || episode?.isFree">
        <episode-player v-if="episode?.resourceUrl" :resource="episode?.resourceUrl" :preview="episode?.thumbnail" />
      </div>
      <div v-if="paid === false && !episode?.isFree">
        {{ $t('course.message.needPay') }}
      </div>
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
import { ICourse, ICourseDetailResponse, ICoursePaidStatusResponse } from '@/services/course/types';

interface IData {
  course: ICourse | undefined;
  episode: IEpisode | undefined;
  episodes: IEpisode[];
  loading: boolean;
  paid: boolean | undefined;
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
      episodes: [],
      paid: undefined
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
    courseService.paid(this.courseId).then(({ data: { paid } }: { data: ICoursePaidStatusResponse }) => {
      this.paid = paid;
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
  min-height: 100vh;
  overflow-y: scroll;
  width: $width;
}
.main {
  width: calc(100% - $width);
}
</style>
