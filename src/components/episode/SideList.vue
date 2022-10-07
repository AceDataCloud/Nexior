<template>
  <div class="wrapper">
    <el-row
      v-for="(episode, episodeIndex) in episodes"
      :key="episodeIndex"
      :class="{ item: true, active: episode.id === active }"
      @click="onClick(episode)"
    >
      <el-col :span="5" class="left">
        <span class="index">
          {{ episodeIndex + 1 }}
        </span>
      </el-col>
      <el-col :span="19" class="right">
        <p class="title">
          {{ episode?.title }}
        </p>
        <p class="info">
          <span class="duration">
            <el-icon class="icon">
              <clock />
            </el-icon>
            {{ episode.duration }}
            {{ $t('common.entity.minute') }}
          </span>
        </p>
      </el-col>
    </el-row>
  </div>
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
    },
    active: {
      type: Number,
      required: true
    }
  },
  mounted() {},
  methods: {
    onClick(episode: IEpisode) {
      this.$emit('choose', episode);
    }
  }
});
</script>

<style lang="scss">
.wrapper {
  padding: 0 10px;
  .item {
    cursor: pointer;
    border-radius: 0.934rem;
    width: 100%;
    height: 60px;
    padding-top: 10px;
    color: white;
    margin: 10px 0;
    border: 1px solid #0d131d;
    &.active,
    &:hover {
      background-color: rgba(50, 138, 241, 0.05);
      border: 1px solid rgba(50, 138, 241, 0.25);
    }
    .left {
      width: 60px;
      color: inherit;
      flex: inherit;
      .index {
        display: block;
        width: 30px;
        height: 30px;
        text-align: center;
        margin: auto;
        border-radius: 50%;
        font-size: 0.6em;
        margin-top: 5px;
        line-height: 30px;
        background-image: linear-gradient(rgb(244, 72, 129), rgb(236, 69, 79));
      }
    }
    .right {
      width: calc(100% - 60px);
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
            position: relative;
            top: -1px;
          }
        }
      }
    }
  }
}
</style>
