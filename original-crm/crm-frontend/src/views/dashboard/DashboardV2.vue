<template>
  <div class="dash-v3">
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

    <!-- KPI cards -->
    <div class="kpi-row">
      <div v-for="k in kpis" :key="k.label" class="kpi-card" :class="k.theme">
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
          <div v-for="b in k.bars" :key="b" class="kpi-bar" :style="{height:b+'%',background:k.barColor}"></div>
        </div>
      </div>
    </div>

    <!-- Trend + Funnel -->
    <div class="row-12">
      <div class="panel">
        <div class="panel-hd"><h4>销售趋势</h4><div class="panel-tabs"><button class="ptab on">月</button></div></div>
        <div style="width:100%;height:320px;position:relative">
          <div ref="trendRef" style="width:100%;height:100%"></div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-hd"><h4>销售漏斗</h4></div>
        <div style="width:100%;height:320px;position:relative">
          <div ref="funnelRef" style="width:100%;height:100%"></div>
        </div>
      </div>
    </div>

    <!-- Source + Activities -->
    <div class="row-12-split">
      <div class="panel">
        <div class="panel-hd"><h4>客户来源分布</h4></div>
        <div class="donut-wrap">
          <div style="width:100%;height:260px;position:relative">
            <div ref="donutRef" style="width:100%;height:100%"></div>
          </div>
          <div class="donut-legend">
            <div v-for="(c,i) in sources" :key="i" class="legend-row">
              <span class="legend-dot" :style="{background:c.color}"></span>
              <span class="legend-name">{{ c.name }}</span>
              <span class="legend-val">{{ c.value }}<small>%</small></span>
            </div>
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-hd"><h4>最新动态</h4></div>
        <div class="activity-list">
          <div v-for="a in activities" :key="a.time" class="activity">
            <div class="activity-avatar" :style="{background:a.color}">{{ a.who?.[0] || '?' }}</div>
            <div class="activity-body">
              <div class="activity-line"><b>{{ a.who }}</b> {{ a.action }} <span class="activity-target">{{ a.target }}</span></div>
              <div class="activity-time">{{ formatTime(a.time) }}</div>
            </div>
            <div class="activity-amount" v-if="a.amount">+¥{{ Number(a.amount).toLocaleString() }}</div>
          </div>
          <div v-if="activities.length===0" class="empty">暂无动态</div>
        </div>
      </div>
    </div>

    <!-- Priority + Products + Team -->
    <div class="row-3">
      <div class="panel">
        <div class="panel-hd"><h4>今日优先级</h4></div>
        <div class="priority-list">
          <div v-for="(p,i) in priorityList" :key="i" class="prio-item">
            <div class="prio-rank" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="prio-info">
              <div class="prio-name">{{ p.customerName || p.name }}</div>
              <div class="prio-reason">{{ p.reason }}</div>
            </div>
            <span class="prio-tag" :class="p.priority==='高'?'danger':'warn'">{{ p.priority || '中' }}</span>
          </div>
          <div v-if="priorityList.length===0" class="empty">暂无待办</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-hd"><h4>热销商品 TOP 5</h4></div>
        <div class="top-list">
          <div v-for="(p,i) in topProducts" :key="p.id" class="top-item" @click="$router.push('/products')">
            <div class="top-rank" :class="'r'+(i+1)">{{ i+1 }}</div>
            <div class="top-info">
              <div class="top-name">{{ p.name }}</div>
              <div class="top-meta">销量 {{ p.sales_count||p.total_qty||0 }} · 库存 {{ p.stock||0 }}</div>
            </div>
            <div class="top-rev">¥{{ (p.price||0).toLocaleString() }}</div>
          </div>
          <div v-if="topProducts.length===0" class="empty">暂无数据</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-hd"><h4>团队排名</h4></div>
        <div class="team-list">
          <div v-for="(t,i) in teamRank" :key="t.id" class="team-item">
            <div class="team-avatar" :style="{background:t.color}">{{ t.name?.[0] || '?' }}</div>
            <div class="team-info">
              <div class="team-name">{{ t.name }}</div>
              <div class="team-meta">签单 {{ t.deals }} 单</div>
            </div>
            <div class="team-amount">¥{{ (t.amount/10000).toFixed(1) }}w</div>
          </div>
          <div v-if="teamRank.length===0" class="empty">暂无数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, markRaw, computed, nextTick } from 'vue'
import { User, Money, Plus, Connection, List, Document, MagicStick } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { analyticsApi, aiApi, productApi } from '@/api'

const trendRef = ref(null)
const funnelRef = ref(null)
const donutRef = ref(null)
let trendChart = null, funnelChart = null, donutChart = null

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
  { label:'活跃商机', value:'0', delta:15, up:true, theme:'purple', tag:'进行中', icon:markRaw(Connection),  barColor:'#8b5cf6', bars:[30,45,40,55,50,68,65,78,72,85,80,92]  },
  { label:'待办任务', value:'0', delta:-5, up:false,theme:'red',    tag:'今日', icon:markRaw(List),        barColor:'#ef4444', bars:[80,75,70,68,60,55,50,48,45,40,38,35]  },
])

