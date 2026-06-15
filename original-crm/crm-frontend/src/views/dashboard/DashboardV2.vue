<template>
  <div class="dash-v3">
    <!-- 欢迎条 + 快捷操作 -->
    <div class="dash-welcome">
      <div>
        <h2>仪表盘</h2>
        <p class="text-muted">{{ greeting }}，{{ userName }}。今日有 <b>{{ pendingTasks }}</b> 项待处理。</p>
      </div>
      <div class="dash-actions">
        <button class="dash-btn primary" @click="$router.push('/customers')"><el-icon><Plus/></el-icon>新建客户</button>
        <button class="dash-btn" @click="$router.push('/orders')"><el-icon><Document/></el-icon>录入订单</button>
        <button class="dash-btn ghost" @click="$router.push('/ai-assistant')"><el-icon><MagicStick/></el-icon>AI 助手</button>
      </div>
    </div>

    <!-- 第一行：4张统计卡 -->
    <div class="kpi-row">
      <div v-for="(k,i) in kpis" :key="i" class="kpi-card" :class="k.theme">
        <div class="kpi-head">
          <div class="kpi-icon" :class="k.theme"><el-icon :size="20"><component :is="k.icon"/></el-icon></div>
          <span class="kpi-tag">{{ k.tag }}</span>
        </div>
        <div class="kpi-value">{{ k.value }}</div>
        <div class="kpi-foot">
          <span class="kpi-trend" :class="k.up?'up':'down'">{{ k.up?'↑':'↓' }} {{ Math.abs(k.delta) }}%</span>
          <span class="kpi-vs">较上月</span>
        </div>
        <div class="kpi-spark">
          <div v-for="(b,j) in k.bars" :key="j" class="kpi-bar" :style="{height:b+'%',background:k.barColor}"></div>
        </div>
      </div>
    </div>

    <!-- 第二行：销售趋势 (8列) + 销售漏斗 (4列) -->
    <div class="row-12">
      <div class="panel">
        <div class="panel-hd">
          <div>
            <h4>销售趋势</h4>
            <span class="text-muted text-sm">近 12 个月营收走势</span>
          </div>
          <div class="panel-tabs">
            <button v-for="t in ['月','季','年']" :key="t" :class="['ptab',t==='月'?'on':'']" @click="trendTab=t">{{ t }}</button>
          </div>
        </div>
        <div ref="trendRef" class="chart-area-lg"></div>
      </div>
      <div class="panel">
        <div class="panel-hd">
          <h4>销售漏斗</h4>
          <span class="text-muted text-sm">实时</span>
        </div>
        <div ref="funnelRef" class="chart-area-md"></div>
      </div>
    </div>

    <!-- 第三行：客户分布 (左) + 右侧活动流 -->
    <div class="row-12-split">
      <div class="panel">
        <div class="panel-hd">
          <h4>客户来源分布</h4>
          <span class="text-muted text-sm">本季度</span>
        </div>
        <div class="donut-wrap">
          <div ref="donutRef" class="donut-chart"></div>
          <div class="donut-legend">
            <div v-for="(c,i) in sources" :key="i" class="legend-row">
              <span class="legend-dot" :style="{background:c.color}"></span>
              <span class="legend-name">{{ c.name }}</span>
              <span class="legend-val">{{ c.value }}<small>%</small></span>
            </div>
            <div v-if="!sources.length" class="legend-empty">暂无客户来源数据</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-hd">
          <h4>最新动态</h4>
          <a class="text-link">查看全部</a>
        </div>
        <div class="activity-list">
          <div v-for="(a,i) in activities" :key="i" class="activity">
            <div class="activity-avatar" :style="{background:a.color}">{{ a.who?.substring(0,1) || '?' }}</div>
            <div class="activity-body">
              <div class="activity-line"><b>{{ a.who }}</b> {{ a.action }} <span class="activity-target">{{ a.target }}</span></div>
              <div class="activity-time">{{ formatTime(a.time) }}</div>
            </div>
            <div class="activity-amount" v-if="a.amount">+¥{{ Number(a.amount).toLocaleString() }}</div>
          </div>
          <div v-if="!activities.length" class="empty">暂无动态</div>
        </div>
      </div>
    </div>

    <!-- 第四行：今日优先级 (左) + 热销商品 (中) + 团队排名 (右) -->
    <div class="row-3">
      <div class="panel">
        <div class="panel-hd">
          <h4>今日优先级</h4>
          <span class="text-muted text-sm">{{ priorityList.length }} 项</span>
        </div>
        <div v-if="priorityList.length" class="priority-list">
          <div v-for="(p,i) in priorityList" :key="i" class="prio-item">
            <div class="prio-rank" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="prio-info">
              <div class="prio-name">{{ p.customerName || p.name }}</div>
              <div class="prio-reason">{{ p.reason }}</div>
            </div>
            <span class="prio-tag" :class="p.priority==='高'?'danger':'warn'">{{ p.priority || '中' }}</span>
          </div>
        </div>
        <div v-else class="empty">暂无待办，可先去喝杯水</div>
      </div>

      <div class="panel">
        <div class="panel-hd">
          <h4>热销商品 TOP 5</h4>
          <span class="text-muted text-sm">本月</span>
        </div>
        <div v-if="topProducts.length" class="top-list">
          <div v-for="(p,i) in topProducts" :key="p.id" class="top-item" @click="$router.push('/products')">
            <div class="top-rank" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="top-info">
              <div class="top-name">{{ p.name }}</div>
              <div class="top-meta">销量 {{ p.sales_count || p.total_qty || 0 }} · 库存 {{ p.stock || 0 }}</div>
            </div>
            <div class="top-rev">¥{{ ((p.price||0)).toLocaleString() }}</div>
          </div>
        </div>
        <div v-else class="empty">暂无销售数据</div>
      </div>

      <div class="panel">
        <div class="panel-hd">
          <h4>团队排名</h4>
          <span class="text-muted text-sm">本月</span>
        </div>
        <div v-if="teamRank.length" class="team-list">
          <div v-for="(t,i) in teamRank" :key="t.id" class="team-item">
            <div class="team-avatar" :style="{background:t.color}">{{ t.name?.substring(0,1) || '?' }}</div>
            <div class="team-info">
              <div class="team-name">{{ t.name }} <span class="team-tag" :class="i<3?'gold':'gray'">{{ i<3?['🥇','🥈','🥉'][i]:'员工' }}</span></div>
              <div class="team-meta">签单 {{ t.deals }} 单</div>
            </div>
            <div class="team-amount">¥{{ (t.amount/10000).toFixed(1) }}w</div>
          </div>
        </div>
        <div v-else class="empty">暂无团队数据</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, markRaw, computed } from 'vue'
