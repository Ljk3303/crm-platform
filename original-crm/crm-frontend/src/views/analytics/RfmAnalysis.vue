<template>
  <div class="rfm-page">
    <!-- DEBUG: 数据状态 -->
    <div class="debug-banner" v-if="ready">
      <span>✅ 已加载 {{ list.length }} 条RFM数据 | 分层: {{ tierStats.length }} 类</span>
    </div>
    <div class="debug-banner error" v-if="!ready && mounted">
      <span>⏳ 正在加载...</span>
    </div>

    <div class="stats-row">
      <div v-for="s in tierStats" :key="s.tier" class="stat-card" :style="{borderLeft:'4px solid '+s.color}">
        <div class="stat-val">{{ s.count }}</div>
        <div class="stat-label" :style="{color:s.color}">{{ s.tier }}</div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="chart-card">
          <template #header><b>RFM 散点图</b></template>
          <div ref="sRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="chart-card">
          <template #header><b>客户分层分布</b></template>
          <div ref="pRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top:16px">
      <template #header><b>客户明细 ({{ list.length }} 人)</b></template>
      <el-table :data="list" stripe size="small" max-height="450">
        <el-table-column label="客户" min-width="120">
          <template #default="{row}"><b>{{ row.customerName }}</b></template>
        </el-table-column>
        <el-table-column label="R" width="60">
          <template #default="{row}">
            <el-tag :type="row.rScore>=4?'success':row.rScore>=3?'':'danger'" size="small">{{ row.rScore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="F" width="60">
          <template #default="{row}">
            <el-tag :type="row.fScore>=4?'success':row.fScore>=3?'':'danger'" size="small">{{ row.fScore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="M" width="60">
          <template #default="{row}">
            <el-tag :type="row.mScore>=4?'success':row.mScore>=3?'':'danger'" size="small">{{ row.mScore }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分层" width="130">
          <template #default="{row}">
            <el-tag :color="tc[row.segment]||'#909399'" effect="dark" size="small">{{ row.segment }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="70">
          <template #default="{row}">{{ row.level }}</template>
        </el-table-column>
        <el-table-column label="来源" width="70">
          <template #default="{row}">{{ row.source }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const sRef = ref(null)
const pRef = ref(null)
let sc = null
let pc = null
const mounted = ref(false)
const ready = ref(false)

const tc = {
  '核心价值客户':'#10B981',
  '潜力客户':'#3B82F6',
  '一般客户':'#F59E0B',
  '流失风险客户':'#EF4444'
}

// ====== DEMO DATA ======
const D = [
  {customerName:'陈思雨',rScore:5,fScore:4,mScore:5,segment:'核心价值客户',level:'高价值',source:'门店'},
  {customerName:'孙美美',rScore:5,fScore:4,mScore:5,segment:'核心价值客户',level:'高价值',source:'门店'},
  {customerName:'王大明',rScore:4,fScore:5,mScore:4,segment:'核心价值客户',level:'高价值',source:'小程序'},
  {customerName:'李佳琪',rScore:4,fScore:3,mScore:4,segment:'潜力客户',level:'高价值',source:'门店'},
  {customerName:'钱多多',rScore:4,fScore:3,mScore:3,segment:'潜力客户',level:'高价值',source:'门店'},
  {customerName:'刘建国',rScore:3,fScore:2,mScore:4,segment:'潜力客户',level:'高价值',source:'小程序'},
  {customerName:'测试用户2',rScore:3,fScore:3,mScore:3,segment:'潜力客户',level:'学生',source:'校园认证'},
  {customerName:'黄子轩',rScore:3,fScore:3,mScore:3,segment:'潜力客户',level:'普通',source:'小程序'},
  {customerName:'赵铁柱',rScore:3,fScore:2,mScore:3,segment:'一般客户',level:'普通',source:'地推'},
  {customerName:'周星星',rScore:2,fScore:2,mScore:2,segment:'一般客户',level:'普通',source:'门店'},
  {customerName:'张晓萌',rScore:2,fScore:1,mScore:2,segment:'流失风险客户',level:'普通',source:'门店'},
  {customerName:'林小慧',rScore:1,fScore:1,mScore:1,segment:'流失风险客户',level:'普通',source:'小程序'},
]

// IMMEDIATELY init with demo data
const list = ref(D)

const tierStats = computed(() => {
  const m = {}
  list.value.forEach(d => {
    m[d.segment] = (m[d.segment]||0)+1
  })
  return Object.entries(m).map(([k,v]) => ({
    tier: k,
    count: v,
    color: tc[k]||'#909399'
  }))
})

function draw() {
  if (!sRef.value || !pRef.value) return
  if (!list.value.length) return

  // Init echarts
  if (!sc) {
    try { sc = echarts.init(sRef.value) } catch(e) { console.error('ECharts init scatter fail:', e); return }
  }
  if (!pc) {
    try { pc = echarts.init(pRef.value) } catch(e) { console.error('ECharts init pie fail:', e); return }
  }

  // Scatter chart
  sc.setOption({
    tooltip: {
      formatter: p => {
        const d = p.data
        return d ? `<b>${d[3]}</b><br/>R:${d[0]} F:${d[1]} M:${d[2]}` : ''
      }
    },
    grid: { left: 40, right: 10, top: 10, bottom: 30 },
    xAxis: { name: 'R值', max: 6, min: 0 },
    yAxis: { name: 'F值', max: 6, min: 0 },
    series: Object.entries(tc).map(([t, c]) => ({
      name: t,
      type: 'scatter',
      symbolSize: d => (d[2]||1)*8+8,
      itemStyle: { color: c },
      data: list.value.filter(d => d.segment===t).map(d => [d.rScore, d.fScore, d.mScore, d.customerName])
    })),
    legend: { bottom: 0, textStyle: { fontSize: 10 } }
  }, true)

  // Pie chart
  pc.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data: tierStats.value.map(t => ({
        name: t.tier,
        value: t.count,
        itemStyle: { color: t.color }
      }))
    }]
  }, true)

  ready.value = true
}

onMounted(() => {
  mounted.value = true
  // Draw charts after DOM is ready with sufficient delay
  nextTick(() => { setTimeout(() => draw(), 300) })
  // Retry draw after longer delay to catch slow el-card rendering
  setTimeout(() => { if (!ready.value) draw() }, 1000)

  // Try API in background
  request.get('/ai/rfm-analysis').then(res => {
    if (Array.isArray(res) && res.length > 0) {
      list.value = res
      nextTick(() => { setTimeout(() => draw(), 300) })
    }
  }).catch(() => {
    console.log('RFM: using demo data (API not available)')
  })
})

onUnmounted(() => {
  try { sc?.dispose() } catch {}
  try { pc?.dispose() } catch {}
})
</script>

<style scoped>
.rfm-page { padding: 0; }
.debug-banner {
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #ecfdf5;
  color: #065f46;
  font-size: 13px;
  font-weight: 500;
}
.debug-banner.error {
  background: #fef2f2;
  color: #991b1b;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.stat-val {
  font-size: 28px;
  font-weight: 800;
  color: #1E293B;
}
.stat-label {
  font-size: 13px;
  margin-top: 2px;
  font-weight: 600;
}
.chart-card {
  border-radius: 12px;
  margin-bottom: 0;
}
.chart-box {
  width: 100%;
  height: 380px;
}
</style>