const fmt = v => v == null ? '¥0' : '¥' + Number(v).toLocaleString()
const SOURCE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#94a3b8','#ec4899','#06b6d4','#a855f7']

onMounted(() => {
  setTimeout(() => loadAll(), 100) // tiny delay ensures DOM is ready
})

onUnmounted(() => { trendChart?.dispose(); funnelChart?.dispose(); donutChart?.dispose() })

async function loadAll() {
  try {
    const [dash, priority, products, source, ranking, activitiesRes] = await Promise.allSettled([
      analyticsApi.dashboard(),
      aiApi.todayPriority(),
      productApi.top(5),
      analyticsApi.customerSource(),
      analyticsApi.employeeRanking(),
      analyticsApi.recentActivities(),
    ])
    if (dash.status === 'fulfilled' && dash.value) {
      kpis[0].value = String(dash.value.totalCustomers || dash.value.total_customers || 0)
      kpis[1].value = fmt(dash.value.monthOrderAmount || dash.value.total_amount)
      kpis[2].value = String(dash.value.totalOpportunities || dash.value.active_opportunities || 0)
      kpis[3].value = String(dash.value.pendingTodos || dash.value.pending_tasks || 0)
      pendingTasks.value = kpis[3].value
    }
    if (priority.status === 'fulfilled') priorityList.value = (priority.value||[]).slice(0,5)
    if (products.status === 'fulfilled') topProducts.value = products.value || []
    if (source.status === 'fulfilled') {
      sources.value = (source.value||[]).map((r,i)=>({...r, color: SOURCE_COLORS[i%SOURCE_COLORS.length]}))
    }
    if (ranking.status === 'fulfilled') teamRank.value = ranking.value || []
    if (activitiesRes.status === 'fulfilled') activities.value = activitiesRes.value || []
  } catch (e) { console.error('Dashboard load error:', e) }
  await nextTick()
  setTimeout(initCharts, 200)
}

function initCharts() {
  initTrend(); initFunnel(); initDonut()
}

function initTrend() {
  const el = trendRef.value
  if (!el) { console.warn('trendRef missing'); return }
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(el)
  trendChart.setOption({
    tooltip:{trigger:'axis'},
    grid:{left:10,right:30,top:20,bottom:20,containLabel:true},
    xAxis:{type:'category',data:['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],axisLabel:{fontSize:11,color:'#94a3b8'}},
    yAxis:{type:'value',axisLabel:{fontSize:11,color:'#94a3b8',formatter:v=>v===0?'0':(v/10000)+'万'},splitLine:{lineStyle:{color:'#f1f5f9'}}},
    series:[{type:'line',data:[18000,22000,25000,28000,31000,26000,35000,38000,32000,40000,37000,42000],smooth:true,symbol:'circle',symbolSize:6,
      lineStyle:{color:'#3b82f6',width:2.5},itemStyle:{color:'#3b82f6'},
      areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(59,130,246,0.22)'},{offset:1,color:'rgba(59,130,246,0)'}])}
    }]
  })
}

function initFunnel() {
  const el = funnelRef.value
  if (!el) { console.warn('funnelRef missing'); return }
  if (funnelChart) funnelChart.dispose()
  funnelChart = echarts.init(el)
  funnelChart.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c} 单'},
    series:[{type:'funnel',left:'10%',right:'10%',top:10,bottom:10,width:'80%',sort:'descending',gap:4,
      label:{show:true,position:'inside',color:'#fff',fontSize:12,fontWeight:600},
      data:[
        {value:100,name:'线索',itemStyle:{color:'#3b82f6'}},
        {value:72, name:'意向',itemStyle:{color:'#6366f1'}},
        {value:48, name:'报价',itemStyle:{color:'#8b5cf6'}},
        {value:24, name:'谈判',itemStyle:{color:'#a855f7'}},
        {value:12, name:'成交',itemStyle:{color:'#c084fc'}},
      ]}]
  })
}

function initDonut() {
  const el = donutRef.value
  if (!el) { console.warn('donutRef missing'); return }
  if (donutChart) donutChart.dispose()
  donutChart = echarts.init(el)
  const data = sources.value.length ? sources.value.map(s=>({value:s.value,name:s.name,itemStyle:{color:s.color}})) : [
    {value:38,name:'官网',itemStyle:{color:'#3b82f6'}},
    {value:24,name:'微信',itemStyle:{color:'#22c55e'}},
    {value:18,name:'转介绍',itemStyle:{color:'#f59e0b'}},
    {value:12,name:'电话',itemStyle:{color:'#8b5cf6'}},
    {value:8,name:'其他',itemStyle:{color:'#94a3b8'}},
  ]
  donutChart.setOption({
    tooltip:{trigger:'item',formatter:'{b}: {c}%'},
    series:[{type:'pie',radius:['55%','75%'],center:['50%','50%'],itemStyle:{borderColor:'#fff',borderWidth:3,borderRadius:4},label:{show:false},data}]
  })
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  if (isNaN(d)) return t
  const diff = (Date.now() - d.getTime())/1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff/60)+'分钟前'
  if (diff < 86400) return Math.floor(diff/3600)+'小时前'
  return Math.floor(diff/86400)+'天前'
}
</script>

