<template>
  <el-row class="panel">
    <el-col :span="24">
      <el-row>
        <el-col :span="24">
          <h2 class="title">{{ $t('common.title.distribution') }}</h2>
          <p class="message mb-4">
            {{ $t('distribution.message.distributionDescription') }}
          </p>
        </el-col>
      </el-row>
      <el-row :gutter="15">
        <el-col :md="6" :xs="24">
          <el-card shadow="hover" class="item-mini mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-wallet" class="icon" />
              </div>
              <div class="text-left">
                <p class="description">{{ $t('distribution.title.price') }}</p>
                <p class="value">￥{{ distributionStatus?.price?.toFixed(2) }}</p>
              </div>
              <el-button type="primary" class="btn" @click="goHistory"
                >{{ $t('distribution.button.detail') }}
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :xs="24">
          <el-card shadow="hover" class="item-mini mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-coins" class="icon" />
              </div>
              <div class="text-left">
                <p class="description">{{ $t('distribution.title.reward') }}</p>
                <p class="value">￥{{ distributionStatus?.reward?.toFixed(2) }}</p>
              </div>
              <el-tooltip effect="dark" :content="$t('distribution.message.howToWithdrawal')" placement="top">
                <el-button type="primary" class="btn">{{ $t('distribution.button.withdrawal') }} </el-button>
              </el-tooltip>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :xs="24">
          <el-card shadow="hover" class="item-mini mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-solid fa-percent" class="icon" />
              </div>
              <div class="text-left">
                <p class="description">{{ $t('distribution.title.percentage') }}</p>
                <p class="value">{{ distributionStatus?.level?.percentage }}%</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :md="6" :xs="24">
          <el-card shadow="hover" class="item-mini mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <div class="icon-wrapper">
                <font-awesome-icon icon="fa-regular fa-user" class="icon" />
              </div>
              <div class="text-left">
                <p class="description">{{ $t('distribution.title.inviteesCount') }}</p>
                <p class="value">{{ inviteesCount }}</p>
              </div>
              <el-button type="primary" class="btn" @click="goInvitees"
                >{{ $t('distribution.button.detail') }}
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="15">
        <el-col :md="12" :xs="24">
          <el-card shadow="hover" class="distribution-info mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <h4 class="title">
                {{ $t('distribution.title.distributionLink') }}
              </h4>
              <el-divider />
              <div class="link-wrapper">
                <font-awesome-icon v-if="false" icon="fa-solid fa-link" class="icon" />
                <a :href="distributionLink" class="link">
                  {{ distributionLink }}
                </a>
                <copy-to-clipboard :content="distributionLink" />
              </div>
              <div class="qr-wrapper">
                <qr-code v-if="distributionLink" :value="distributionLink" :size="150" class="mb-2 ml-auto mr-auto" />
                <p>
                  {{ $t('distribution.message.distributionQrDescription') }}
                </p>
              </div>
              <p class="description">
                {{ $t('distribution.message.distributionLinkDescription') }}
                <span class="more">
                  <el-tooltip
                    effect="dark"
                    :content="$t('distribution.message.distributionLinkDescription2')"
                    placement="top"
                  >
                    {{ $t('distribution.message.technicalDetail') }}
                  </el-tooltip>
                </span>
              </p>
            </div>
          </el-card>
        </el-col>
        <el-col :md="12" :xs="24">
          <el-card shadow="hover" class="level-info mb-4">
            <el-skeleton v-if="loading" />
            <div v-else>
              <h4 class="title">
                {{ $t('distribution.title.levelInfo') }}
              </h4>
              <div class="clear-both overflow-hidden">
                <div class="float-left description">
                  <p>{{ $t('distribution.title.currentLevel') }}: L{{ distributionStatus?.level?.level }}</p>
                  <p>
                    {{ $t('distribution.title.currentPercentage') }}:
                    {{ distributionLevelMap[distributionStatus?.level?.level!]?.percentage }}%
                  </p>
                </div>
                <div class="float-right description">
                  <p>{{ $t('distribution.title.nextLevel') }}: L{{ distributionStatus?.level?.level! + 1 }}</p>
                  <p>
                    {{ $t('distribution.title.nextPercentage') }}:
                    {{ distributionLevelMap[distributionStatus?.level?.level! + 1]?.percentage }}%
                  </p>
                </div>
              </div>
              <el-progress
                :text-inside="true"
                :stroke-width="20"
                :percentage="getPercentageForNextLevel()"
                class="mb-2"
              >
              </el-progress>
              <p class="description">
                {{ $t('distribution.message.deltaPriceForNextLevel') }}: ￥{{ getDeltaForNextLevel() }}
              </p>
              <el-divider />
              <el-table v-if="distributionLevels" :data="distributionLevels" stripe>
                <el-table-column :label="$t('distribution.field.level')">
                  <template #default="scope">
                    <span class="level">L{{ scope.row?.level }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('distribution.field.threshold')">
                  <template #default="scope">
                    <span class="level">¥{{ scope.row?.threshold }}</span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('distribution.field.percentage')">
                  <template #default="scope">
                    <span class="level">{{ scope.row?.percentage }}%</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CopyToClipboard from '@/components/common/CopyToClipboard.vue';
import {
  ElRow,
  ElCol,
  ElProgress,
  ElTable,
  ElTableColumn,
  ElButton,
  ElCard,
  ElDivider,
  ElInput,
  ElTooltip,
  ElSkeleton
} from 'element-plus';
import {
  distributionLevelOperator,
  distributionStatusOperator,
  IDistributionLevel,
  IDistributionStatus
} from '@/operators/distribution';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ROUTE_CONSOLE_DISTRIBUTION_HISTORY, ROUTE_CONSOLE_DISTRIBUTION_INVITEES } from '@/router';
import { IUser, userOperator } from '@/operators';
import QrCode from 'qrcode.vue';

