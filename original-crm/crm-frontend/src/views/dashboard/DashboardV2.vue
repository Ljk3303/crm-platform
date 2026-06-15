<template>
  <div class="dashboard-v2">
    <div class="page-hd"><h2>Dashboard</h2><span class="text-muted">Overview of your business</span></div>

    <!-- Stats -->
    <div class="stat-grid">
      <div v-for="card in statCards" :key="card.label" class="stat-card-item">
        <div class="stat-card-top">
          <span class="stat-card-label">{{ card.label }}</span>
          <div class="stat-card-icon" :class="card.accent"><el-icon :size="18"><component :is="card.icon"/></el-icon></div>
        </div>
        <div class="stat-card-value">{{ card.value }}</div>
        <div class="stat-card-sub" :style="{color:card.trend>0?'#16a34a':'#dc2626'}">{{ card.trend>0?'+':'-' }}{{ Math.abs(card.trend) }}% from last month</div>
      </div>
    </div>

    <!-- Charts -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
      <div class="content-card">
        <div class="content-card-header">Sales Trend<span class="text-muted text-sm">Monthly</span></div>
        <div class="content-card-body"><div ref="salesChartRef" class="chart-area"></div></div>
      </div>
      <div class="content-card">
        <div class="content-card-header">Sales Funnel<span class="text-muted text-sm">Real-time</span></div>
        <div class="content-card-body"><div ref="funnelChartRef" class="chart-area"></div></div>
      </div>
    </div>

    <!-- Bottom -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
      <div class="content-card">
        <div class="content-card-header">Priority Follow-ups</div>
        <div class="content-card-body">
          <div v-if="priorityList.length" class="shad-list">
            <div v-for="(p,i) in priorityList" :key="i" class="shad-item">
              <span class="shad-dot" :class="p.priority==='高'?'red':'amber'"></span>
              <span class="shad-name">{{ p.customerName }}</span>
              <span class="text-muted" style="margin-left:auto">{{ p.reason }}</span>
            </div>
          </div>
          <div v-else class="text-muted" style="text-align:center;padding:20px 0">No pending items</div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card-header">Recent Notices</div>
        <div class="content-card-body">
          <div v-if="noticeList.length" class="shad-list">
            <div v-for="n in noticeList" :key="n.id" class="shad-item">
              <span class="shad-dot blue"></span>
              <div><div style="font-weight:500;font-size:13px">{{ n.title }}</div><div class="text-muted">{{ n.created_at?.substring(0,16) }}</div></div>
            </div>
          </div>
          <div v-else class="text-muted" style="text-align:center;padding:20px 0">No notices</div>
        </div>
      </div>
      <div class="content-card">
        <div class="content-card-header">Quick Break</div>
        <div class="content-card-body"><BubbleWrap /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, markRaw } from 'vue'
import { TrendCharts, User, Money, Plus, Connection, DataAnalysis, List } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsApi, aiApi, noticeApi } from '@/api/index'
import BubbleWrap from '@/components/relax/BubbleWrap.vue'

const statCards = reactive([
  { label: 'Total Customers', value: '0', trend: 12, color: '#3b82f6', accent: 'blue', icon: markRaw(User) },
  { label: 'Monthly Revenue', value: '¥0', trend: 8, color: '#22c55e', accent: 'green', icon: markRaw(Money) },
  { label: 'Active Opportunities', value: '0', trend: 15, color: '#8b5cf6', accent: 'blue', icon: markRaw(Connection) },
  { label: 'Pending Tasks', value: '0', trend: -5, color: '#ef4444', accent: 'red', icon: markRaw(List) },
])

const priorityList = ref([])
const noticeList = ref([])
const salesChartRef = ref(null)
const funnelChartRef = ref(null)
let salesChart = null, funnelChart = null

const fm = v => v == null ? '¥0' : '¥' + Number(v).toLocaleString()

async function fetchDashboard() {
  try {
    const res = await analyticsApi.dashboard()
    const d = res || null
    statCards[0].value = String(d.totalCustomers || d.total_customers || 0)
    statCards[1].value = fm(d.monthOrderAmount || d.total_amount)
    statCards[2].value = String(d.totalOpportunities || d.active_opportunities || 0)
    statCards[3].value = String(d.pendingTodos || d.pending_tasks || 0)
    initSalesChart()
    initFunnelChart()
  } catch (e) { console.error(e) }
}

async function fetchPriority() {
  try {
    const res = await aiApi.todayPriority()
    priorityList.value = (res || []).slice(0, 5)
  } catch {}
}

async function fetchNotices() {
  try {
    const res = await noticeApi.latest()
    noticeList.value = (res || []).slice(0, 3)
  } catch {}
}

function initSalesChart() {
  if (!salesChartRef.value) return
  if (salesChart) salesChart.dispose()
  salesChart = echarts.init(salesChartRef.value)
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  const data = [18000,22000,25000,28000,31000,26000,35000,38000,32000,40000,37000,42000]
  salesChart.setOption({
    tooltip: { trigger: 'axis', borderColor: '#e5e7eb', backgroundColor: '#fff', textStyle: { color: '#374151' } },
    grid: { left: 8, right: 24, top: 8, bottom: 8 },
    xAxis: { type: 'category', data: months, axisLabel: { fontSize: 10, color: '#9ca3af', fontFamily: 'Inter,sans-serif' }, axisLine: { lineStyle: { color: '#e5e7eb' } } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#9ca3af' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    series: [{
      type: 'line', data, smooth: true, symbol: 'none',
      areaStyle: { color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(59,130,246,0.12)'},{offset:1,color:'rgba(59,130,246,0)'}]) },
      lineStyle: { color: '#3b82f6', width: 2.5 }
    }]
  })
}

function initFunnelChart() {
  if (!funnelChartRef.value) return
  if (funnelChart) funnelChart.dispose()
  funnelChart = echarts.init(funnelChartRef.value)
  const names = ['初步接触','需求确认','方案报价','商务谈判','合同签约']
  const values = [45, 30, 18, 8, 5]
  funnelChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 8, right: 30, top: 8, bottom: 8 },
    xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11, color: '#64748B' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', data: values, barWidth: 18,
      itemStyle: { borderRadius: [0,8,8,0], color: p => ['#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE'][p.dataIndex] },
      label: { show: true, position: 'right', fontSize: 11, color: '#64748B' }
    }]
  })
}

onMounted(() => { fetchDashboard(); fetchPriority(); fetchNotices() })
onUnmounted(() => { salesChart?.dispose(); funnelChart?.dispose() })
</script>

<style scoped>
.dashboard-v2{display:flex;flex-direction:column;gap:14px;padding:2px 0}

/* Minimal shadcn-style list */
.shad-list{display:flex;flex-direction:column;gap:2px}
.shad-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9}
.shad-item:last-child{border-bottom:none}
.shad-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.shad-dot.red{background:#ef4444}.shad-dot.amber{background:#f59e0b}.shad-dot.blue{background:#3b82f6}
.shad-name{font-weight:600;font-size:13px;color:#1e293b}

@media(max-width:900px){[style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}
  [style*="grid-template-columns:1fr 1fr 1fr"]{grid-template-columns:1fr!important}}
</style>
