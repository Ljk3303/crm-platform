<template>
  <div class="dashboard-v2">
    <!-- Stats Cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4" v-for="card in statCards" :key="card.label">
        <div class="stat-card" :style="{ background: card.bg }">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-trend" :class="card.trend > 0 ? 'up' : 'down'">
              <el-icon><component :is="card.trend > 0 ? 'CaretTop' : 'CaretBottom'" /></el-icon>
              {{ Math.abs(card.trend) }}% vs 上月
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts Row -->
    <el-row :gutter="16" class="charts-row">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><span class="card-title">销售趋势</span></template>
          <div ref="salesChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><span class="card-title">商机漏斗</span></template>
          <div ref="funnelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Bottom Row -->
    <el-row :gutter="16" class="bottom-row">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">今日优先跟进 Top 5</span>
          </template>
          <el-table :data="priorityList" stripe>
            <el-table-column prop="rank" label="#" width="50" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.rank <= 3 ? 'danger' : 'warning'"
                  size="small"
                  round
                >
                  {{ row.rank }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" min-width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
            <el-table-column prop="reason" label="跟进原因" min-width="180" show-overflow-tooltip />
            <el-table-column prop="priority_score" label="优先级" min-width="80" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.priority_score"
                  :stroke-width="6"
                  :show-text="false"
                  :color="row.priority_score > 70 ? '#f56c6c' : '#e6a23c'"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span class="card-title">最新公告</span>
          </template>
          <div v-if="noticeList.length === 0" class="notice-empty">
            <el-empty description="暂无公告" :image-size="80" />
          </div>
          <div v-else class="notice-list">
            <div
              v-for="item in noticeList"
              :key="item.id"
              class="notice-item"
            >
              <div class="notice-dot" :class="{ urgent: item.level === 'urgent' }"></div>
              <div class="notice-body">
                <div class="notice-title">{{ item.title }}</div>
                <div class="notice-time">{{ item.created_at }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, markRaw } from 'vue'
import {
  TrendCharts, User, Money, Plus, Connection, DataAnalysis, List
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsApi, aiApi, noticeApi } from '@/api/index'

// Stat cards
const statCards = reactive([
  {
    label: '客户总数', value: '0', trend: 12, bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: markRaw(User)
  },
  {
    label: '订单总额', value: '¥0', trend: 8, bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    icon: markRaw(Money)
  },
  {
    label: '本月新增客户', value: '0', trend: -3, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    icon: markRaw(Plus)
  },
  {
    label: '活跃商机', value: '0', trend: 15, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    icon: markRaw(Connection)
  },
  {
    label: '转化率', value: '0%', trend: 5, bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    icon: markRaw(DataAnalysis)
  },
  {
    label: '待办任务', value: '0', trend: -8, bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    icon: markRaw(List)
  }
])

const priorityList = ref([])
const noticeList = ref([])

const salesChartRef = ref(null)
const funnelChartRef = ref(null)
let salesChart = null
let funnelChart = null

const formatMoney = (val) => {
  if (val == null) return '¥0'
  return '¥' + Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const formatPercent = (val) => {
  if (val == null) return '0%'
  return Number(val).toFixed(1) + '%'
}

const fetchDashboard = async () => {
  try {
    const res = await analyticsApi.dashboard()
    const data = res.data || res
    statCards[0].value = String(data.total_customers || 0)
    statCards[1].value = formatMoney(data.total_amount)
    statCards[2].value = String(data.new_customers_month || 0)
    statCards[3].value = String(data.active_opportunities || 0)
    statCards[4].value = formatPercent(data.conversion_rate)
    statCards[5].value = String(data.pending_tasks || 0)
    initSalesChart(data.sales_trend || [])
    initFunnelChart(data.funnel_data || [])
  } catch (e) {
    console.error('获取仪表盘数据失败', e)
  }
}

const fetchPriority = async () => {
  try {
    const res = await aiApi.todayPriority()
    const data = res.data?.items || res.data || []
    priorityList.value = data.slice(0, 5).map((item, idx) => ({
      ...item,
      rank: idx + 1
    }))
  } catch (e) {
    console.error('获取优先跟进失败', e)
  }
}

const fetchNotices = async () => {
  try {
    const res = await noticeApi.latest()
    noticeList.value = res.data?.items || res.data || []
  } catch (e) {
    console.error('获取公告失败', e)
  }
}

const initSalesChart = (data) => {
  if (!salesChartRef.value) return
  if (salesChart) salesChart.dispose()
  salesChart = echarts.init(salesChartRef.value)
  const months = data.map(d => d.month || d.label || '')
  const amounts = data.map(d => d.amount || d.value || 0)
  salesChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '目标'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value', axisLabel: { formatter: (v) => formatMoney(v) } },
    series: [
      {
        name: '销售额', type: 'line', smooth: true, data: amounts,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.4)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        lineStyle: { color: '#667eea', width: 2 },
        itemStyle: { color: '#667eea' }
      },
      {
        name: '目标', type: 'line', data: data.map(() => amounts.length ? Math.max(...amounts) * 1.2 : 0),
        lineStyle: { color: '#e6a23c', type: 'dashed', width: 1 },
        itemStyle: { color: '#e6a23c' }
      }
    ]
  })
}

const initFunnelChart = (data) => {
  if (!funnelChartRef.value) return
  if (funnelChart) funnelChart.dispose()
  funnelChart = echarts.init(funnelChartRef.value)
  const names = data.map(d => d.stage || d.name || '')
  const values = data.map(d => d.count || d.value || 0)
  const maxVal = Math.max(...values, 1)
  funnelChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', top: '3%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { show: false } },
    yAxis: { type: 'category', data: names, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar', data: values,
      itemStyle: {
        color: (params) => {
          const colors = ['#667eea', '#4facfe', '#43e97b', '#fa709a', '#f093fb', '#c0c4cc']
          return colors[params.dataIndex % colors.length]
        },
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', formatter: '{c}' }
    }]
  })
}

const handleResize = () => {
  salesChart?.resize()
  funnelChart?.resize()
}

onMounted(() => {
  fetchDashboard()
  fetchPriority()
  fetchNotices()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  salesChart?.dispose()
  funnelChart?.dispose()
})
</script>

<style scoped>
.dashboard-v2 { padding: 16px; }

.stats-row { margin-bottom: 16px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px;
  border-radius: 10px;
  color: #fff;
  min-height: 100px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  flex-shrink: 0;
}
.stat-info { flex: 1; min-width: 0; }
.stat-label { font-size: 12px; opacity: 0.85; margin-bottom: 4px; }
.stat-value { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.stat-trend { font-size: 11px; display: flex; align-items: center; gap: 2px; }
.stat-trend.up { color: #b7eb8f; }
.stat-trend.down { color: #ffd591; }

.charts-row { margin-bottom: 16px; }
.chart-container { width: 100%; height: 340px; }

.bottom-row { }
.card-title { font-size: 15px; font-weight: 600; }

.notice-empty { padding: 30px 0; }
.notice-list { display: flex; flex-direction: column; gap: 12px; }
.notice-item { display: flex; gap: 10px; align-items: flex-start; }
.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  margin-top: 6px;
  flex-shrink: 0;
}
.notice-dot.urgent { background: #f56c6c; }
.notice-body { flex: 1; min-width: 0; }
.notice-title { font-size: 13px; line-height: 1.4; cursor: pointer; color: #303133; }
.notice-title:hover { color: #409eff; }
.notice-time { font-size: 11px; color: #c0c4cc; margin-top: 4px; }
</style>
