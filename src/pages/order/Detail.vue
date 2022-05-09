<template>
  <el-row>
    <el-col :span="24">
      <div class="wrapper">
        <div class="container">
          <el-row v-if="order">
            <el-col :span="24">
              <div class="courses">
                <div v-for="(course, courseIndex) in courses" :key="courseIndex">
                  <div class="title">
                    {{ course.title }}
                  </div>
                  <div class="price">
                    {{ course.price }}
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { ICourse, ICourseDetailResponse } from '@/services/course/types';
import { orderService } from '@/services/order/service';
import { courseService } from '@/services/course/service';
import { IOrder, IOrderDetailResponse } from '@/services/order/types';
import { defineComponent } from 'vue';

interface IData {
  order: IOrder | undefined;
  courses: ICourse[] | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'OrderDetail',
  components: {},
  data(): IData {
    return {
      order: undefined,
      courses: [],
      loading: false
    };
  },
  computed: {
    verified() {
      return this.$store.getters.user.isVerified;
    },
    id() {
      return this.$route.params.id.toString();
    }
  },
  async mounted() {
    this.loading = true;
    orderService.get(this.id).then(({ data: data }: { data: IOrderDetailResponse }) => {
      this.loading = false;
      this.order = data;
      this.order.courses?.forEach((courseId: number) => {
        console.log('course', courseId);
        courseService.get(courseId).then(({ data: data2 }: { data: ICourseDetailResponse }) => {
          this.courses?.push(data2);
        });
      });
    });
  },
  methods: {}
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

.verification-alert {
  padding-top: 50px;
  .go {
    font-weight: bold;
  }
}

.episodes {
  padding: 50px 0;
  &.disabled {
    opacity: 0.2;
    pointer-events: none;
  }
  .episode {
    cursor: pointer;
    margin-bottom: 2rem;
    height: 100px;
    border-radius: 0.934rem !important;
    .left {
      .index {
        width: 50px;
        height: 50px;
        background: #f8fafe;
        display: block;
        border-radius: 50%;
        line-height: 50px;
        text-align: center;
        font-size: 20px;
        border: 2px solid #e5e5e5;
        position: absolute;
        top: 5px;
        left: 35px;
      }
    }
    .title {
      p {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 10px;
      }
    }
    .introduction {
      p {
        font-size: 0.8rem;
        color: rgb(161, 161, 161);
      }
    }
    .info {
      font-size: 12px;
      color: #666;
      .icon {
        position: relative;
        top: 1px;
      }
    }
  }
}
</style>