<style scoped>
.dash-v3{display:flex;flex-direction:column;gap:18px;padding:2px 0;color:#0f172a}
.dash-welcome{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%);border-radius:14px;padding:22px 28px;color:#fff;box-shadow:0 4px 20px rgba(59,130,246,0.2);flex-wrap:wrap;gap:14px}
.dash-welcome h2{font-size:22px;font-weight:700;margin:0 0 4px 0;letter-spacing:-.01em}
.dash-welcome p{margin:0;font-size:13.5px;opacity:.92}
.dash-welcome b{background:rgba(255,255,255,.2);padding:1px 8px;border-radius:10px;font-weight:600}
.dash-actions{display:flex;gap:10px;flex-wrap:wrap}
.dash-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;transition:all .15s;white-space:nowrap}
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
.panel-hd h4{font-size:14.5px;font-weight:600;color:#0f172a;margin:0}
.panel-tabs{display:flex;background:#f1f5f9;border-radius:6px;padding:2px}
.ptab{height:24px;padding:0 10px;border:none;background:transparent;color:#64748b;font-size:12px;cursor:pointer;border-radius:4px}
.ptab.on{background:#fff;color:#0f172a;box-shadow:0 1px 2px rgba(0,0,0,.05);font-weight:500}

.row-12{display:grid;grid-template-columns:2fr 1fr;gap:14px}
.row-12-split{display:grid;grid-template-columns:1fr 1.3fr;gap:14px}
.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}

.donut-wrap{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:16px 20px;align-items:center}
.donut-legend{display:flex;flex-direction:column;gap:10px}
.legend-row{display:flex;align-items:center;gap:8px;font-size:13px}
.legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0}
.legend-name{color:#475569;flex:1}
.legend-val{color:#0f172a;font-weight:600;font-family:var(--crm-font-mono)}
.legend-val small{color:#94a3b8;font-weight:400;font-size:10px;margin-left:1px}

.activity-list{padding:8px 20px 16px;display:flex;flex-direction:column;max-height:330px;overflow-y:auto}
.activity{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f1f5f9}
.activity:last-child{border-bottom:none}
.activity-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px;flex-shrink:0}
.activity-body{flex:1;min-width:0}
.activity-line{font-size:13px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.activity-line b{color:#0f172a}
.activity-target{color:#0f172a;font-weight:500}
.activity-time{font-size:11px;color:#94a3b8;margin-top:2px}
.activity-amount{font-size:12px;font-weight:600;color:#16a34a;font-family:var(--crm-font-mono);flex-shrink:0}

.priority-list,.top-list,.team-list{padding:12px 16px;display:flex;flex-direction:column;gap:6px;max-height:330px;overflow-y:auto}
.prio-item,.top-item,.team-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:6px;transition:background .15s}
.prio-item:hover,.top-item:hover,.team-item:hover{background:#f8fafc}
.prio-rank,.top-rank{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
.prio-rank.r1,.top-rank.r1{background:linear-gradient(135deg,#fbbf24,#f59e0b)}
.prio-rank.r2,.top-rank.r2{background:linear-gradient(135deg,#cbd5e1,#94a3b8)}
.prio-rank.r3,.top-rank.r3{background:linear-gradient(135deg,#fb923c,#ea580c)}
.prio-rank.r4,.prio-rank.r5,.top-rank.r4,.top-rank.r5{background:#e2e8f0;color:#64748b}
.prio-info,.top-info{flex:1;min-width:0}
.prio-name,.top-name{font-size:13px;font-weight:600;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.prio-reason{font-size:11.5px;color:#64748b;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.top-meta,.team-meta{font-size:11px;color:#94a3b8;margin-top:1px}
.prio-tag{font-size:11px;padding:2px 8px;border-radius:10px;font-weight:500;flex-shrink:0}
.prio-tag.danger{background:#fee2e2;color:#dc2626}
.prio-tag.warn{background:#fef3c7;color:#d97706}
.top-rev,.team-amount{font-size:13px;font-weight:600;color:#0f172a;font-family:var(--crm-font-mono);flex-shrink:0}

.team-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:13px;flex-shrink:0}
.team-info{flex:1;min-width:0}
.team-name{font-size:13px;font-weight:500;color:#0f172a}

.empty{padding:30px 20px;text-align:center;color:#94a3b8;font-size:13px}
.text-muted{color:#94a3b8}

@media(max-width:1200px){.kpi-row{grid-template-columns:repeat(2,1fr)}.row-12,.row-12-split{grid-template-columns:1fr}.row-3{grid-template-columns:1fr}}
@media(max-width:600px){.kpi-row{grid-template-columns:1fr}.donut-wrap{grid-template-columns:1fr}}
</style>
