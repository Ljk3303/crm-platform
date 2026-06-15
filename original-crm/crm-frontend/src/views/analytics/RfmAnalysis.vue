<template>
  <div class="rfm-page">
    <!-- Stats -->
    <div class="stats-row">
      <div v-for="s in tierStats" :key="s.tier" class="stat-card" :style="{borderLeft:'4px solid '+s.color}">
        <div class="stat-val">{{ s.count }}</div>
        <div class="stat-label" :style="{color:s.color}">{{ s.tier }}</div>
      </div>
    </div>

    <!-- Charts Row -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never" class="chart-card">
          <template #header><b>RFM 散点图</b> <span style="font-size:12px;color:#909399;font-weight:normal">X=R值 Y=F值 大小=M值</span></template>
          <div ref="scatterRef" style="height:380px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" class="chart-card">
          <template #header><b>客户分层分布</b></template>
          <div ref="pieRef" style="height:380px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Table -->
    <el-card shadow="never" style="margin-top:16px;border-radius:12px">
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <b>客户 RFM 明细 ({{ customerData.length }} 人)</b>
          <el-select v-model="filterTier" placeholder="全部" clearable size="small" style="width:150px" @change="renderCharts">
            <el-option v-for="t in tierList" :key="t" :label="t" :value="t"/>
          </el-select>
        </div>
      </template>
      <el-table :data="filteredData" stripe size="small" max-height="450">
        <el-table-column label="客户" min-width="140"><template #default="{row}"><b>{{ row.customerName }}</b><br><span style="font-size:11px;color:#909399">{{ row.phone }}</span></template></el-table-column>
        <el-table-column label="R(近度)" width="80" align="center"><template #default="{row}"><el-tag :type="scoreTag(row.rScore)" size="small">{{ row.rScore }}</el-tag></template></el-table-column>
        <el-table-column label="F(频次)" width="80" align="center"><template #default="{row}"><el-tag :type="scoreTag(row.fScore)" size="small">{{ row.fScore }}</el-tag></template></el-table-column>
        <el-table-column label="M(金额)" width="80" align="center"><template #default="{row}"><el-tag :type="scoreTag(row.mScore)" size="small">{{ row.mScore }}</el-tag></template></el-table-column>
        <el-table-column label="综合分层" width="140"><template #default="{row}"><el-tag :color="tierColor(row.segment)" effect="dark" size="small">{{ row.segment }}</el-tag></template></el-table-column>
        <el-table-column label="客户等级" width="90"><template #default="{row}"><el-tag size="small" :type="row.level==='高价值'?'warning':'info'">{{ row.level }}</el-tag></template></el-table-column>
        <el-table-column label="来源" width="80"><template #default="{row}">{{ row.source }}</template></el-table-column>
        <el-table-column label="计算时间" width="150"><template #default="{row}">{{ row.lastCalc?.substring(0,16) }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const scatterRef = ref(null)
const pieRef = ref(null)
let sc = null, pc = null
const customerData = ref([])
const filterTier = ref('')

const tierColors = {
  '核心价值客户': '#10B981', '潜力客户': '#3B82F6', '一般客户': '#F59E0B', '流失风险客户': '#EF4444'
}
const tierList = computed(() => [...new Set(customerData.value.map(d => d.segment))])
const tierStats = computed(() => tierList.value.map(t => ({tier:t, count:customerData.value.filter(d=>d.segment===t).length, color:tierColors[t]||'#909399'})))
const filteredData = computed(() => filterTier.value ? customerData.value.filter(d => d.segment === filterTier.value) : customerData.value)

function scoreTag(s) { return s >= 4 ? 'success' : s >= 3 ? '' : s >= 2 ? 'warning' : 'danger' }
function tierColor(t) { return tierColors[t] || '#909399' }

async function fetchData() {
  try {
    const res = await request.get('/ai/rfm-analysis')
    customerData.value = Array.isArray(res) ? res : (res?.records || [])
    await nextTick(); renderCharts()
  } catch {}
}

function renderCharts() {
  const data = filteredData.value
  if (!scatterRef.value || !pieRef.value || !data.length) return

  // Scatter
  if (!sc) sc = echarts.init(scatterRef.value)
  const tiers = [...new Set(data.map(d => d.segment))]
  sc.setOption({
    tooltip: {
      formatter: p => {
        const d = p.data; if (!d) return ''
        return `<b>${d[3]}</b><br/>R: ${d[0]} F: ${d[1]} M: ${d[2]}<br/>${d[4]}`
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { name: 'R 值（近度）', nameTextStyle: {fontSize:12}, max: 6, min: 0, axisLabel: {fontSize:11} },
    yAxis: { name: 'F 值（频次）', nameTextStyle: {fontSize:12}, max: 6, min: 0, axisLabel: {fontSize:11} },
    series: tiers.map(t => ({
      name: t, type: 'scatter',
      symbolSize: function(data) { return (data[2] || 1) * 8 + 8 },
      itemStyle: { color: tierColors[t] || '#909399' },
      data: data.filter(d => d.segment === t).map(d => [d.rScore, d.fScore, d.mScore, d.customerName, d.segment]),
      emphasis: { scale: 1.5 }
    })),
    legend: { bottom: 0, textStyle: { fontSize: 11 } }
  }, true)

  // Pie
  if (!pc) pc = echarts.init(pieRef.value)
  pc.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: true,
      label: { show: true, position: 'outside', formatter: '{b}\n{d}%', fontSize: 11, lineHeight: 16 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } },
      data: tierStats.value.map(t => ({ name: t.tier, value: t.count, itemStyle: { color: t.color } }))
    }]
  }, true)
}

onMounted(() => { fetchData() })
onUnmounted(() => { sc?.dispose(); pc?.dispose() })
</script>

<style scoped>
.rfm-page { padding: 0; }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
.stat-card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.stat-val { font-size: 28px; font-weight: 800; color: #1E293B; }
.stat-label { font-size: 13px; margin-top: 2px; font-weight: 600; }
.chart-card { border-radius: 12px; margin-bottom: 0; }
</style>