interface IData {
  invitees: IUser[];
  inviteesCount: number | undefined;
  distributionLevels: IDistributionLevel[];
  distributionStatus: IDistributionStatus | undefined;
  loading: boolean;
}

export default defineComponent({
  name: 'ConsoleDistributionList',
  components: {
    CopyToClipboard,
    FontAwesomeIcon,
    QrCode,
    ElProgress,
    ElRow,
    ElCol,
    ElButton,
    ElDivider,
    ElCard,
    ElTooltip,
    ElTable,
    ElTableColumn,
    ElSkeleton
  },
  data(): IData {
    return {
      invitees: [],
      inviteesCount: undefined,
      distributionLevels: [],
      distributionStatus: undefined,
      loading: false
    };
  },
  computed: {
    redirect() {
      return this.$route.query.redirect;
    },
    page() {
      return parseInt(this.$route.query.page?.toString() || '1');
    },
    distributionLevelMap() {
      let result: {
        [key: number]: IDistributionLevel;
      } = {};
      this.distributionLevels.forEach((item) => {
        result[item.level] = item;
      });
      return result;
    },
    distributionLink() {
      const origin = window.location.origin;
      const newOrigin = origin.replace('hub.', 'auth.');
      return `${newOrigin}/auth/login?inviter_id=${this.$store.getters.user.id}&redirect=${origin}`;
    }
  },
  watch: {
    page: {
      handler() {
        this.onFetchData();
      }
    }
  },
  async mounted() {
    this.onFetchData();
  },
  methods: {
    goHistory() {
      this.$router.push({
        name: ROUTE_CONSOLE_DISTRIBUTION_HISTORY
      });
    },
    goInvitees() {
      this.$router.push({
        name: ROUTE_CONSOLE_DISTRIBUTION_INVITEES
      });
    },
    onPageChange(page: number) {
      this.$router.push({
        name: this.$route.name?.toString(),
        query: {
          page: page
        }
      });
    },
    getPercentageForNextLevel() {
      const currentThreshold = this.distributionLevelMap[this.distributionStatus?.level?.level!]?.threshold;
      const nextThreshold = this.distributionLevelMap[this.distributionStatus?.level?.level! + 1]?.threshold;
      return Math.floor(
        ((this.distributionStatus?.price! - currentThreshold!) / (nextThreshold! - currentThreshold!)) * 100
      );
    },
    getDeltaForNextLevel() {
      const nextThreshold = this.distributionLevelMap[this.distributionStatus?.level?.level! + 1]?.threshold;
      return Math.floor(nextThreshold - this.distributionStatus?.price!);
    },
    async onFetchData() {
      this.loading = true;
      await distributionStatusOperator.initialize();
      Promise.all([this.onFetchDistributionStatus(), this.onFetchDistributionLevels(), this.onFetchInvitees()]).finally(
        () => {
          this.loading = false;
        }
      );
    },
    async onFetchDistributionStatus() {
      const { data } = await distributionStatusOperator.getAll({
        user_id: this.$store.getters.user.id
      });
      if (data.items && data.items.length > 0) {
        this.distributionStatus = data.items[0];
      }
    },
    async onFetchDistributionLevels() {
      const { data } = await distributionLevelOperator.getAll();
      this.distributionLevels = data.items;
    },
    async onFetchInvitees() {
      const { data } = await userOperator.getInvitees({});
      this.invitees = data.items;
      this.inviteesCount = data.count;
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.item-mini {
  position: relative;
  .icon-wrapper {
    height: 40px;
    width: 40px;
    line-height: 40px;
    border-radius: 50%;
    background-color: #eee;
    text-align: center;
    margin-bottom: 10px;
    .icon {
      color: var(--el-color-primary);
    }
  }

  .btn {
    position: absolute;
    right: 20px;
    top: 50%;
    border-radius: 20px;
    transform: translateY(-50%);
  }
  .value {
    font-weight: 600;
    font-size: 30px;
  }
  .description {
    color: #999;
    font-size: 14px;
  }
}

.level-info,
.distribution-info {
  .title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
  }
  .icon {
    margin-right: 5px;
  }
  .qr-wrapper {
    padding: 15px 0;
    p {
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  }

  .link-wrapper {
    margin-bottom: 10px;
    .link {
      color: var(--el-color-primary);
      cursor: pointer;
      text-decoration: dashed;
      font-size: 14px;
      margin-bottom: 10px;
    }
  }

  .description {
    color: #999;
    font-size: 14px;
    margin-bottom: 10px;
    .more {
      color: var(--el-color-primary);
      cursor: pointer;
    }
  }
}

.panel {
  padding: 30px;
  width: calc(100% - 300px);
  background-color: #f3f5f6;

  .message {
    font-size: 14px;
    color: #666;
  }
}
</style>
