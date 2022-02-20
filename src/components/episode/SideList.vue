<template>
  <el-row v-for="(episode, episodeIndex) in episodes" class="item">
    <el-col :span="6" class="left">
      <span class="index">
        {{ episodeIndex }}
      </span>
    </el-col>
    <el-col :span="18" class="right">
      <p class="title">
        {{ episode?.title }}
      </p>
      <p class="info">
        <span class="duration">
          <el-icon class="icon">
            <clock />
          </el-icon>
          {{ episode.duration }}
        </span>
      </p>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IEpisode, IEpisodeDetailResponse, IEpisodeListResponse } from '@/services/episode/types';
import { Clock } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'EpisodeSideList',
  components: {
    Clock
  },
  props: {
    episodes: {
      type: Array as () => IEpisode[],
      default() {
        return [];
      }
    }
  },
  mounted() {},
  methods: {}
});
</script>

<style lang="scss">
.item {
  height: 60px;
  padding-top: 10px;
  color: white;
  .left {
    width: 30px;
    color: inherit;
    .index {
      display: block;
      width: 30px;
      height: 30px;
      text-align: center;
      margin: auto;
      border-radius: 50%;
      font-size: 0.6em;
      line-height: 30px;
      background-image: linear-gradient(rgb(244, 72, 129), rgb(236, 69, 79));
    }
  }
  .right {
    width: calc(100% - 30px);
    .title {
      color: white;
      font-size: 0.8em;
      text-align: left;
    }
    .info {
      .duration {
        font-size: 0.6em;
        .icon {
          display: inline-block;
        }
      }
    }
  }
}
</style>