import { User, Money, Plus, Connection, DataAnalysis, List, Document, MagicStick } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsApi, aiApi, productApi } from '@/api'

const trendRef = ref(null), funnelRef = ref(null), donutRef = ref(null)
let trendChart, funnelChart, donutChart
const trendTab = ref('月')
const userName = localStorage.getItem('realName') || '管理员'
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const pendingTasks = ref(0)
const priorityList = ref([])
const sources = ref([])
const activities = ref([])
const topProducts = ref([])
const teamRank = ref([])

const kpis = reactive([
  { label:'客户总数', value:'0', delta:12, up:true, theme:'blue',   tag:'累计', icon:markRaw(User),       barColor:'#3b82f6', bars:[40,55,48,70,62,80,75,90,85,95,88,100] },
  { label:'本月营收', value:'¥0', delta:8,  up:true, theme:'green',  tag:'本月', icon:markRaw(Money),      barColor:'#22c55e', bars:[35,50,45,65,58,75,70,85,80,90,82,95]  },
  { label:'活跃商机', value:'0', delta:15, up:true, theme:'purple', tag:'进行中', icon:markRaw(Connection),barColor:'#8b5cf6', bars:[30,45,40,55,50,68,65,78,72,85,80,92]  },
  { label:'待办任务', value:'0', delta:-5, up:false,theme:'red',    tag:'今日', icon:markRaw(List),       barColor:'#ef4444', bars:[80,75,70,68,60,55,50,48,45,40,38,35]  },
])

const fmt = v => v == null ? '¥0' : '¥' + Number(v).toLocaleString()
const SOURCE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#94a3b8','#ec4899','#06b6d4','#a855f7']

