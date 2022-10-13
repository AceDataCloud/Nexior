<template>
  <el-row>
    <el-col :span="24">
      <div class="wrapper">
        <div class="container">
          <el-row v-if="order">
            <el-col :span="24">
              <el-card>
                <el-row>
                  <el-col :span="12" :offset="6">
                    <div class="order">
                      <el-descriptions :title="$t('course.title.orderInfo')" :column="1">
                        <el-descriptions-item :label="$t('course.title.orderId')">{{ order?.id }}</el-descriptions-item>
                        <el-descriptions-item :label="$t('course.title.orderDescription')">
                          {{ order?.description }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="order?.price" :label="$t('course.title.orderPrice')">
                          <span class="price">¥{{ (order?.price / 100).toFixed(2) }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item
                          v-for="(course, courseIndex) in courses"
                          :key="courseIndex"
                          :label="$t('course.title.orderGood')"
                        >
                          <span>{{ course.title }}</span>
                        </el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12" :offset="6">
                    <el-divider border-style="dashed" />
                    <div class="payways">
                      <div
                        :class="{
                          payway: true,
                          wechat: true,
                          active: payway === 'wechat'
                        }"
                      >
                        <span class="payicon wechat"></span>
                        {{ $t('course.title.payWayWechat') }}
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12" :offset="6">
                    <el-row class="paycodes">
                      <el-col :span="12">
                        <div class="paycode wechat">
                          <qr-code v-if="order.wechatpayUrl" :value="order.wechatpayUrl" :size="200" class="m-auto" />
                          <p class="help-text">{{ $t('course.message.wechatPayHelp') }}</p>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="help-img">
                          <img src="https://midas.gtimg.cn/enterprise/images/ep_sys_wx_tip.jpg" />
                        </div>
                      </el-col>
                    </el-row>
                  </el-col>
                </el-row>
              </el-card>
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
import { IOrder, IOrderDetailResponse, ORDER_STATE_PAID } from '@/services/order/types';
import { defineComponent } from 'vue';
import QrCode from 'qrcode.vue';
import { ElMessage } from 'element-plus';

const PAYWAY_WECHAT = 'wechat';

interface IData {
  payway: typeof PAYWAY_WECHAT;
  order: IOrder | undefined;
  courses: ICourse[] | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'OrderDetail',
  components: {
    QrCode
  },
  data(): IData {
    return {
      payway: PAYWAY_WECHAT,
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
    },
    redirect() {
      return this.$route.query.redirect;
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
    this.onCheck();
  },
  methods: {
    onCheck() {
      orderService
        .get(this.id)
        .then(({ data: data }: { data: IOrderDetailResponse }) => {
          this.order = data;
          if (this.order.state === ORDER_STATE_PAID) {
            ElMessage.success(this.$t('course.message.paidSuccessfully'));
            setTimeout(() => {
              if (this.redirect) {
                window.location.replace(this.redirect?.toString());
              }
            }, 2000);
            return;
          }
          setTimeout(() => {
            this.onCheck();
          }, 2000);
        })
        .catch(() => {
          setTimeout(() => {
            this.onCheck();
          }, 2000);
        });
    }
  }
});
</script>

<style lang="scss" scoped>
.wrapper {
  width: 100%;
  height: 800px;
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

.order {
  .price {
    font-size: 20px;
    font-weight: bold;
  }
}

.el-card {
  padding: 50px 0;
}

.payways {
  overflow: hidden;
  .payway {
    cursor: pointer;
    font-size: 14px;
    float: left;
    width: 120px;
    line-height: 40px;
    text-align: center;
    height: 40px;
    border: 1px solid #eee;
    &.active {
      border: 1px solid #3879d1;
    }
  }

  .payicon {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    display: inline-block;
    &.wechat {
      position: relative;
      top: 3px;
      width: 22px;
      height: 19px;
      background-image: url(//midas.gtimg.cn/enterprise/images/ep_new_sprites@2x.png);
      background-repeat: no-repeat;
      background-size: 60px 250px;
      background-position: 0 -50px;
    }
  }
}

.paycodes {
  padding: 30px 0;
  .wechat {
    .help-text {
      display: block;
      background-color: #00c800;
      color: white;
      font-size: 14px;
      height: 35px;
      width: 240px;
      text-align: center;
      line-height: 35px;
      margin: 10px auto 0 auto;
    }
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
