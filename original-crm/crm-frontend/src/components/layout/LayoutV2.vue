<template>
  <div class="layout-v2">
    <aside class="sidebar light-sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-logo">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="2"/><circle cx="12" cy="16" r="2.5"/><path d="M10.5 9.5L14 8.5"/><path d="M9.5 11L11 14"/><path d="M15 10L13.5 14"/></svg>
        <span v-show="!isCollapsed">CRM Platform</span>
      </div>
      <nav class="sidebar-nav">
        <el-menu :default-active="activeMenu" :collapse="isCollapsed" background-color="transparent" text-color="#475569" active-text-color="#3b82f6" router>
          <el-sub-menu index="work"><template #title><el-icon><Monitor /></el-icon><span>工作台</span></template><el-menu-item index="/dashboard"><el-icon><DataAnalysis /></el-icon><span>仪表盘</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="customer"><template #title><el-icon><User /></el-icon><span>客户管理</span></template><el-menu-item index="/customers"><el-icon><UserFilled /></el-icon><span>客户列表</span></el-menu-item><el-menu-item index="/pool"><el-icon><Ship /></el-icon><span>公海池</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="sales"><template #title><el-icon><TrendCharts /></el-icon><span>销售管理</span></template><el-menu-item index="/leads"><el-icon><Aim /></el-icon><span>线索管理</span></el-menu-item><el-menu-item index="/opportunities"><el-icon><Opportunity /></el-icon><span>商机管理</span></el-menu-item><el-menu-item index="/quotations"><el-icon><Document /></el-icon><span>报价管理</span></el-menu-item><el-menu-item index="/orders"><el-icon><Tickets /></el-icon><span>订单管理</span></el-menu-item><el-menu-item index="/follow-ups"><el-icon><ChatDotRound /></el-icon><span>跟进记录</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="marketing"><template #title><el-icon><Promotion /></el-icon><span>市场运营</span></template><el-menu-item index="/activities"><el-icon><Present /></el-icon><span>市场活动</span></el-menu-item><el-menu-item index="/campaigns"><el-icon><Promotion /></el-icon><span>营销活动</span></el-menu-item><el-menu-item index="/coupons"><el-icon><Discount /></el-icon><span>优惠券</span></el-menu-item></el-sub-menu>
          <el-menu-item index="/service"><el-icon><Service /></el-icon><span>服务管理</span></el-menu-item>
          <el-menu-item index="/members"><el-icon><Medal /></el-icon><span>会员管理</span></el-menu-item>
          <el-sub-menu index="collaboration"><template #title><el-icon><OfficeBuilding /></el-icon><span>协同办公</span></template><el-menu-item index="/schedule"><el-icon><Calendar /></el-icon><span>日程任务</span></el-menu-item><el-menu-item index="/notices"><el-icon><Bell /></el-icon><span>公告通知</span></el-menu-item><el-menu-item index="/mails"><el-icon><Message /></el-icon><span>站内信</span></el-menu-item><el-menu-item index="/documents"><el-icon><Folder /></el-icon><span>文档管理</span></el-menu-item><el-menu-item index="/approvals"><el-icon><Stamp /></el-icon><span>审批管理</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="analytics"><template #title><el-icon><DataBoard /></el-icon><span>数据分析</span></template><el-menu-item index="/performance"><el-icon><TrendCharts /></el-icon><span>业绩排行</span></el-menu-item><el-menu-item index="/rfm-analysis"><el-icon><PieChart /></el-icon><span>RFM分析</span></el-menu-item><el-menu-item index="/sales-forecast"><el-icon><TrendCharts /></el-icon><span>销售预测</span></el-menu-item><el-menu-item index="/student-dashboard"><el-icon><DataBoard /></el-icon><span>学生分析 🎓</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="system"><template #title><el-icon><Setting /></el-icon><span>系统设置</span></template><el-menu-item index="/products"><el-icon><Goods /></el-icon><span>产品管理</span></el-menu-item><el-menu-item index="/dict"><el-icon><Collection /></el-icon><span>数据字典</span></el-menu-item><el-menu-item index="/sys-config"><el-icon><Operation /></el-icon><span>系统配置</span></el-menu-item><el-menu-item index="/sales-teams"><el-icon><Avatar /></el-icon><span>销售团队</span></el-menu-item><el-menu-item index="/todos"><el-icon><List /></el-icon><span>待办任务</span></el-menu-item><el-menu-item index="/portal-manage"><el-icon><Monitor /></el-icon><span>门户管理</span></el-menu-item><el-menu-item index="/feedback-manage"><el-icon><ChatDotRound /></el-icon><span>反馈管理</span></el-menu-item><el-menu-item index="/points-manage"><el-icon><Money /></el-icon><span>积分管理</span></el-menu-item><el-menu-item index="/coupon-manage"><el-icon><Ticket /></el-icon><span>优惠券管理</span></el-menu-item><el-menu-item index="/workflow-manage"><el-icon><Setting /></el-icon><span>工作流</span></el-menu-item><el-menu-item index="/advanced-features"><el-icon><Grid /></el-icon><span>高级功能</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="sales-auto"><template #title><el-icon><TrendCharts /></el-icon><span>销售自动化</span></template><el-menu-item index="/contract-mgr"><el-icon><Document /></el-icon><span>合同管理</span></el-menu-item><el-menu-item index="/receivable-mgr"><el-icon><Money /></el-icon><span>回款管理</span></el-menu-item><el-menu-item index="/sales-target"><el-icon><Aim /></el-icon><span>销售目标</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="mkt-svc"><template #title><el-icon><Service /></el-icon><span>营销服务</span></template><el-menu-item index="/knowledge-base"><el-icon><Reading /></el-icon><span>知识库</span></el-menu-item><el-menu-item index="/group-buy-mgr"><el-icon><Connection /></el-icon><span>拼团管理</span></el-menu-item><el-menu-item index="/campus-agent"><el-icon><School /></el-icon><span>校园代理</span></el-menu-item></el-sub-menu>
          <el-sub-menu index="sys-admin"><template #title><el-icon><Setting /></el-icon><span>系统管理</span></template><el-menu-item index="/inventory-mgr"><el-icon><Goods /></el-icon><span>库存管理</span></el-menu-item><el-menu-item index="/competitor-mgr"><el-icon><Warning /></el-icon><span>竞争对手</span></el-menu-item><el-menu-item index="/audit-log"><el-icon><List /></el-icon><span>操作日志</span></el-menu-item></el-sub-menu>
          <!-- 学生CRM -->
          <el-menu-item index="/student-dashboard"><el-icon><DataBoard /></el-icon><span>学生分析</span></el-menu-item>
          <el-menu-item index="/student-profiles"><el-icon><User /></el-icon><span>学生画像</span></el-menu-item>
          <el-menu-item index="/student-tags"><el-icon><Collection /></el-icon><span>智能标签</span></el-menu-item>
          <el-menu-item index="/student-rfm"><el-icon><PieChart /></el-icon><span>RFM分层</span></el-menu-item>
          <el-menu-item index="/student-membership"><el-icon><Medal /></el-icon><span>付费会员</span></el-menu-item>
          <el-menu-item index="/student-marketing"><el-icon><Promotion /></el-icon><span>校园活动</span></el-menu-item>
          <el-menu-item index="/student-tickets"><el-icon><Service /></el-icon><span>服务工单</span></el-menu-item>
          <el-menu-item index="/student-churn"><el-icon><TrendCharts /></el-icon><span>流失预警</span></el-menu-item>
        </el-menu>
      </nav>
      <div class="sidebar-footer">
        <div class="relax-entry" :class="{ glow: relaxGlow }" @click="relaxVisible = true">
          <span class="relax-emoji">🎈</span><span v-show="!isCollapsed" class="relax-label">摸鱼放松</span>
          <span v-if="relaxGlow" class="relax-dot" />
        </div>
        <div class="collapse-btn" @click="isCollapsed = !isCollapsed"><el-icon :size="20"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon></div>
      </div>
    </aside>
    <div class="main-container">
      <header class="topbar">
        <el-breadcrumb separator=""><el-breadcrumb-item><span class="bread-home">首页</span></el-breadcrumb-item><el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item></el-breadcrumb>
        <div class="topbar-right">
          <el-input v-model="searchText" placeholder="搜索客户、订单..." :prefix-icon="Search" size="small" class="global-search" clearable />
          <el-badge :value="unreadCount" :hidden="!unreadCount" :max="99"><el-icon :size="20" class="bell-icon" @click="$router.push('/notices')"><Bell /></el-icon></el-badge>
          <el-tooltip content="捏个泡泡放松 🫧" placement="bottom"><span class="pop-btn" @click="popVisible=true"><span class="pop-emoji">🫧</span></span></el-tooltip>
          <el-dropdown trigger="click"><span class="user-info"><el-avatar :size="32" icon="UserFilled" /><span class="user-name">{{ userName }}</span></span>
            <template #dropdown><el-dropdown-menu><el-dropdown-item @click="relaxSettingsVisible=true">🎈 休闲设置</el-dropdown-item><el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </header>
      <main class="content"><router-view /></main>
    </div>
    <RelaxDrawer v-model="relaxVisible" />
    <VirtualPet ref="petRef" v-if="settings.petEnabled" />
    <teleport to="body"><transition name="pop-zoom"><div v-if="popVisible" class="pop-overlay" @click.self="popVisible=false"><BubbleWrap /></div></transition></teleport>
    <el-dialog v-model="relaxSettingsVisible" title="🎈 休闲模式设置" width="420px" center>
      <div class="settings-body"><div class="setting-row"><span>🐱 电子宠物</span><el-switch v-model="settings.petEnabled" /></div><div class="setting-row"><span>😂 笑话抽屉</span><el-switch v-model="settings.drawerEnabled" /></div><div class="setting-row"><span>🍅 番茄钟提醒</span><el-switch v-model="settings.pomodoroEnabled" /></div><div class="setting-row"><span>🎨 休闲风格</span><el-radio-group v-model="settings.relaxStyle" size="small"><el-radio-button value="cute">可爱风</el-radio-button><el-radio-button value="minimal">极简风</el-radio-button></el-radio-group></div></div>
    </el-dialog>
    <AiAssistant />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Monitor, DataAnalysis, User, UserFilled, Ship, TrendCharts, Aim, Opportunity, Document, Tickets, ChatDotRound, Promotion, Present, Discount, Service, Medal, OfficeBuilding, Calendar, Bell, Message, Folder, Stamp, DataBoard, PieChart, Setting, Goods, Collection, Operation, Avatar, List, Fold, Expand, Money, Ticket, Grid, Reading, Warning, Connection } from '@element-plus/icons-vue'