async function load() {
  // KPI + activities + priority in parallel
  const tasks = [
    analyticsApi.dashboard().then(d=>{
      kpis[0].value = String(d.totalCustomers || d.total_customers || 0)
      kpis[1].value = fmt(d.monthOrderAmount || d.total_amount)
      kpis[2].value = String(d.totalOpportunities || d.active_opportunities || 0)
      kpis[3].value = String(d.pendingTodos || d.pending_tasks || 0)
      pendingTasks.value = kpis[3].value
    }).catch(e=>console.error(e)),
    aiApi.todayPriority().then(p=>priorityList.value = (p||[]).slice(0,5)).catch(()=>{}),
    productApi.top(5).then(p=>topProducts.value = p||[]).catch(()=>{}),
    analyticsApi.customerSource().then(s=>{
      sources.value = (s||[]).map((r,i)=>({...r, color: SOURCE_COLORS[i%SOURCE_COLORS.length]}))
    }).catch(()=>{}),
    analyticsApi.employeeRanking().then(t=>teamRank.value = t||[]).catch(()=>{}),
    analyticsApi.recentActivities().then(a=>activities.value = a||[]).catch(()=>{}),
    analyticsApi.salesTrend(12).then(rows=>{
      const arr = rows || []
      console.log('[dashboard] sales-trend rows:', arr.length, 'sample:', arr[0])
      trendData.value = arr
    }).catch(e=>console.error('[sales-trend]', e)),
    analyticsApi.funnel().then(stages=>{
      const arr = stages || []
      console.log('[dashboard] funnel stages:', arr.length, 'sample:', arr[0])
      funnelData.value = arr
    }).catch(e=>console.error('[funnel]', e)),
  ]
  await Promise.allSettled(tasks)
  drawTrend(); drawFunnel(); drawDonut()
}

const trendData = ref([])
const funnelData = ref([])

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d)) return t
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff/60) + ' 分钟前'
  if (diff < 86400) return Math.floor(diff/3600) + ' 小时前'
  return Math.floor(diff/86400) + ' 天前'
}

function drawTrend() {
  if (!trendRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendRef.value)
  // 优先用真实数据，没有则用fallback
  let months, data
  if (trendData.value && trendData.value.length) {
    months = trendData.value.map(d => (d.month || '').replace(/-\d+$/, '').replace(/^(\d{4})-/, '$1-'))
    // 简化显示为 月份
    months = trendData.value.map(d => {
      const m = d.month || ''
      const parts = m.split('-')
      return parts.length === 2 ? `${parseInt(parts[1])}月` : m
    })
    data = trendData.value.map(d => d.amount || 0)
  } else {
    months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
    data = [18,22,25,28,31,26,35,38,32,40,37,42].map(v => v*1000)
  }
  trendChart.setOption({
    tooltip:{trigger:'axis',backgroundColor:'#fff',borderColor:'#e2e8f0',textStyle:{color:'#0f172a'}},
    grid:{left:8,right:24,top:24,bottom:8,containLabel:true},
    xAxis:{type:'category',data:months,axisLabel:{fontSize:11,color:'#94a3b8'},axisLine:{lineStyle:{color:'#e2e8f0'}},axisTick:{show:false}},
    yAxis:{type:'value',axisLabel:{fontSize:11,color:'#94a3b8',formatter:v=>(v/10000)+'万'},splitLine:{lineStyle:{color:'#f1f5f9'}}},
    series:[{type:'line',data,smooth:true,symbol:'circle',symbolSize:6,lineStyle:{color:'#3b82f6',width:2.5},itemStyle:{color:'#3b82f6'},
      areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(59,130,246,0.18)'},{offset:1,color:'rgba(59,130,246,0)'}])}}]
  })
}

function drawFunnel() {
  if (!funnelRef.value) return
  if (funnelChart) funnelChart.dispose()
  funnelChart = echarts.init(funnelRef.value)
  let data
  if (funnelData.value && funnelData.value.length) {
    const colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#c084fc','#e879f9']
    // funnel API returns: {stage, count, amount}
    data = funnelData.value.map((s,i) => ({
      name: s.stage,
      value: s.count,
      itemStyle: { color: colors[i%colors.length] }
    }))
  } else {
    data = [
      {value:100,name:'线索',itemStyle:{color:'#3b82f6'}},
      {value:72, name:'意向',itemStyle:{color:'#6366f1'}},
      {value:48, name:'报价',itemStyle:{color:'#8b5cf6'}},
      {value:24, name:'谈判',itemStyle:{color:'#a855f7'}},
      {value:12, name:'成交',itemStyle:{color:'#c084fc'}},
    ]
  }
  funnelChart.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c} 单'},
    series:[{type:'funnel',left:'10%',right:'10%',top:10,bottom:10,sort:'descending',gap:4,
      label:{show:true,position:'inside',color:'#fff',fontSize:12,fontWeight:600},
      itemStyle:{borderColor:'#fff',borderWidth:2},
      data}]
  })
}

