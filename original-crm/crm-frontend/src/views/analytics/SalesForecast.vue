<template>
  <div class="sales-forecast">
    <div class="page-header">
      <h2>销售预测</h2>
      <span class="header-tip">基于历史数据与AI模型预测未来销售趋势</span>
    </div>

    <!-- Stat Cards -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">历史总销售额（近12个月）</div>
          <div class="stat-value full">{{ formatAmount(historyTotal) }}</div>
          <div class="stat-sub">过去12个月累计销售额</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card forecast">
          <div class="stat-label">预测总销售额（未来3个月）</div>
          <div class="stat-value full">{{ formatAmount(forecastTotal) }}</div>
          <div class="stat-sub">AI模型预测</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">预期增长率</div>
          <div class="stat-value full">
            <span :class="growthRate > 0 ? 'positive' : 'negative'">
              {{ growthRate >= 0 ? '+' : '' }}{{ growthRate }}%
            </span>
          </div>
          <div class="stat-sub">环比预测增长率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chart -->
    <el-card shadow="never" class="chart-card" v-loading="chartLoading">
      <div class="chart-header">
        <span class="chart-title">销售趋势与预测</span>
        <el-radio-group v-model="chartType" size="small" @change="updateChart">
          <el-radio-button value="line">折线图</el-radio-button>
          <el-radio-button value="bar">柱状图</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { aiApi } from '@/api/index'

const chartRef = ref(null)
let chartInstance = null

const chartLoading = ref(false)
const chartType = ref('line')

const historyTotal = ref(0)
const forecastTotal = ref(0)
const growthRate = ref(0)

const months = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
  '预测1月', '预测2月', '预测3月'
]

const historyData = ref([])
const forecastData = ref([])

function formatAmount(val) {
  if (!val && val !== 0) return '--'
  if (val >= 100000000) return (val / 100000000).toFixed(2) + ' 亿'
  if (val >= 10000) return (val / 10000).toFixed(2) + ' 万'
  return Number(val).toLocaleString('zh-CN') + ' 元'
}

function getChartOption() {
  const isLine = chartType.value === 'line'
  const seriesType = isLine ? 'line' : 'bar'

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        let result = params[0]?.axisValue || ''
        for (const p of params) {
          const val = p.value !== null && p.value !== undefined ? Number(p.value).toLocaleString('zh-CN') + ' 元' : '--'
          result += `<br/>${p.marker} ${p.seriesName}: ${val}`
        }
        return result
      }
    },
    legend: {
      data: ['历史销售额', '预测销售额'],
      top: 0
    },
    grid: {
      top: 40,
      left: 80,
      right: 40,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: months,
      boundaryGap: false,
      axisLabel: { rotate: 0 }
    },
    yAxis: {
      type: 'value',
      name: '销售额（元）',
      axisLabel: {
        formatter: (val) => {
          if (val >= 100000000) return (val / 100000000).toFixed(1) + '亿'
          if (val >= 10000) return (val / 10000).toFixed(0) + '万'
          return val
        }
      }
    },
    series: [
      // Historical data (solid blue)
      {
        name: '历史销售额',
        type: seriesType,
        data: padData(historyData.value, 15),
        itemStyle: { color: '#409eff' },
        lineStyle: { color: '#409eff', width: 2 },
        smooth: true,
        symbol: 'circle',
        symbolSize: 6
      },
      // Forecast data (dashed orange)
      {
        name: '预测销售额',
        type: seriesType,
        data: padForecastData(forecastData.value, 15),
        itemStyle: { color: '#e6a23c' },
        lineStyle: { color: '#e6a23c', width: 2, type: 'dashed' },
        smooth: true,
        symbol: 'diamond',
        symbolSize: 8
      }
    ]
  }
}

function padData(arr, len) {
  const padded = [...arr]
  while (padded.length < len) padded.push(null)
  return padded
}

function padForecastData(arr, len) {
  // First 12 positions are null (history), last 3 are forecast
  const padded = new Array(12).fill(null)
  for (let i = 0; i < arr.length && i < 3; i++) {
    padded.push(arr[i])
  }
  while (padded.length < len) padded.push(null)
  return padded
}

function initChart() {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(getChartOption())
}

function updateChart() {
  if (chartInstance) {
    chartInstance.setOption(getChartOption())
  }
}

async function fetchForecastData() {
  chartLoading.value = true
  try {
    const res = await aiApi.salesForecast()
    const data = res || {}

    // Backend returns [{month, amount}, ...] - extract amount values
    const extractAmounts = (arr) => arr.map(v => typeof v === 'object' ? (v.amount || 0) : (v || 0))

    if (data.history && data.history.length) {
      historyData.value = extractAmounts(data.history.slice(0, 12))
    } else if (data.historyData && data.historyData.length) {
      historyData.value = extractAmounts(data.historyData.slice(0, 12))
    } else {
      historyData.value = generateSampleHistory()
    }

    if (data.forecast && data.forecast.length) {
      forecastData.value = extractAmounts(data.forecast.slice(0, 3))
    } else if (data.forecastData && data.forecastData.length) {
      forecastData.value = extractAmounts(data.forecastData.slice(0, 3))
    } else {
      forecastData.value = generateSampleForecast(historyData.value)
    }

    historyTotal.value = historyData.value.reduce((sum, v) => sum + Number(v || 0), 0)
    forecastTotal.value = forecastData.value.reduce((sum, v) => sum + Number(v || 0), 0)

    // Calculate growth rate
    const last3History = historyData.value.slice(-3).reduce((sum, v) => sum + Number(v || 0), 0)
    if (last3History > 0) {
      growthRate.value = ((forecastTotal.value - last3History) / last3History * 100).toFixed(1)
    } else {
      growthRate.value = 0
    }

    await nextTick()
    initChart()
  } catch {
    ElMessage.error('加载销售预测数据失败')
    // Generate fallback sample data
    historyData.value = generateSampleHistory()
    forecastData.value = generateSampleForecast(historyData.value)
    historyTotal.value = historyData.value.reduce((sum, v) => sum + Number(v || 0), 0)
    forecastTotal.value = forecastData.value.reduce((sum, v) => sum + Number(v || 0), 0)
    growthRate.value = 5.2
    await nextTick()
    initChart()
  } finally {
    chartLoading.value = false
  }
}

function generateSampleHistory() {
  return [
    120000, 135000, 118000, 150000, 145000, 160000,
    170000, 155000, 185000, 175000, 190000, 200000
  ]
}

function generateSampleForecast(history) {
  const last = history[history.length - 1] || 200000
  const rate = 1.05
  return [
    Math.round(last * rate),
    Math.round(last * rate * rate),
    Math.round(last * rate * rate * rate)
  ]
}

function handleResize() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(chartType, () => {
  updateChart()
})

onMounted(() => {
  fetchForecastData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.sales-forecast {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-tip {
  font-size: 13px;
  color: #909399;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
}

.stat-card.forecast {
  border-left: 4px solid #e6a23c;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-value .positive {
  color: #67c23a;
}

.stat-value .negative {
  color: #f56c6c;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

.chart-card {
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 420px;
}
</style>
