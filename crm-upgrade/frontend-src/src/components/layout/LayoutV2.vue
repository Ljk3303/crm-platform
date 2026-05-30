<template>
  <div class="layout-v2">
    <!-- Sidebar -->
    <div class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="logo">
        <span v-if="!isCollapsed">CRM 智能销售平台</span>
        <span v-else>CRM</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        background-color="#001529"
        text-color="#ffffffb3"
        active-text-color="#fff"
        router
      >
        <!-- 工作台 -->
        <el-sub-menu index="work">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>工作台</span>
          </template>
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>工作台</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 客户管理 -->
        <el-sub-menu index="customer">
          <template #title>
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </template>
          <el-menu-item index="/customers">
            <el-icon><UserFilled /></el-icon>
            <span>客户管理</span>
          </el-menu-item>
          <el-menu-item index="/pool">
            <el-icon><Ship /></el-icon>
            <span>公海池</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 销售管理 -->
        <el-sub-menu index="sales">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>销售管理</span>
          </template>
          <el-menu-item index="/leads">
            <el-icon><Aim /></el-icon>
            <span>线索管理</span>
          </el-menu-item>
          <el-menu-item index="/opportunities">
            <el-icon><Opportunity /></el-icon>
            <span>商机管理</span>
          </el-menu-item>
          <el-menu-item index="/quotations">
            <el-icon><Document /></el-icon>
            <span>报价管理</span>
          </el-menu-item>
          <el-menu-item index="/orders">
            <el-icon><Tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item index="/follow-ups">
            <el-icon><ChatDotRound /></el-icon>
            <span>跟进记录</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 市场运营 -->
        <el-sub-menu index="marketing">
          <template #title>
            <el-icon><Promotion /></el-icon>
            <span>市场运营</span>
          </template>
          <el-menu-item index="/activities">
            <el-icon><Present /></el-icon>
            <span>市场活动</span>
          </el-menu-item>
          <el-menu-item index="/campaigns">
            <el-icon><Promotion /></el-icon>
            <span>营销活动</span>
          </el-menu-item>
          <el-menu-item index="/coupons">
            <el-icon><Discount /></el-icon>
            <span>优惠券</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 服务管理 -->
        <el-menu-item index="/service">
          <el-icon><Service /></el-icon>
          <span>服务管理</span>
        </el-menu-item>

        <!-- 会员管理 -->
        <el-menu-item index="/members">
          <el-icon><Medal /></el-icon>
          <span>会员管理</span>
        </el-menu-item>

        <!-- 协同办公 -->
        <el-sub-menu index="collaboration">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span>协同办公</span>
          </template>
          <el-menu-item index="/schedule">
            <el-icon><Calendar /></el-icon>
            <span>日程任务</span>
          </el-menu-item>
          <el-menu-item index="/notices">
            <el-icon><Bell /></el-icon>
            <span>公告通知</span>
          </el-menu-item>
          <el-menu-item index="/mails">
            <el-icon><Message /></el-icon>
            <span>站内信</span>
          </el-menu-item>
          <el-menu-item index="/documents">
            <el-icon><Folder /></el-icon>
            <span>文档管理</span>
          </el-menu-item>
          <el-menu-item index="/approvals">
            <el-icon><Stamp /></el-icon>
            <span>审批管理</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 数据分析 -->
        <el-sub-menu index="analytics">
          <template #title>
            <el-icon><DataBoard /></el-icon>
            <span>数据分析</span>
          </template>
          <el-menu-item index="/performance">
            <el-icon><TrendCharts /></el-icon>
            <span>业绩排行</span>
          </el-menu-item>
          <el-menu-item index="/rfm-analysis">
            <el-icon><PieChart /></el-icon>
            <span>RFM分析</span>
          </el-menu-item>
          <el-menu-item index="/sales-forecast">
            <el-icon><TrendCharts /></el-icon>
            <span>销售预测</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 系统设置 -->
        <el-sub-menu index="system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/products">
            <el-icon><Goods /></el-icon>
            <span>产品管理</span>
          </el-menu-item>
          <el-menu-item index="/dict">
            <el-icon><Collection /></el-icon>
            <span>数据字典</span>
          </el-menu-item>
          <el-menu-item index="/sys-config">
            <el-icon><Operation /></el-icon>
            <span>系统配置</span>
          </el-menu-item>
          <el-menu-item index="/sales-teams">
            <el-icon><Avatar /></el-icon>
            <span>销售团队</span>
          </el-menu-item>
          <el-menu-item index="/todos">
            <el-icon><List /></el-icon>
            <span>待办任务</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      <div class="collapse-btn" @click="isCollapsed = !isCollapsed">
        <el-icon :size="20">
          <Fold v-if="!isCollapsed" />
          <Expand v-else />
        </el-icon>
      </div>
    </div>

    <!-- Main -->
    <div class="main-container">
      <div class="topbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="topbar-right">
          <el-badge :value="unreadCount" :hidden="!unreadCount" :max="99">
            <el-icon :size="20" class="bell-icon"><Bell /></el-icon>
          </el-badge>
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userName }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleProfile">个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      <div class="content">
        <router-view />
      </div>
    </div>
    <AiAssistant />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor, DataAnalysis, User, UserFilled, Ship, TrendCharts,
  Aim, Opportunity, Document, Tickets, ChatDotRound,
  Promotion, Present, Discount, Service, Medal,
  OfficeBuilding, Calendar, Bell, Message, Folder, Stamp,
  DataBoard, PieChart, Setting, Goods, Collection, Operation,
  Avatar, List, Fold, Expand
} from '@element-plus/icons-vue'
import AiAssistant from '@/components/ai/AiAssistant.vue'
import { noticeApi, mailApi } from '@/api/index'

const route = useRoute()
const router = useRouter()

const isCollapsed = ref(false)
const unreadCount = ref(0)
const userName = ref('管理员')

const activeMenu = computed(() => {
  return route.path
})

const currentTitle = computed(() => {
  return route.meta?.title || ''
})

async function fetchUnreadCounts() {
  try {
    const [noticeRes, mailRes] = await Promise.allSettled([
      noticeApi.unreadCount(),
      mailApi.unreadCount()
    ])
    let count = 0
    if (noticeRes.status === 'fulfilled' && noticeRes.value) {
      count += noticeRes.value.data || 0
    }
    if (mailRes.status === 'fulfilled' && mailRes.value) {
      count += mailRes.value.data || 0
    }
    unreadCount.value = count
  } catch {
    // ignore
  }
}

function handleProfile() {
  // Navigate to profile page
}

function handleLogout() {
  router.push('/login')
}

onMounted(() => {
  fetchUnreadCounts()
})
</script>

<style scoped>
.layout-v2 {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  background-color: #001529;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar :deep(.el-menu) {
  border-right: none;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  white-space: nowrap;
  padding: 0 16px;
  flex-shrink: 0;
}

.collapse-btn {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #fff;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.topbar {
  height: 56px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  z-index: 10;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.bell-icon {
  cursor: pointer;
  color: #606266;
}

.bell-icon:hover {
  color: #409eff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.content {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 16px;
}
</style>
