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
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
