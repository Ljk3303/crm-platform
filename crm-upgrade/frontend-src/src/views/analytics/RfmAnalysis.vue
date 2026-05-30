<template>
  <div class="rfm-analysis">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="page-title">RFM 分析</span>
        <el-select v-model="selectedSegment" placeholder="选择分层" clearable @change="handleFilterChange">
          <el-option label="全部" value="" />
          <el-option v-for="s in segments" :key="s" :label="s" :value="s" />
        </el-select>
      </div>
    </el-card>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- Scatter/Bubble Chart -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>RFM 散点图（X=最近消费间隔 R, Y=消费频率 F, 气泡=消费金额 M）</template>
          <div ref="scatterChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <!-- Pie Chart -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>客户分层分布</template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Segment Filter / Legend -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>分层图例</template>
      <div class="segment-legend">
        <el-checkbox-group v-model="visibleSegments" @change="handleSegmentFilter">
          <el-checkbox
            v-for="seg in segmentConfigs"
            :key="seg.name"
            :label="seg.name"
            border
            size="small"
          >
            <span :style="{ color: seg.color }">{{ seg.name }} - {{ seg.label }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </el-card>

    <!-- Customer Table -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <span>客户 RFM 明细</span>
      </template>
      <el-table :data="filteredTableData" v-loading="tableLoading" stripe border>
        <el-table-column prop="customer_name" label="客户名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="R 值" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="scoreType(row.r_score)" size="small">{{ row.r_score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="F 值" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="scoreType(row.f_score)" size="small">{{ row.f_score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="M 值" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="scoreType(row.m_score)" size="small">{{ row.m_score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分层" width="120" align="center">
          <template #default="{ row }">
            <el-tag :color="segmentColor(row.segment)" effect="dark" size="small">{{ row.segment }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="消费总额" width="130" align="right">
          <template #default="{ row }">¥{{ formatNumber(row.total_amount) }}</template>
        </el-table-column>
        <el-table-column label="最近消费" width="120">
          <template #default="{ row }">{{ formatDate(row.last_purchase_date) }}</template>
        </el-table-column>
        <el-table-column label="购买次数" width="90" align="center">
          <template #default="{ row }">{{ row.purchase_count || 0 }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { aiApi } from '@/api/index'

// Chart refs
const scatterChartRef = ref(null)
const pieChartRef = ref(null)
let scatterChart = null
let pieChart = null

// State
const loading = ref(false)
const tableLoading = ref(false)
const selectedSegment = ref('')
const visibleSegments = ref([])
const customerData = ref([])

const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

// Segment configs
const segmentConfigs = ref([
  { name: '重要价值客户', label: '3-3-3', color: '#409EFF' },
  { name: '重要发展客户', label: '3-3-2', color: '#67C23A' },
  { name: '重要保持客户', label: '2-3-3', color: '#E6A23C' },
  { name: '重要挽留客户', label: '1-3-3', color: '#F56C6C' },
  { name: '一般价值客户', label: '3-2-2', color: '#909399' },
  { name: '一般发展客户', label: '2-2-2', color: '#B37FEB' },
  { name: '一般保持客户', label: '1-2-2', color: '#FF85C0' },
  { name: '流失客户', label: '1-1-1', color: '#D9D9D9' }
])

const segments = computed(() => segmentConfigs.value.map(s => s.name))

// Filtered table data
const filteredTableData = computed(() => {
  if (!selectedSegment.value) return customerData.value
  return customerData.value.filter(c => c.segment === selectedSegment.value)
})

function segmentColor(segment) {
  const cfg = segmentConfigs.value.find(s => s.name === segment)
  return cfg ? cfg.color : '#909399'
}

function scoreType(score) {
  if (score >= 4) return 'success'
  if (score >= 3) return ''
  if (score >= 2) return 'warning'
  return 'danger'
}

function formatNumber(num) {
  return (num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val) return '-'
  return val.substring(0, 10)
}

// Data fetch
async function fetchData() {
  loading.value = true
  tableLoading.value = true
  try {
    const res = await aiApi.rfmAnalysis()
    const data = res.data || {}
    customerData.value = data.customers || data.list || data.records || []
    pagination.total = data.total || customerData.value.length

    // Fetch paginated
    if (data.customers || data.records) {
      pagination.total = data.total || customerData.value.length
    }

    await nextTick()
    renderScatterChart()
    renderPieChart()
  } catch {
    ElMessage.error('获取 RFM 分析数据失败')
  } finally {
    loading.value = false
    tableLoading.value = false
  }
}

// Charts
function getChartData() {
  const data = customerData.value
  if (!data.length) return { scatterData: [], pieData: [] }

  const scatterData = data.map(item => ({
    value: [item.r_score || 0, item.f_score || 0, item.m_score || 0],
    name: item.customer_name,
    segment: item.segment
  }))

  // Pie data - count by segment
  const segmentCounts = {}
  data.forEach(item => {
    const seg = item.segment || '未分类'
    segmentCounts[seg] = (segmentCounts[seg] || 0) + 1
  })
  const pieData = Object.entries(segmentCounts).map(([name, value]) => ({ name, value }))

  return { scatterData, pieData }
}

function renderScatterChart() {
  if (!scatterChartRef.value) return
  if (scatterChart) scatterChart.dispose()

  scatterChart = echarts.init(scatterChartRef.value)
  const { scatterData } = getChartData()

  if (!scatterData.length) {
    scatterChart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#c0c4cc', fontSize: 14 } }
    })
    return
  }

  // Group by segment
  const segmentGroups = {}
  scatterData.forEach(d => {
    const seg = d.segment || '未分类'
    if (!segmentGroups[seg]) segmentGroups[seg] = []
    segmentGroups[seg].push(d)
  })

  const series = Object.entries(segmentGroups).map(([seg, items]) => ({
    name: seg,
    type: 'scatter',
    symbolSize: (val) => (val[2] || 1) * 10 + 8,
    data: items,
    emphasis: {
      focus: 'series',
      label: { show: true, formatter: p => p.name, position: 'top' }
    },
    itemStyle: {
      shadowBlur: 10,
      shadowColor: 'rgba(0, 0, 0, 0.3)',
      shadowOffsetX: 0,
      shadowOffsetY: 0
    }
  }))

  scatterChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        if (!p.data) return ''
        const [r, f, m] = p.data.value || []
        return `${p.data.name}<br/>R: ${r} F: ${f} M: ${m}<br/>分层: ${p.seriesName}`
      }
    },
    legend: { data: Object.keys(segmentGroups), bottom: 0 },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      name: 'R (最近消费间隔)',
      nameLocation: 'center',
      nameGap: 30,
      min: 0,
      max: 6,
      interval: 1,
      splitLine: { show: true, lineStyle: { type: 'dashed' } }
    },
    yAxis: {
      name: 'F (消费频率)',
      nameLocation: 'center',
      nameGap: 35,
      min: 0,
      max: 6,
      interval: 1,
      splitLine: { show: true, lineStyle: { type: 'dashed' } }
    },
    series
  })
}

function renderPieChart() {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()

  pieChart = echarts.init(pieChartRef.value)
  const { pieData } = getChartData()

  if (!pieData.length) {
    pieChart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#c0c4cc', fontSize: 14 } }
    })
    return
  }

  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
    legend: { orient: 'vertical', left: 10, top: 20 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: pieData
    }]
  })
}

// Filters
function handleFilterChange() {
  pagination.page = 1
  pagination.total = filteredTableData.value.length
}

function handleSegmentFilter(checkedSegments) {
  // Trigger chart re-render with filtered data
  renderScatterChart()
}

// Resize
function handleResize() {
  scatterChart?.resize()
  pieChart?.resize()
}

// Init
onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  scatterChart?.dispose()
  pieChart?.dispose()
})

// Re-render charts when tab switches
watch(() => customerData.value, () => {
  nextTick(() => {
    renderScatterChart()
    renderPieChart()
  })
}, { deep: true })
</script>

<style scoped>
.rfm-analysis {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
}

.chart-box {
  width: 100%;
  height: 400px;
}

.segment-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
