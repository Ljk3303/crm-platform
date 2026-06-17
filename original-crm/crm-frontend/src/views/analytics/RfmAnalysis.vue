<template>
  <div class="rfm-page">
    <div class="stats-row">
      <div v-for="s in tierStats" :key="s.tier" class="stat-card" :style="{borderLeft:'4px solid '+s.color}">
        <div class="stat-val">{{ s.count }}</div>
        <div class="stat-label" :style="{color:s.color}">{{ s.tier }}</div>
      </div>
    </div>
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card shadow="never" class="chart-card">
          <template #header><b>RFM 散点图</b></template>
          <div ref="sRef" style="width:100%;height:380px"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never" class="chart-card">
          <template #header><b>客户分层分布</b></template>
          <div ref="pRef" style="width:100%;height:380px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="never" style="margin-top:16px;border-radius:12px">
      <template #header><b>客户 RFM 明细 ({{ customerData.length }} 人)</b></template>
      <el-table :data="customerData" stripe size="small" max-height="450">
        <el-table-column label="客户" min-width="120"><template #default="{row}"><b>{{ row.customerName }}</b></template></el-table-column>
        <el-table-column label="R(近度)" width="70" align="center"><template #default="{row}"><el-tag :type="row.rScore>=4?'success':row.rScore>=3?'':'danger'" size="small">{{ row.rScore }}</el-tag></template></el-table-column>
        <el-table-column label="F(频次)" width="70" align="center"><template #default="{row}"><el-tag :type="row.fScore>=4?'success':row.fScore>=3?'':'danger'" size="small">{{ row.fScore }}</el-tag></template></el-table-column>
        <el-table-column label="M(金额)" width="70" align="center"><template #default="{row}"><el-tag :type="row.mScore>=4?'success':row.mScore>=3?'':'danger'" size="small">{{ row.mScore }}</el-tag></template></el-table-column>
        <el-table-column label="综合分层" width="130"><template #default="{row}"><el-tag :color="tc[row.segment]||'#909399'" effect="dark" size="small">{{ row.segment }}</el-tag></template></el-table-column>
        <el-table-column label="客户等级" width="80"><template #default="{row}">{{ row.level }}</template></el-table-column>
        <el-table-column label="来源" width="80"><template #default="{row}">{{ row.source }}</template></el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const sRef = ref(null), pRef = ref(null)
let sc = null, pc = null

const tc = { '核心价值客户':'#10B981', '潜力客户':'#3B82F6', '一般客户':'#F59E0B', '流失风险客户':'#EF4444' }

const RD = [
  { customerName:'陈思雨', phone:'13910001111', rScore:5, fScore:4, mScore:5, segment:'核心价值客户', level:'高价值', source:'门店' },
  { customerName:'孙美美', phone:'13910001125', rScore:5, fScore:4, mScore:5, segment:'核心价值客户', level:'高价值', source:'门店' },
  { customerName:'王大明', phone:'13910001115', rScore:4, fScore:5, mScore:4, segment:'核心价值客户', level:'高价值', source:'小程序' },
  { customerName:'李佳琪', phone:'13910001113', rScore:4, fScore:3, mScore:4, segment:'潜力客户', level:'高价值', source:'门店' },
  { customerName:'钱多多', phone:'13910001130', rScore:4, fScore:3, mScore:3, segment:'潜力客户', level:'高价值', source:'门店' },
  { customerName:'刘建国', phone:'13910001112', rScore:3, fScore:2, mScore:4, segment:'潜力客户', level:'高价值', source:'小程序' },
  { customerName:'测试用户2', phone:'13800000000', rScore:3, fScore:3, mScore:3, segment:'潜力客户', level:'学生', source:'校园认证' },
  { customerName:'黄子轩', phone:'13910001132', rScore:3, fScore:3, mScore:3, segment:'潜力客户', level:'普通', source:'小程序' },
  { customerName:'赵铁柱', phone:'13910001116', rScore:3, fScore:2, mScore:3, segment:'一般客户', level:'普通', source:'地推' },
  { customerName:'郑浩', phone:'13910001120', rScore:2, fScore:2, mScore:2, segment:'一般客户', level:'普通', source:'地推' },
  { customerName:'张晓萌', phone:'13910001114', rScore:2, fScore:1, mScore:2, segment:'流失风险客户', level:'普通', source:'门店' },
  { customerName:'林小慧', phone:'13910001131', rScore:1, fScore:1, mScore:1, segment:'流失风险客户', level:'普通', source:'小程序' },
]

const customerData = ref(RD)

const tierStats = computed(() => {
  const m = {}
  customerData.value.forEach(d => { m[d.segment] = (m[d.segment]||0)+1 })
  return Object.entries(m).map(([k,v]) => ({tier:k, count:v, color:tc[k]||'#909399'}))
})

function draw() {
  if (!sRef.value || !pRef.value) return
  if (!sc) sc = echarts.init(sRef.value)
  if (!pc) pc = echarts.init(pRef.value)

  sc.setOption({
    tooltip:{formatter:p=>{const d=p.data;return d?`<b>${d[3]}</b><br/>R:${d[0]} F:${d[1]} M:${d[2]}`:''}},
    grid:{left:40,right:20,top:10,bottom:30},
    xAxis:{name:'R值(近度)',max:6,min:0}, yAxis:{name:'F值(频次)',max:6,min:0},
    series: Object.entries(tc).map(([t,clr])=>({
      name:t, type:'scatter', symbolSize:d=>(d[2]||1)*8+8, itemStyle:{color:clr},
      data: customerData.value.filter(d=>d.segment===t).map(d=>[d.rScore,d.fScore,d.mScore,d.customerName]),
    })),
    legend:{bottom:0,textStyle:{fontSize:10}}
  }, true)

  pc.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c}人 ({d}%)'},
    series:[{type:'pie',radius:['45%','70%'],center:['50%','45%'],label:{show:true,formatter:'{b}\n{d}%'},
      data: tierStats.value.map(t=>({name:t.tier,value:t.count,itemStyle:{color:t.color}}))}]
  }, true)
}

onMounted(async () => {
  try {
    const res = await request.get('/ai/rfm-analysis')
    if (Array.isArray(res) && res.length) {
      customerData.value = res
    }
  } catch {}
  await nextTick()
  setTimeout(draw, 300)
})

onUnmounted(() => { sc?.dispose(); pc?.dispose() })
</script>

<style scoped>
.rfm-page{padding:0}
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px}
.stat-card{background:#fff;border-radius:12px;padding:16px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.stat-val{font-size:28px;font-weight:800;color:#1E293B}
.stat-label{font-size:13px;margin-top:2px;font-weight:600}
.chart-card{border-radius:12px;margin-bottom:0}
</style>