function drawDonut() {
  if (!donutRef.value) return
  if (donutChart) donutChart.dispose()
  donutChart = echarts.init(donutRef.value)
  if (!sources.value.length) {
    donutRef.value.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#cbd5e1;font-size:13px">暂无数据</div>'
    return
  }
  donutChart.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c} 位 ({d}%)'},
    legend:{show:false},
    series:[{type:'pie',radius:['58%','78%'],center:['50%','50%'],avoidLabelOverlap:false,
      itemStyle:{borderColor:'#fff',borderWidth:3,borderRadius:4},
      label:{show:false},labelLine:{show:false},
      data:sources.value.map(s=>({value:s.value,name:s.name,itemStyle:{color:s.color}}))}]
  })
}

onMounted(()=>load())
onUnmounted(()=>{ trendChart?.dispose(); funnelChart?.dispose(); donutChart?.dispose() })
</script>

<style scoped>
.dash-v3{display:flex;flex-direction:column;gap:18px;padding:2px 0;color:#0f172a}
.dash-welcome{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);border-radius:14px;padding:22px 28px;color:#fff;box-shadow:0 4px 20px rgba(59,130,246,0.2)}
.dash-welcome h2{font-size:22px;font-weight:700;margin:0 0 4px 0;letter-spacing:-.01em}
.dash-welcome p{margin:0;font-size:13.5px;opacity:.92}
.dash-welcome b{background:rgba(255,255,255,.2);padding:1px 8px;border-radius:10px;font-weight:600}
.dash-actions{display:flex;gap:10px}
.dash-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;transition:all .15s}
.dash-btn:hover{background:rgba(255,255,255,.22);transform:translateY(-1px)}
.dash-btn.primary{background:#fff;color:#2563eb;border-color:#fff;font-weight:600}
.dash-btn.primary:hover{background:#f1f5f9;color:#1d4ed8}
.dash-btn.ghost{background:transparent}

.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.kpi-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;position:relative;overflow:hidden;transition:all .2s}
.kpi-card:hover{box-shadow:0 6px 20px rgba(0,0,0,0.06);transform:translateY(-2px);border-color:#cbd5e1}
.kpi-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.kpi-icon{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.kpi-icon.blue{background:#dbeafe;color:#2563eb}.kpi-icon.green{background:#dcfce7;color:#16a34a}.kpi-icon.purple{background:#f3e8ff;color:#9333ea}.kpi-icon.red{background:#fee2e2;color:#dc2626}
.kpi-tag{font-size:11px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:10px;font-weight:500}
.kpi-value{font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-.01em;line-height:1.2;margin-bottom:6px}
.kpi-foot{display:flex;align-items:baseline;gap:6px;font-size:12px}
.kpi-trend.up{color:#16a34a;font-weight:600}.kpi-trend.down{color:#dc2626;font-weight:600}
.kpi-vs{color:#94a3b8}
.kpi-spark{position:absolute;right:12px;bottom:0;height:34px;width:80px;display:flex;align-items:flex-end;gap:2px;opacity:.85}
.kpi-bar{flex:1;border-radius:2px 2px 0 0;min-height:3px;transition:height .3s}

.panel{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.panel-hd{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.panel-hd h4{font-size:14.5px;font-weight:600;color:#0f172a;margin:0 0 2px 0}
.panel-hd .text-muted{font-size:12px;color:#94a3b8}
.panel-tabs{display:flex;background:#f1f5f9;border-radius:6px;padding:2px}
.ptab{height:24px;padding:0 10px;border:none;background:transparent;color:#64748b;font-size:12px;cursor:pointer;border-radius:4px;transition:all .15s}
.ptab.on{background:#fff;color:#0f172a;box-shadow:0 1px 2px rgba(0,0,0,.05);font-weight:500}
.text-link{color:#3b82f6;font-size:12px;cursor:pointer}
.text-link:hover{text-decoration:underline}

.row-12{display:grid;grid-template-columns:2fr 1fr;gap:14px}
.row-12-split{display:grid;grid-template-columns:1fr 1.3fr;gap:14px}
.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}

.chart-area-lg{height:300px;padding:8px}
.chart-area-md{height:300px;padding:8px}
.donut-chart{width:100%;height:260px}

.donut-wrap{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:16px 20px;align-items:center}
.donut-legend{display:flex;flex-direction:column;gap:10px}
.legend-row{display:flex;align-items:center;gap:8px;font-size:13px}
.legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.legend-name{color:#475569;flex:1}
.legend-val{color:#0f172a;font-weight:600;font-family:var(--crm-font-mono)}
.legend-val small{color:#94a3b8;font-weight:400;font-size:10px;margin-left:1px}
.legend-empty{padding:8px;font-size:12px;color:#cbd5e1;text-align:center}

.activity-list{padding:8px 20px 16px;display:flex;flex-direction:column;max-height:330px;overflow-y:auto}
.activity{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9}
.activity:last-child{border-bottom:none}
.activity-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px;flex-shrink:0}
.activity-body{flex:1;min-width:0}
.activity-line{font-size:13px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.activity-line b{color:#0f172a}
.activity-target{color:#0f172a;font-weight:500}
.activity-time{font-size:11px;color:#94a3b8;margin-top:2px}
.activity-amount{font-size:12px;font-weight:600;color:#16a34a;font-family:var(--crm-font-mono)}

.priority-list{padding:12px 16px;display:flex;flex-direction:column;gap:8px;max-height:330px;overflow-y:auto}
.prio-item{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:8px;transition:all .15s}
.prio-item:hover{background:#f1f5f9}
.prio-rank{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
.prio-rank.r1{background:#ef4444}.prio-rank.r2{background:#f59e0b}.prio-rank.r3{background:#3b82f6}.prio-rank.r4,.prio-rank.r5{background:#94a3b8}
.prio-info{flex:1;min-width:0}
.prio-name{font-size:13px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prio-reason{font-size:11.5px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prio-tag{font-size:11px;padding:2px 8px;border-radius:10px;font-weight:500;flex-shrink:0}
.prio-tag.danger{background:#fee2e2;color:#dc2626}
.prio-tag.warn{background:#fef3c7;color:#d97706}

.top-list{padding:12px 16px;display:flex;flex-direction:column;gap:6px;max-height:330px;overflow-y:auto}
.top-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:all .15s;cursor:pointer}
.top-item:hover{background:#f8fafc}
.top-rank{width:22px;height:22px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
.top-rank.r1{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
.top-rank.r2{background:linear-gradient(135deg,#cbd5e1,#94a3b8)}
.top-rank.r3{background:linear-gradient(135deg,#fb923c,#ea580c)}
.top-rank.r4,.top-rank.r5{background:#e2e8f0;color:#64748b}
.top-info{flex:1;min-width:0}
.top-name{font-size:12.5px;font-weight:500;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.top-meta{font-size:11px;color:#94a3b8;margin-top:1px}
.top-rev{font-size:13px;font-weight:600;color:#0f172a;font-family:var(--crm-font-mono);flex-shrink:0}

.team-list{padding:12px 16px;display:flex;flex-direction:column;gap:6px;max-height:330px;overflow-y:auto}
.team-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:background .15s}
.team-item:hover{background:#f8fafc}
.team-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px;flex-shrink:0}
.team-info{flex:1;min-width:0}
.team-name{font-size:13px;font-weight:500;color:#0f172a;display:flex;align-items:center;gap:6px}
.team-tag{font-size:10px;padding:1px 6px;border-radius:8px;font-weight:500}
.team-tag.gold{background:linear-gradient(135deg,#fef3c7,#fde68a);color:#92400e}
.team-tag.gray{background:#f1f5f9;color:#64748b}
.team-meta{font-size:11px;color:#94a3b8;margin-top:1px}
.team-amount{font-size:13px;font-weight:700;color:#0f172a;font-family:var(--crm-font-mono);flex-shrink:0}

.empty{padding:30px 20px;text-align:center;color:#94a3b8;font-size:13px}

.text-muted{color:#94a3b8}
.text-sm{font-size:12px}

@media(max-width:1200px){.kpi-row{grid-template-columns:repeat(2,1fr)}.row-12,.row-12-split{grid-template-columns:1fr}.row-3{grid-template-columns:1fr}.dash-welcome{flex-direction:column;align-items:flex-start;gap:14px}}
@media(max-width:600px){.kpi-row{grid-template-columns:1fr}.donut-wrap{grid-template-columns:1fr}}
</style>
