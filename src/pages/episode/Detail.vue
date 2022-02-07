<template>
  <el-row>
    <el-col :span="24">
      <div class="wrapper">
        <div class="container">
          <el-row v-if="episode">
            <el-col :span="6"
              ><div class="thumbnail">
                <img :src="episode.thumbnail" />
              </div>
            </el-col>
            <el-col :span="18">
              <div class="title mb-5">
                <p>{{ episode.title }}</p>
              </div>
              <div class="introduction mb-5">
                <p>{{ episode.introduction }}</p>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>
  </el-row>
  <el-row>
    <el-col :span="24">
      <div class="banner"></div>
    </el-col>
  </el-row>
  <el-row class="episodes">
    <el-col :span="14" :offset="5">
      <el-card shadow="hover" v-for="(episode, episodeIndex) in episodes" class="episode">
        <el-row>
          <el-col :span="3"> {{ episodeIndex + 1 }}</el-col>
          <el-col :span="21">
            <div class="title">
              <p>{{ episode.title }}</p>
            </div>
            <div class="introduction">
              <p>{{ episode.introduction }}</p>
            </div>
            <div class="introduction">
              <router-link
                :to="{
                  name: 'eposide-detail',
                  params: {
                    episodeId: episode?.id,
                    id: episode.id
                  }
                }"
              >
                <el-button>{{ $t('common.button.watch') }}</el-button>
              </router-link>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { episodeService } from '@/services/episode/service';
import { IEpisode, IEpisodeDetailResponse } from '@/services/episode/types';
import { defineComponent } from 'vue';

interface IData {
  episode: IEpisode | undefined;
  loading: boolean;
  id: number;
}

export default defineComponent({
  name: 'EpisodeDetail',
  data(): IData {
    return {
      id: parseInt(this.$route.params.id.toString()),
      episode: undefined,
      loading: false
    };
  },
  async mounted() {
    this.loading = true;
    episodeService.get(this.id).then(({ data: data }: { data: IEpisodeDetailResponse }) => {
      this.loading = false;
      this.episode = data;
    });
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 400px;
  background-image: radial-gradient(circle at 0 2%, #283e63, #172337 99%);
  .container {
    width: 1200px;
    margin: auto;
    padding-top: 50px;

    .title {
      p {
        font-weight: bold;
        color: white;
        font-size: 2.4rem;
      }
    }
    .introduction {
      p {
        color: white;
        font-size: 1rem;
      }
    }
    .thumbnail {
      text-align: center;
      img {
        pointer-events: none;
        width: 200px;
        height: 200px;
        margin-top: 50px;
        margin-left: auto;
        margin-right: auto;
      }
    }
  }
}

.banner {
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
  background: linear-gradient(270deg, #f44881, #ec454f);
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  height: 55px;
}

.episodes {
  .episode {
    margin-top: 2rem;
    height: 160px;
    border-radius: 0.934rem !important;
    .title {
      p {
        font-size: 1.5rem;
        font-weight: bold;
      }
    }
    .introduction {
      p {
        font-size: 0.8rem;
        color: rgb(161, 161, 161);
      }
    }
  }
}
</style>
