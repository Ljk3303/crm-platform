import { createRouter, createWebHistory } from 'vue-router'

// Original routes (preserved)
import Login from '@/views/Login.vue'
import Layout from '@/components/layout/LayoutV2.vue'
import DashboardV2 from '@/views/dashboard/DashboardV2.vue'
import CustomerList from '@/views/customer/CustomerList.vue'
import CustomerDetail from '@/views/customer/CustomerDetail.vue'
import LeadPool from '@/views/customer/LeadPool.vue'
import OrderList from '@/views/sales/OrderList.vue'
import FollowUpList from '@/views/sales/FollowUpList.vue'
import MemberList from '@/views/member/MemberList.vue'
import CampaignList from '@/views/marketing/CampaignList.vue'
import CouponManage from '@/views/marketing/CouponManage.vue'
import Performance from '@/views/employee/Performance.vue'
import TodoList from '@/views/employee/TodoList.vue'

// New routes (lazy-loaded)
const LeadList = () => import('@/views/lead/LeadList.vue')
const LeadDetail = () => import('@/views/lead/LeadDetail.vue')
const OpportunityList = () => import('@/views/opportunity/OpportunityList.vue')
const OpportunityDetail = () => import('@/views/opportunity/OpportunityDetail.vue')
const QuotationList = () => import('@/views/quotation/QuotationList.vue')
const QuotationDetail = () => import('@/views/quotation/QuotationDetail.vue')
const ProductList = () => import('@/views/product/ProductList.vue')
const ServiceList = () => import('@/views/service/ServiceList.vue')
const ServiceDetail = () => import('@/views/service/ServiceDetail.vue')
const ActivityList = () => import('@/views/marketing-activity/ActivityList.vue')
const ActivityDetail = () => import('@/views/marketing-activity/ActivityDetail.vue')
const ScheduleView = () => import('@/views/schedule/ScheduleView.vue')
const NoticeList = () => import('@/views/collaboration/NoticeList.vue')
const MailList = () => import('@/views/collaboration/MailList.vue')
const DocumentList = () => import('@/views/collaboration/DocumentList.vue')
const ApprovalList = () => import('@/views/collaboration/ApprovalList.vue')
const DictManage = () => import('@/views/system/DictManage.vue')
const SystemConfig = () => import('@/views/system/SystemConfig.vue')
const SalesTeam = () => import('@/views/system/SalesTeam.vue')
const RfmAnalysis = () => import('@/views/analytics/RfmAnalysis.vue')
const SalesForecast = () => import('@/views/analytics/SalesForecast.vue')
const StudentDashboard = () => import('@/views/analytics/StudentDashboard.vue')
const PortalManage = () => import('@/views/system/PortalManage.vue')
const FeedbackManage = () => import('@/views/system/FeedbackManage.vue')
const PointsManage = () => import('@/views/system/PointsManage.vue')
const CouponAdmin = () => import('@/views/system/CouponManage.vue')
const WorkflowManage = () => import('@/views/system/WorkflowManage.vue')
const AdvancedFeatures = () => import('@/views/system/AdvancedFeatures.vue')
const ContractMgr = () => import('@/views/extend/ContractManage.vue')
const ReceivableMgr = () => import('@/views/extend/ReceivableManage.vue')
const SalesTarget = () => import('@/views/extend/SalesTarget.vue')
const InventoryMgr = () => import('@/views/extend/InventoryManage.vue')
const CompetitorMgr = () => import('@/views/extend/CompetitorManage.vue')
const KnowledgeBase = () => import('@/views/extend/KnowledgeBase.vue')
const CampusAgent = () => import('@/views/extend/CampusAgent.vue')
const GroupBuyMgr = () => import('@/views/extend/GroupBuyManage.vue')
const AuditLog = () => import('@/views/extend/AuditLog.vue')
const AiAssistantPage = () => import('@/views/ai/AiAssistantPage.vue')
const StudentProfiles = () => import('@/views/student/StudentProfiles.vue')
const StudentTags = () => import('@/views/student/StudentTags.vue')
const StudentRfm = () => import('@/views/student/StudentRfm.vue')
const StudentMembership = () => import('@/views/student/StudentMembership.vue')
const StudentMarketing = () => import('@/views/student/StudentMarketing.vue')
const StudentTickets = () => import('@/views/student/StudentTickets.vue')
const StudentChurn = () => import('@/views/student/StudentChurn.vue')

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { noAuth: true } },
  {
    path: '/', component: Layout,
    children: [
      { path: '', redirect: '/dashboard' },
      // Original routes preserved
      { path: 'dashboard', name: 'Dashboard', component: DashboardV2, meta: { title: '工作台', icon: 'Monitor' } },
      { path: 'customers', name: 'CustomerList', component: CustomerList, meta: { title: '客户管理', icon: 'User' } },
      { path: 'customers/:id', name: 'CustomerDetail', component: CustomerDetail, meta: { title: '客户详情', hidden: true } },
      { path: 'pool', name: 'LeadPool', component: LeadPool, meta: { title: '公海池', icon: 'Ship' } },
      { path: 'orders', name: 'OrderList', component: OrderList, meta: { title: '订单管理', icon: 'Tickets' } },
      { path: 'follow-ups', name: 'FollowUpList', component: FollowUpList, meta: { title: '跟进记录', icon: 'ChatDotRound' } },
      { path: 'members', name: 'MemberList', component: MemberList, meta: { title: '会员管理', icon: 'Medal' } },
      { path: 'campaigns', name: 'CampaignList', component: CampaignList, meta: { title: '营销活动', icon: 'Promotion' } },
      { path: 'coupons', name: 'CouponManage', component: CouponManage, meta: { title: '优惠券', icon: 'Discount' } },
      { path: 'performance', name: 'Performance', component: Performance, meta: { title: '业绩排行', icon: 'TrendCharts' } },
      { path: 'todos', name: 'TodoList', component: TodoList, meta: { title: '待办任务', icon: 'List' } },
      // New routes
      { path: 'leads', name: 'LeadList', component: LeadList, meta: { title: '线索管理', icon: 'Aim' } },
      { path: 'leads/:id', name: 'LeadDetail', component: LeadDetail, meta: { title: '线索详情', hidden: true } },
      { path: 'opportunities', name: 'OpportunityList', component: OpportunityList, meta: { title: '商机管理', icon: 'Opportunity' } },
      { path: 'opportunities/:id', name: 'OpportunityDetail', component: OpportunityDetail, meta: { title: '商机详情', hidden: true } },
      { path: 'quotations', name: 'QuotationList', component: QuotationList, meta: { title: '报价管理', icon: 'Document' } },
      { path: 'quotations/:id', name: 'QuotationDetail', component: QuotationDetail, meta: { title: '报价详情', hidden: true } },
      { path: 'products', name: 'ProductList', component: ProductList, meta: { title: '产品管理', icon: 'Goods' } },
      { path: 'service', name: 'ServiceList', component: ServiceList, meta: { title: '服务管理', icon: 'Service' } },
      { path: 'service/:id', name: 'ServiceDetail', component: ServiceDetail, meta: { title: '服务详情', hidden: true } },
      { path: 'activities', name: 'ActivityList', component: ActivityList, meta: { title: '市场活动', icon: 'Present' } },
      { path: 'activities/:id', name: 'ActivityDetail', component: ActivityDetail, meta: { title: '活动详情', hidden: true } },
      { path: 'schedule', name: 'ScheduleView', component: ScheduleView, meta: { title: '日程任务', icon: 'Calendar' } },
      { path: 'notices', name: 'NoticeList', component: NoticeList, meta: { title: '公告通知', icon: 'Bell' } },
      { path: 'mails', name: 'MailList', component: MailList, meta: { title: '站内信', icon: 'Message' } },
      { path: 'documents', name: 'DocumentList', component: DocumentList, meta: { title: '文档管理', icon: 'Folder' } },
      { path: 'approvals', name: 'ApprovalList', component: ApprovalList, meta: { title: '审批管理', icon: 'Stamp' } },
      { path: 'dict', name: 'DictManage', component: DictManage, meta: { title: '数据字典', icon: 'Collection' } },
      { path: 'sys-config', name: 'SystemConfig', component: SystemConfig, meta: { title: '系统配置', icon: 'Setting' } },
      { path: 'sales-teams', name: 'SalesTeam', component: SalesTeam, meta: { title: '销售团队', icon: 'Avatar' } },
      { path: 'rfm-analysis', name: 'RfmAnalysis', component: RfmAnalysis, meta: { title: 'RFM分析', icon: 'PieChart' } },
      { path: 'sales-forecast', name: 'SalesForecast', component: SalesForecast, meta: { title: '销售预测', icon: 'TrendCharts' } },
      { path: 'student-dashboard', name: 'StudentDashboard', component: StudentDashboard, meta: { title: '学生分析', icon: 'School' } },
      { path: 'student-profiles', name: 'StudentProfiles', component: StudentProfiles, meta: { title: '学生画像' } },
      { path: 'student-tags', name: 'StudentTags', component: StudentTags, meta: { title: '智能标签' } },
      { path: 'student-rfm', name: 'StudentRfm', component: StudentRfm, meta: { title: 'RFM分层' } },
      { path: 'student-membership', name: 'StudentMembership', component: StudentMembership, meta: { title: '付费会员' } },
      { path: 'student-marketing', name: 'StudentMarketing', component: StudentMarketing, meta: { title: '校园活动' } },
      { path: 'student-tickets', name: 'StudentTickets', component: StudentTickets, meta: { title: '服务工单' } },
      { path: 'student-churn', name: 'StudentChurn', component: StudentChurn, meta: { title: '流失预警' } },
      { path: 'portal-manage', name: 'PortalManage', component: PortalManage, meta: { title: '门户管理', icon: 'Monitor' } },
      { path: 'feedback-manage', name: 'FeedbackManage', component: FeedbackManage, meta: { title: '反馈管理', icon: 'ChatDotRound' } },
      { path: 'points-manage', name: 'PointsManage', component: PointsManage, meta: { title: '积分管理', icon: 'Money' } },
      { path: 'coupon-manage', name: 'CouponAdmin', component: CouponAdmin, meta: { title: '优惠券管理', icon: 'Ticket' } },
      { path: 'workflow-manage', name: 'WorkflowManage', component: WorkflowManage, meta: { title: '自动化工作流', icon: 'Setting' } },
      { path: 'advanced-features', name: 'AdvancedFeatures', component: AdvancedFeatures, meta: { title: '高级功能中心', icon: 'Grid' } },
      { path: 'contract-mgr', name: 'ContractMgr', component: ContractMgr, meta: { title: '合同管理', icon: 'Document' } },
      { path: 'receivable-mgr', name: 'ReceivableMgr', component: ReceivableMgr, meta: { title: '回款管理', icon: 'Money' } },
      { path: 'sales-target', name: 'SalesTarget', component: SalesTarget, meta: { title: '销售目标', icon: 'Aim' } },
      { path: 'inventory-mgr', name: 'InventoryMgr', component: InventoryMgr, meta: { title: '库存管理', icon: 'Goods' } },
      { path: 'competitor-mgr', name: 'CompetitorMgr', component: CompetitorMgr, meta: { title: '竞争对手', icon: 'Warning' } },
      { path: 'knowledge-base', name: 'KnowledgeBase', component: KnowledgeBase, meta: { title: '知识库', icon: 'Reading' } },
      { path: 'campus-agent', name: 'CampusAgent', component: CampusAgent, meta: { title: '校园代理', icon: 'School' } },
      { path: 'group-buy-mgr', name: 'GroupBuyMgr', component: GroupBuyMgr, meta: { title: '拼团管理', icon: 'Connection' } },
      { path: 'audit-log', name: 'AuditLog', component: AuditLog, meta: { title: '操作日志', icon: 'List' } },
      { path: 'ai-assistant', name: 'AiAssistantPage', component: AiAssistantPage, meta: { title: 'AI 智能助手', icon: 'MagicStick' } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 鉴权守卫：未登录时重定向到登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.noAuth) {
    // 登录页等不需要鉴权的页面，如果已登录则跳转到首页
    if (token && to.path === '/login') {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  if (!token) {
    // 未登录，跳转到登录页，并保存目标路径用于登录后回跳
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  next()
})

export default router