import AiAssistant from '@/components/ai/AiAssistant.vue'
import RelaxDrawer from '@/components/relax/RelaxDrawer.vue'
import VirtualPet from '@/components/relax/VirtualPet.vue'
import BubbleWrap from '@/components/relax/BubbleWrap.vue'

const route = useRoute(); const router = useRouter()
const isCollapsed = ref(false); const unreadCount = ref(3)
const userName = ref(localStorage.getItem('realName') || '管理员'); const searchText = ref('')
const relaxVisible = ref(false); const relaxSettingsVisible = ref(false)
const popVisible = ref(false); const relaxGlow = ref(true); const petRef = ref(null)
const settings = reactive({ petEnabled:true, drawerEnabled:true, pomodoroEnabled:true, relaxStyle:'cute' })

setInterval(() => relaxGlow.value = !relaxGlow.value, 8000)
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')
function popRelax() { popVisible.value = true }
function handleLogout() { localStorage.removeItem('token'); localStorage.removeItem('realName'); localStorage.removeItem('role'); userName.value = '管理员'; router.push('/login') }
onMounted(() => { if (petRef.value) petRef.value.resetVisibility() })
</script>

<style scoped>
/* === Atomic-CRM / shadcn Light Sidebar === */
.layout-v2{display:flex;height:100vh;overflow:hidden;background:#f8fafc}

.sidebar{width:var(--crm-sidebar-width);background:#ffffff;display:flex;flex-direction:column;transition:width var(--crm-duration) var(--crm-ease-out);overflow:hidden;flex-shrink:0;border-right:1px solid #e2e8f0}
.sidebar.collapsed{width:var(--crm-sidebar-collapsed)}

.sidebar-nav{flex:1;overflow-y:auto;overflow-x:hidden;min-height:0;padding:8px}
.sidebar-nav::-webkit-scrollbar{width:4px}
.sidebar-nav::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px}
.sidebar-nav::-webkit-scrollbar-thumb:hover{background:#cbd5e1}

.sidebar :deep(.el-menu){border-right:none!important;background:transparent}
.sidebar :deep(.el-menu-item),.sidebar :deep(.el-sub-menu__title){height:38px;line-height:38px;font-size:13.5px;color:#475569;border-radius:6px;margin:2px 0;padding-left:12px!important}
.sidebar :deep(.el-menu-item:hover),.sidebar :deep(.el-sub-menu__title:hover){background:#f1f5f9!important;color:#0f172a!important}
.sidebar :deep(.el-menu-item.is-active){background:#eff6ff!important;color:#2563eb!important;font-weight:600;border-left:3px solid #3b82f6;padding-left:9px!important}
.sidebar :deep(.el-sub-menu .el-menu-item){padding-left:28px!important;font-size:13px}
.sidebar :deep(.el-sub-menu .el-menu-item.is-active){padding-left:25px!important}
.sidebar :deep(.el-sub-menu__icon-arrow){color:#94a3b8;font-size:10px}

.sidebar-logo{height:60px;display:flex;align-items:center;gap:10px;padding:0 16px;color:#0f172a;border-bottom:1px solid #f1f5f9;flex-shrink:0;font-weight:600}
.logo-icon{flex-shrink:0}.logo-text{font-size:15px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;color:#0f172a}

.sidebar-footer{flex-shrink:0;border-top:1px solid #f1f5f9;padding:8px}
.relax-entry{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;transition:all .2s;position:relative;border-radius:6px;color:#64748b}
.relax-entry:hover{background:#f1f5f9;color:#0f172a}
.relax-emoji{font-size:16px}
.relax-label{font-size:13px;font-weight:500}
.collapse-btn{height:40px;display:flex;align-items:center;justify-content:center;color:#94a3b8;cursor:pointer;transition:color .2s}
.collapse-btn:hover{color:#3b82f6}

.main-container{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:var(--crm-topbar-height);background:#ffffff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0;z-index:10}
.bread-home{color:#64748b}
.topbar-right{display:flex;align-items:center;gap:16px}
.global-search{width:280px}
.global-search :deep(.el-input__wrapper){background:#f8fafc;border-radius:6px;box-shadow:none!important;border:1px solid #e2e8f0}
.global-search :deep(.el-input__wrapper:hover){border-color:#cbd5e1}
.global-search :deep(.el-input__wrapper.is-focus){border-color:#3b82f6;background:#fff}
.bell-icon{cursor:pointer;color:#64748b;transition:color .2s;padding:6px;border-radius:6px}
.bell-icon:hover{color:#3b82f6;background:#f1f5f9}
.user-info{display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background .2s}
.user-info:hover{background:#f1f5f9}
.user-name{font-size:13.5px;color:#0f172a;font-weight:500}
.content{flex:1;overflow-y:auto;background:#f8fafc;padding:24px;max-width:1400px;width:100%;margin:0 auto}
.pop-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.3);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center}
.pop-zoom-enter-active{transition:all .4s var(--crm-ease-spring)}
.pop-zoom-leave-active{transition:all .3s var(--crm-ease-out)}
.pop-zoom-enter-from,.pop-zoom-leave-to{opacity:0}
.settings-body{display:flex;flex-direction:column;gap:20px}
.setting-row{display:flex;align-items:center;justify-content:space-between;font-size:14px;color:#0f172a}
</style>
